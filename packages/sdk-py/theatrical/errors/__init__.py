"""Theatrical SDK error hierarchy."""

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
