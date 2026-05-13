"""Sliding-window rate limiter for async request throttling."""

from __future__ import annotations

import asyncio
import time
from collections import deque
from dataclasses import dataclass


@dataclass(frozen=True)
class RateLimiterConfig:
    max_requests: int = 60
    window_seconds: float = 60.0


DEFAULT_RATE_LIMITER_CONFIG = RateLimiterConfig()


class RateLimiter:
    def __init__(self, config: RateLimiterConfig | None = None) -> None:
        self._config = config or DEFAULT_RATE_LIMITER_CONFIG
        self._timestamps: deque[float] = deque()
        self._lock = asyncio.Lock()

    async def wait_for_slot(self) -> None:
        while True:
            async with self._lock:
                now = time.monotonic()
                window_start = now - self._config.window_seconds

                while self._timestamps and self._timestamps[0] < window_start:
                    self._timestamps.popleft()

                if len(self._timestamps) < self._config.max_requests:
                    self._timestamps.append(now)
                    return

                oldest = self._timestamps[0]
                wait_time = oldest + self._config.window_seconds - now + 0.001

            await asyncio.sleep(wait_time)

    @property
    def active_count(self) -> int:
        now = time.monotonic()
        window_start = now - self._config.window_seconds
        return sum(1 for ts in self._timestamps if ts >= window_start)

    def reset(self) -> None:
        self._timestamps.clear()
