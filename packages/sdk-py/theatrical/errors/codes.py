"""Vista platform error codes and human-readable message mappings."""

from __future__ import annotations

AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED"
AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID"
AUTH_TOKEN_MISSING = "AUTH_TOKEN_MISSING"
AUTH_INSUFFICIENT_SCOPE = "AUTH_INSUFFICIENT_SCOPE"
AUTH_API_KEY_INVALID = "AUTH_API_KEY_INVALID"

RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
QUOTA_EXCEEDED = "QUOTA_EXCEEDED"

VALIDATION_FAILED = "VALIDATION_FAILED"
INVALID_PARAMETER = "INVALID_PARAMETER"
MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
INVALID_DATE_FORMAT = "INVALID_DATE_FORMAT"
INVALID_CURRENCY = "INVALID_CURRENCY"

SESSION_NOT_FOUND = "SESSION_NOT_FOUND"
SESSION_EXPIRED = "SESSION_EXPIRED"
SESSION_SOLD_OUT = "SESSION_SOLD_OUT"
SEAT_UNAVAILABLE = "SEAT_UNAVAILABLE"
FILM_NOT_FOUND = "FILM_NOT_FOUND"
SITE_NOT_FOUND = "SITE_NOT_FOUND"
ORDER_NOT_FOUND = "ORDER_NOT_FOUND"
ORDER_ALREADY_CONFIRMED = "ORDER_ALREADY_CONFIRMED"
ORDER_CANCELLATION_WINDOW_EXPIRED = "ORDER_CANCELLATION_WINDOW_EXPIRED"
MEMBER_NOT_FOUND = "MEMBER_NOT_FOUND"

INTERNAL_ERROR = "INTERNAL_ERROR"
SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
UPSTREAM_TIMEOUT = "UPSTREAM_TIMEOUT"

VISTA_ERROR_MESSAGES: dict[str, str] = {
    AUTH_TOKEN_EXPIRED: "Your access token has expired. Re-authenticate and retry.",
    AUTH_TOKEN_INVALID: "The provided access token is invalid.",
    AUTH_TOKEN_MISSING: "No access token was provided.",
    AUTH_INSUFFICIENT_SCOPE: "The access token does not have the required permissions.",
    AUTH_API_KEY_INVALID: "The API key is invalid or has been revoked.",
    RATE_LIMIT_EXCEEDED: "Too many requests. Please slow down.",
    QUOTA_EXCEEDED: "API quota exceeded for this billing period.",
    VALIDATION_FAILED: "One or more fields failed validation.",
    INVALID_PARAMETER: "A request parameter contains an invalid value.",
    MISSING_REQUIRED_FIELD: "A required field is missing from the request.",
    INVALID_DATE_FORMAT: "Date must be in ISO 8601 format (YYYY-MM-DD).",
    INVALID_CURRENCY: "Currency code must be a valid ISO 4217 code (e.g. NZD, AUD).",
    SESSION_NOT_FOUND: "The requested session does not exist.",
    SESSION_EXPIRED: "This session has already passed.",
    SESSION_SOLD_OUT: "This session is sold out.",
    SEAT_UNAVAILABLE: "One or more selected seats are no longer available.",
    FILM_NOT_FOUND: "The requested film does not exist.",
    SITE_NOT_FOUND: "The requested cinema site does not exist.",
    ORDER_NOT_FOUND: "The requested order does not exist.",
    ORDER_ALREADY_CONFIRMED: "This order has already been confirmed.",
    ORDER_CANCELLATION_WINDOW_EXPIRED: "The cancellation window for this order has passed.",
    MEMBER_NOT_FOUND: "The requested member does not exist.",
    INTERNAL_ERROR: "An internal server error occurred. Please try again.",
    SERVICE_UNAVAILABLE: "The service is temporarily unavailable.",
    UPSTREAM_TIMEOUT: "The upstream service timed out.",
}


def resolve_message(code: str | None, fallback: str) -> str:
    if code is None:
        return fallback
    return VISTA_ERROR_MESSAGES.get(code, fallback)
