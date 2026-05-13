"""Retry utilities with exponential backoff and jitter."""

from __future__ import annotations

import random
from dataclasses import dataclass


@dataclass(frozen=True)
class RetryConfig:
    max_retries: int = 3
    base_delay: float = 1.0
    max_delay: float = 30.0
    jitter: bool = True


DEFAULT_RETRY_CONFIG = RetryConfig()


def compute_backoff_delay(attempt: int, config: RetryConfig) -> float:
    exponential = min(
        config.base_delay * (2 ** (attempt - 1)),
        config.max_delay,
    )
    if not config.jitter:
        return float(exponential)
    jitter_factor: float = 0.5 + random.random() * 0.5
    return float(exponential * jitter_factor)
