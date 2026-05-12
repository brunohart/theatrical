"""Tests for the error hierarchy."""

import json

from theatrical.errors.exceptions import (
    AuthenticationError,
    NotFoundError,
    RateLimitError,
    ServerError,
    TheatricalError,
    ValidationError,
)


class TestTheatricalError:
    def test_carries_status_code_and_request_id(self) -> None:
        err = TheatricalError("test error", 500, "VISTA_001", "req-123")
        assert str(err) == "test error"
        assert err.status_code == 500
        assert err.vista_error_code == "VISTA_001"
        assert err.request_id == "req-123"

    def test_to_json_serializes_correctly(self) -> None:
        err = TheatricalError("test", 500, "CODE", "req-1")
        data = json.loads(err.to_json())
        assert data["status_code"] == 500
        assert data["vista_error_code"] == "CODE"
        assert data["request_id"] == "req-1"

    def test_to_dict(self) -> None:
        err = TheatricalError("msg", 400)
        d = err.to_dict()
        assert d["name"] == "TheatricalError"
        assert d["message"] == "msg"
        assert d["status_code"] == 400
        assert d["vista_error_code"] is None
        assert d["request_id"] is None


class TestAuthenticationError:
    def test_has_status_code_401(self) -> None:
        err = AuthenticationError()
        assert err.status_code == 401
        assert str(err) == "Authentication failed"

    def test_custom_message(self) -> None:
        err = AuthenticationError("Token expired", "AUTH_TOKEN_EXPIRED")
        assert str(err) == "Token expired"
        assert err.vista_error_code == "AUTH_TOKEN_EXPIRED"


class TestRateLimitError:
    def test_carries_retry_after(self) -> None:
        err = RateLimitError(30.0, "req-429")
        assert err.status_code == 429
        assert err.retry_after == 30.0
        assert "30" in str(err)
        assert err.request_id == "req-429"


class TestValidationError:
    def test_carries_field_errors(self) -> None:
        fields = {"email": "invalid format"}
        err = ValidationError("Validation failed", fields)
        assert err.status_code == 400
        assert err.fields["email"] == "invalid format"

    def test_empty_fields_default(self) -> None:
        err = ValidationError("Bad request")
        assert err.fields == {}


class TestNotFoundError:
    def test_carries_resource_info(self) -> None:
        err = NotFoundError("Session", "ses-001", "req-404")
        assert err.status_code == 404
        assert err.resource == "Session"
        assert err.resource_id == "ses-001"
        assert "ses-001" in str(err)


class TestServerError:
    def test_has_status_code_500(self) -> None:
        err = ServerError()
        assert err.status_code == 500
        assert str(err) == "Internal server error"

    def test_custom_message(self) -> None:
        err = ServerError("Gateway timeout", "req-500")
        assert str(err) == "Gateway timeout"
        assert err.request_id == "req-500"
