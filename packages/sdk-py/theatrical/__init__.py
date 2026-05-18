"""Theatrical — Python SDK for cinema platform APIs."""

from theatrical._version import __version__
from theatrical.client import TheatricalClient
from theatrical.config import TheatricalConfig, TheatricalEnvironment
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
    "TheatricalClient",
    "TheatricalConfig",
    "TheatricalEnvironment",
    "TheatricalError",
    "ValidationError",
    "__version__",
]
