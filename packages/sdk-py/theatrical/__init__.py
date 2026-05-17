"""Theatrical — Python SDK for cinema platform APIs."""

from theatrical.client import TheatricalClient
from theatrical.config import TheatricalConfig, TheatricalEnvironment
from theatrical.errors.exceptions import (
    TheatricalError,
    AuthenticationError,
    RateLimitError,
    ValidationError,
    NotFoundError,
    ServerError,
)

from theatrical._version import __version__

__all__ = [
    "TheatricalClient",
    "TheatricalConfig",
    "TheatricalEnvironment",
    "TheatricalError",
    "AuthenticationError",
    "RateLimitError",
    "ValidationError",
    "NotFoundError",
    "ServerError",
]
