"""Tests for the HTTP error response parser."""

import json

import httpx

from theatrical.errors.exceptions import (
    AuthenticationError,
    NotFoundError,
    RateLimitError,
    ServerError,
    TheatricalError,
    ValidationError,
)
from theatrical.errors.parser import parse_error_response


def _make_response(
    status_code: int,
    body: dict | list | None = None,
    headers: dict[str, str] | None = None,
) -> httpx.Response:
    content = json.dumps(body).encode() if body is not None else b""
    return httpx.Response(
        status_code=status_code,
        content=content,
        headers=headers or {},
        request=httpx.Request("GET", "https://api.vista.co/test"),
    )


class TestParseErrorResponse:
    def test_401_returns_authentication_error(self) -> None:
        resp = _make_response(401, {"code": "AUTH_TOKEN_EXPIRED", "message": "Token expired"})
        err = parse_error_response(resp)
        assert isinstance(err, AuthenticationError)
        assert err.vista_error_code == "AUTH_TOKEN_EXPIRED"

    def test_403_returns_authentication_error(self) -> None:
        resp = _make_response(403, {"code": "AUTH_INSUFFICIENT_SCOPE"})
        err = parse_error_response(resp)
        assert isinstance(err, AuthenticationError)

    def test_429_returns_rate_limit_error_with_retry_after(self) -> None:
        resp = _make_response(429, {}, {"retry-after": "30"})
        err = parse_error_response(resp)
        assert isinstance(err, RateLimitError)
        assert err.retry_after == 30.0

    def test_429_defaults_to_60s_without_header(self) -> None:
        resp = _make_response(429, {})
        err = parse_error_response(resp)
        assert isinstance(err, RateLimitError)
        assert err.retry_after == 60.0

    def test_400_returns_validation_error(self) -> None:
        resp = _make_response(400, {
            "code": "VALIDATION_FAILED",
            "message": "Validation failed",
            "errors": [
                {"field": "email", "message": "invalid format"},
                {"field": "date", "message": "must be ISO 8601"},
            ],
        })
        err = parse_error_response(resp)
        assert isinstance(err, ValidationError)
        assert err.fields["email"] == "invalid format"
        assert err.fields["date"] == "must be ISO 8601"

    def test_422_returns_validation_error(self) -> None:
        resp = _make_response(422, {"message": "Unprocessable"})
        err = parse_error_response(resp)
        assert isinstance(err, ValidationError)

    def test_404_returns_not_found_with_resource_from_code(self) -> None:
        resp = _make_response(404, {"code": "SESSION_NOT_FOUND"})
        err = parse_error_response(resp, "https://api.vista.co/ocapi/v1/sessions/ses-001")
        assert isinstance(err, NotFoundError)
        assert err.resource == "Session"
        assert err.resource_id == "ses-001"

    def test_404_infers_resource_from_url(self) -> None:
        resp = _make_response(404, {})
        err = parse_error_response(resp, "https://api.vista.co/ocapi/v1/films/film-abc")
        assert isinstance(err, NotFoundError)
        assert err.resource == "Film"
        assert err.resource_id == "film-abc"

    def test_500_returns_server_error(self) -> None:
        resp = _make_response(500, {"code": "INTERNAL_ERROR"})
        err = parse_error_response(resp)
        assert isinstance(err, ServerError)
        assert err.vista_error_code == "INTERNAL_ERROR"

    def test_502_returns_server_error(self) -> None:
        resp = _make_response(502, {"message": "Bad gateway"})
        err = parse_error_response(resp)
        assert isinstance(err, ServerError)

    def test_503_returns_server_error(self) -> None:
        resp = _make_response(503, {"code": "SERVICE_UNAVAILABLE"})
        err = parse_error_response(resp)
        assert isinstance(err, ServerError)
        assert err.vista_error_code == "SERVICE_UNAVAILABLE"

    def test_ocapi_fault_format(self) -> None:
        resp = _make_response(500, {
            "fault": {
                "type": "UPSTREAM_TIMEOUT",
                "message": "POS timed out",
            }
        })
        err = parse_error_response(resp)
        assert isinstance(err, ServerError)
        assert err.vista_error_code == "UPSTREAM_TIMEOUT"

    def test_empty_body_uses_status_fallback(self) -> None:
        resp = _make_response(418)
        err = parse_error_response(resp)
        assert isinstance(err, TheatricalError)
        assert err.status_code == 418
        assert "418" in str(err)

    def test_request_id_is_extracted(self) -> None:
        resp = _make_response(400, {
            "code": "VALIDATION_FAILED",
            "message": "Bad input",
            "requestId": "req-xyz-123",
        })
        err = parse_error_response(resp)
        assert err.request_id == "req-xyz-123"
