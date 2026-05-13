"""Parse HTTP error responses into typed TheatricalError subclasses."""

from __future__ import annotations

from email.utils import parsedate_to_datetime
from typing import Any
from urllib.parse import urlparse

import httpx

from theatrical.errors.codes import resolve_message
from theatrical.errors.exceptions import (
    AuthenticationError,
    NotFoundError,
    RateLimitError,
    ServerError,
    TheatricalError,
    ValidationError,
)

_CODE_TO_RESOURCE: dict[str, str] = {
    "SESSION_NOT_FOUND": "Session",
    "FILM_NOT_FOUND": "Film",
    "SITE_NOT_FOUND": "Site",
    "ORDER_NOT_FOUND": "Order",
    "MEMBER_NOT_FOUND": "Member",
}


def _try_parse_body(response: httpx.Response) -> dict[str, Any] | None:
    try:
        text = response.text
        if not text:
            return None
        return response.json()  # type: ignore[no-any-return]
    except Exception:
        return None


def _parse_retry_after(response: httpx.Response) -> float:
    raw = response.headers.get("retry-after")
    if raw is None:
        return 60.0

    try:
        seconds = int(raw)
        if seconds >= 0:
            return float(seconds)
    except ValueError:
        pass

    try:
        from datetime import datetime, timezone

        dt = parsedate_to_datetime(raw)
        delta = (dt - datetime.now(timezone.utc)).total_seconds()
        return max(0.0, delta)
    except Exception:
        pass

    return 60.0


def _infer_resource_from_url(url: str | None) -> str:
    if url is None:
        return "Resource"
    try:
        parsed = urlparse(url)
        segments = [s for s in parsed.path.split("/") if s]
        if len(segments) >= 2:
            noun = segments[-2]
            if len(noun) > 1 and noun.endswith("s"):
                return noun[0].upper() + noun[1:-1]
    except Exception:
        pass
    return "Resource"


def _extract_resource(
    vista_code: str | None, request_url: str | None
) -> tuple[str, str]:
    resource = (
        _CODE_TO_RESOURCE.get(vista_code, _infer_resource_from_url(request_url))
        if vista_code
        else _infer_resource_from_url(request_url)
    )

    resource_id = "unknown"
    if request_url is not None:
        try:
            parsed = urlparse(request_url)
            segments = [s for s in parsed.path.split("/") if s]
            if segments:
                resource_id = segments[-1]
        except Exception:
            pass

    return resource, resource_id


def parse_error_response(
    response: httpx.Response, request_url: str | None = None
) -> TheatricalError:
    status = response.status_code
    body = _try_parse_body(response)

    vista_code: str | None = None
    message: str | None = None
    request_id: str | None = None
    field_errors: dict[str, str] = {}

    if body is not None:
        if "code" in body:
            vista_code = body["code"]
        if "message" in body:
            message = body["message"]
        if "requestId" in body:
            request_id = body["requestId"]
        if "errors" in body and isinstance(body["errors"], list):
            for err in body["errors"]:
                field = err.get("field")
                msg = err.get("message")
                if field is not None and msg is not None:
                    field_errors[field] = msg

        if vista_code is None and "fault" in body:
            fault = body["fault"]
            if isinstance(fault, dict):
                vista_code = fault.get("type")
                message = fault.get("message")

    resolved_message = resolve_message(
        vista_code, message or f"Request failed with status {status}"
    )

    if status in (401, 403):
        return AuthenticationError(resolved_message, vista_code, request_id)

    if status == 429:
        retry_after = _parse_retry_after(response)
        return RateLimitError(retry_after, request_id)

    if status in (400, 422):
        return ValidationError(resolved_message, field_errors, request_id)

    if status == 404:
        resource, resource_id = _extract_resource(vista_code, request_url)
        return NotFoundError(resource, resource_id, request_id)

    if status >= 500:
        return ServerError(resolved_message, vista_code, request_id)

    return TheatricalError(resolved_message, status, vista_code, request_id)
