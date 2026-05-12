"""Theatrical SDK error hierarchy."""

from theatrical.errors.exceptions import (
    TheatricalError,
    AuthenticationError,
    RateLimitError,
    ValidationError,
    NotFoundError,
    ServerError,
)

__all__ = [
    "TheatricalError",
    "AuthenticationError",
    "RateLimitError",
    "ValidationError",
    "NotFoundError",
    "ServerError",
]
