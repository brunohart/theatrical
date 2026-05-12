"""Exception classes for the Theatrical SDK."""

from __future__ import annotations

import json
from typing import Optional


class TheatricalError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int,
        vista_error_code: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.vista_error_code = vista_error_code
        self.request_id = request_id

    def to_dict(self) -> dict[str, object]:
        return {
            "name": type(self).__name__,
            "message": str(self),
            "status_code": self.status_code,
            "vista_error_code": self.vista_error_code,
            "request_id": self.request_id,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict())


class AuthenticationError(TheatricalError):
    def __init__(
        self,
        message: str = "Authentication failed",
        vista_error_code: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> None:
        super().__init__(message, 401, vista_error_code, request_id)


class RateLimitError(TheatricalError):
    def __init__(
        self,
        retry_after: float,
        request_id: Optional[str] = None,
    ) -> None:
        super().__init__(
            f"Rate limit exceeded. Retry after {retry_after}s",
            429,
            request_id=request_id,
        )
        self.retry_after = retry_after


class ValidationError(TheatricalError):
    def __init__(
        self,
        message: str,
        fields: Optional[dict[str, str]] = None,
        request_id: Optional[str] = None,
    ) -> None:
        super().__init__(message, 400, request_id=request_id)
        self.fields: dict[str, str] = fields or {}


class NotFoundError(TheatricalError):
    def __init__(
        self,
        resource: str,
        resource_id: str,
        request_id: Optional[str] = None,
    ) -> None:
        super().__init__(
            f"{resource} '{resource_id}' not found",
            404,
            request_id=request_id,
        )
        self.resource = resource
        self.resource_id = resource_id


class ServerError(TheatricalError):
    def __init__(
        self,
        message: str = "Internal server error",
        request_id: Optional[str] = None,
    ) -> None:
        super().__init__(message, 500, request_id=request_id)
