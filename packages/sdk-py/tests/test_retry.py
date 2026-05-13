"""Tests for retry configuration and backoff computation."""

from theatrical.http.retry import RetryConfig, compute_backoff_delay


class TestRetryConfig:
    def test_defaults(self) -> None:
        config = RetryConfig()
        assert config.max_retries == 3
        assert config.base_delay == 1.0
        assert config.max_delay == 30.0
        assert config.jitter is True

    def test_custom_values(self) -> None:
        config = RetryConfig(max_retries=5, base_delay=2.0, max_delay=60.0, jitter=False)
        assert config.max_retries == 5
        assert config.base_delay == 2.0


class TestComputeBackoffDelay:
    def test_without_jitter_is_exponential(self) -> None:
        config = RetryConfig(base_delay=1.0, max_delay=30.0, jitter=False)
        assert compute_backoff_delay(1, config) == 1.0
        assert compute_backoff_delay(2, config) == 2.0
        assert compute_backoff_delay(3, config) == 4.0
        assert compute_backoff_delay(4, config) == 8.0

    def test_respects_max_delay(self) -> None:
        config = RetryConfig(base_delay=1.0, max_delay=5.0, jitter=False)
        assert compute_backoff_delay(10, config) == 5.0

    def test_with_jitter_stays_in_range(self) -> None:
        config = RetryConfig(base_delay=1.0, max_delay=30.0, jitter=True)
        for _ in range(100):
            delay = compute_backoff_delay(1, config)
            assert 0.5 <= delay <= 1.0

    def test_with_jitter_attempt_2(self) -> None:
        config = RetryConfig(base_delay=1.0, max_delay=30.0, jitter=True)
        for _ in range(100):
            delay = compute_backoff_delay(2, config)
            assert 1.0 <= delay <= 2.0
