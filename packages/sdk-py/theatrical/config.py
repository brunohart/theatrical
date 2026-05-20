"""Configuration for the TheatricalClient."""

from __future__ import annotations

import re
from enum import Enum
from typing import Optional

from pydantic import BaseModel, field_validator


class TheatricalEnvironment(str, Enum):
    SANDBOX = "sandbox"
    STAGING = "staging"
    PRODUCTION = "production"

    @property
    def base_url(self) -> str:
        return _ENVIRONMENT_URLS[self]


_ENVIRONMENT_URLS: dict[TheatricalEnvironment, str] = {
    TheatricalEnvironment.SANDBOX: "https://api-sandbox.vista.co",
    TheatricalEnvironment.STAGING: "https://api-staging.vista.co",
    TheatricalEnvironment.PRODUCTION: "https://api.vista.co",
}


class TheatricalConfig(BaseModel):
    api_key: str
    environment: TheatricalEnvironment = TheatricalEnvironment.SANDBOX
    base_url: Optional[str] = None
    timeout: float = 30.0
    max_retries: int = 3
    debug: bool = False

    @field_validator("api_key")
    @classmethod
    def api_key_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("api_key must not be empty")
        if not re.fullmatch(r"[A-Za-z0-9_-]+", v):
            raise ValueError(
                "api_key must contain only alphanumeric characters, hyphens, and underscores"
            )
        return v

    @field_validator("timeout")
    @classmethod
    def timeout_in_range(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("timeout must be positive")
        if v > 120:
            raise ValueError("timeout must not exceed 120 seconds")
        return v

    @field_validator("max_retries")
    @classmethod
    def max_retries_in_range(cls, v: int) -> int:
        if v < 0:
            raise ValueError("max_retries must be 0 or greater")
        if v > 10:
            raise ValueError("max_retries must not exceed 10")
        return v

    @property
    def resolved_base_url(self) -> str:
        return self.base_url or self.environment.base_url
