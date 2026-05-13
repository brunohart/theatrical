"""Tests for Vista error codes and message resolution."""

from theatrical.errors.codes import (
    AUTH_TOKEN_EXPIRED,
    INTERNAL_ERROR,
    SESSION_NOT_FOUND,
    VISTA_ERROR_MESSAGES,
    resolve_message,
)


class TestVistaErrorCodes:
    def test_all_codes_have_messages(self) -> None:
        codes = [
            "AUTH_TOKEN_EXPIRED", "AUTH_TOKEN_INVALID", "AUTH_TOKEN_MISSING",
            "AUTH_INSUFFICIENT_SCOPE", "AUTH_API_KEY_INVALID",
            "RATE_LIMIT_EXCEEDED", "QUOTA_EXCEEDED",
            "VALIDATION_FAILED", "INVALID_PARAMETER", "MISSING_REQUIRED_FIELD",
            "INVALID_DATE_FORMAT", "INVALID_CURRENCY",
            "SESSION_NOT_FOUND", "SESSION_EXPIRED", "SESSION_SOLD_OUT",
            "SEAT_UNAVAILABLE", "FILM_NOT_FOUND", "SITE_NOT_FOUND",
            "ORDER_NOT_FOUND", "ORDER_ALREADY_CONFIRMED",
            "ORDER_CANCELLATION_WINDOW_EXPIRED", "MEMBER_NOT_FOUND",
            "INTERNAL_ERROR", "SERVICE_UNAVAILABLE", "UPSTREAM_TIMEOUT",
        ]
        for code in codes:
            assert code in VISTA_ERROR_MESSAGES

    def test_message_count_is_25(self) -> None:
        assert len(VISTA_ERROR_MESSAGES) == 25


class TestResolveMessage:
    def test_known_code_returns_mapped_message(self) -> None:
        msg = resolve_message(AUTH_TOKEN_EXPIRED, "fallback")
        assert msg == "Your access token has expired. Re-authenticate and retry."

    def test_unknown_code_returns_fallback(self) -> None:
        msg = resolve_message("UNKNOWN_CODE", "the fallback")
        assert msg == "the fallback"

    def test_none_code_returns_fallback(self) -> None:
        msg = resolve_message(None, "default message")
        assert msg == "default message"

    def test_session_not_found(self) -> None:
        msg = resolve_message(SESSION_NOT_FOUND, "fallback")
        assert "session" in msg.lower()

    def test_internal_error(self) -> None:
        msg = resolve_message(INTERNAL_ERROR, "fallback")
        assert "internal" in msg.lower()
