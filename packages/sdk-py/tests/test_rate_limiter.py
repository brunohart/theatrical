"""Tests for the sliding-window rate limiter."""

import pytest

from theatrical.http.rate_limiter import RateLimiter, RateLimiterConfig


class TestRateLimiter:
    @pytest.mark.asyncio
    async def test_allows_requests_under_limit(self) -> None:
        limiter = RateLimiter(RateLimiterConfig(max_requests=5, window_seconds=60.0))
        for _ in range(5):
            await limiter.wait_for_slot()
        assert limiter.active_count == 5

    @pytest.mark.asyncio
    async def test_tracks_active_count(self) -> None:
        limiter = RateLimiter(RateLimiterConfig(max_requests=10, window_seconds=60.0))
        assert limiter.active_count == 0
        await limiter.wait_for_slot()
        assert limiter.active_count == 1
        await limiter.wait_for_slot()
        assert limiter.active_count == 2

    @pytest.mark.asyncio
    async def test_reset_clears_timestamps(self) -> None:
        limiter = RateLimiter(RateLimiterConfig(max_requests=5, window_seconds=60.0))
        for _ in range(3):
            await limiter.wait_for_slot()
        limiter.reset()
        assert limiter.active_count == 0

    @pytest.mark.asyncio
    async def test_default_config(self) -> None:
        limiter = RateLimiter()
        await limiter.wait_for_slot()
        assert limiter.active_count == 1

    @pytest.mark.asyncio
    async def test_blocks_at_limit(self) -> None:
        import asyncio

        limiter = RateLimiter(RateLimiterConfig(max_requests=2, window_seconds=0.1))
        await limiter.wait_for_slot()
        await limiter.wait_for_slot()

        blocked = asyncio.Event()
        released = asyncio.Event()

        async def blocked_request() -> None:
            blocked.set()
            await limiter.wait_for_slot()
            released.set()

        task = asyncio.create_task(blocked_request())
        await blocked.wait()
        await asyncio.sleep(0.01)
        assert not released.is_set()
        await asyncio.sleep(0.15)
        assert released.is_set()
        await task
