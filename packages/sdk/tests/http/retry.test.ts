import { describe, it, expect, vi } from 'vitest';
import {
  computeBackoffDelay,
  withRetry,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
} from '../../src/http/retry';

/**
 * Tests for the retry module.
 * Validates exponential backoff calculation and the withRetry wrapper
 * against realistic cinema API error scenarios.
 */

describe('computeBackoffDelay', () => {
  it('returns base delay for attempt 1 without jitter', () => {
    const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, jitter: false };
    expect(computeBackoffDelay(1, config)).toBe(1_000);
  });

  it('doubles delay with each successive attempt (exponential growth)', () => {
    const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, jitter: false };
    expect(computeBackoffDelay(1, config)).toBe(1_000);
    expect(computeBackoffDelay(2, config)).toBe(2_000);
    expect(computeBackoffDelay(3, config)).toBe(4_000);
    expect(computeBackoffDelay(4, config)).toBe(8_000);
  });

  it('caps delay at maxDelay regardless of attempt count', () => {
    const config: RetryConfig = {
      maxRetries: 10,
      baseDelay: 1_000,
      maxDelay: 5_000,
      jitter: false,
    };
    // attempt 10 would be 512s without cap; should be capped at 5s
    expect(computeBackoffDelay(10, config)).toBe(5_000);
  });

  it('applies full jitter — delay falls in [exponential/2, exponential]', () => {
    const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, jitter: true };
    // Run 30 samples to verify bounds hold
    for (let i = 0; i < 30; i++) {
      const delay = computeBackoffDelay(1, config);
      expect(delay).toBeGreaterThanOrEqual(500);
      expect(delay).toBeLessThanOrEqual(1_000);
    }
  });

  it('returns exact value without jitter applied when jitter is false', () => {
    const config: RetryConfig = {
      maxRetries: 3,
      baseDelay: 2_000,
      maxDelay: 60_000,
      jitter: false,
    };
    // deterministic: no randomness
    expect(computeBackoffDelay(2, config)).toBe(4_000);
    expect(computeBackoffDelay(2, config)).toBe(4_000);
  });
});

describe('withRetry', () => {
  it('resolves immediately when fn succeeds on the first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('roxy-cinema-wellington');
    const result = await withRetry(fn, { ...DEFAULT_RETRY_CONFIG, baseDelay: 0 });
    expect(result).toBe('roxy-cinema-wellington');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('retries and succeeds after transient failures', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('ocapi temporarily unavailable — session-slot-1'))
      .mockRejectedValueOnce(new Error('ocapi temporarily unavailable — session-slot-2'))
      .mockResolvedValue('embassy-theatre-wellington');

    const result = await withRetry(fn, {
      maxRetries: 3,
      baseDelay: 0,
      maxDelay: 0,
      jitter: false,
    });

    expect(result).toBe('embassy-theatre-wellington');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws the last error when all retries are exhausted', async () => {
    const error = new Error('event-cinemas-queen-st api unavailable');
    const fn = vi.fn().mockRejectedValue(error);

    await expect(
      withRetry(fn, { maxRetries: 2, baseDelay: 0, maxDelay: 0, jitter: false }),
    ).rejects.toThrow('event-cinemas-queen-st api unavailable');

    // initial attempt + 2 retries = 3 total calls
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry when shouldRetry returns false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('400 Bad Request — non-retryable'));
    const shouldRetry = vi.fn().mockReturnValue(false);

    await expect(
      withRetry(fn, {
        maxRetries: 3,
        baseDelay: 0,
        maxDelay: 0,
        jitter: false,
        shouldRetry,
      }),
    ).rejects.toThrow('400 Bad Request');

    expect(fn).toHaveBeenCalledOnce();
    expect(shouldRetry).toHaveBeenCalledOnce();
  });

  it('stops retrying as soon as shouldRetry returns false mid-sequence', async () => {
    let callCount = 0;

    const fn = vi.fn().mockImplementation(() => {
      callCount++;
      const message = callCount < 3 ? 'retryable 503' : 'fatal 400';
      return Promise.reject(new Error(message));
    });

    const shouldRetry = (err: unknown) =>
      (err as Error).message.startsWith('retryable');

    await expect(
      withRetry(fn, {
        maxRetries: 5,
        baseDelay: 0,
        maxDelay: 0,
        jitter: false,
        shouldRetry,
      }),
    ).rejects.toThrow('fatal 400');

    // 2 retryable + 1 non-retryable = 3 total calls
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
