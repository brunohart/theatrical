"""Error hierarchy for the theatrical Python SDK.

Exception tree:
    TheatricalError (base)
    +-- AuthenticationError  (401/403 from GAS or OCAPI)
    +-- NotFoundError        (404)
    +-- RateLimitError       (429, includes retry_after_seconds)
    +-- ServerError          (5xx)
    +-- ValidationError      (request validation failures)

All errors carry:
    - message: human-readable description
    - status_code: HTTP status (if from API)
    - request_id: correlation ID for Vista support
    - vista_error_code: OCAPI error code (if present)
"""

from theatrical.errors.exceptions import (
    AuthenticationError,
    NotFoundError,
    RateLimitError,
    ServerError,
    TheatricalError,
    ValidationError,
)

__all__ = [
    "AuthenticationError",
    "NotFoundError",
    "RateLimitError",
    "ServerError",
    "TheatricalError",
    "ValidationError",
]
