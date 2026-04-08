/**
 * Sliding-window rate limiter for the Theatrical HTTP client.
 * Prevents the SDK from exceeding Vista's OCAPI rate limits by queuing
 * requests proactively rather than recovering from 429 responses after the fact.
 *
 * @module http/rate-limiter
 */

/** Configuration for the sliding-window rate limiter. */
export interface RateLimiterConfig {
  /**
   * Maximum number of requests allowed within the rolling window.
   * Matches Vista's OCAPI per-key limit for the configured window.
   */
  maxRequests: number;

  /**
   * Duration of the sliding window in milliseconds.
   * Timestamps older than `now - windowMs` are evicted and no longer count.
   * @default 60_000
   */
  windowMs: number;
}

/** Conservative defaults aligned with Vista's documented OCAPI limits. */
export const DEFAULT_RATE_LIMITER_CONFIG: RateLimiterConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};

/**
 * Sliding-window rate limiter using a timestamp queue.
 *
 * Tracks the wall-clock time of each accepted request. When the in-window
 * request count reaches `maxRequests`, `waitForSlot()` blocks until the oldest
 * recorded timestamp exits the window, then records the new request and resolves.
 *
 * @example
 * const limiter = new RateLimiter({ maxRequests: 100, windowMs: 60_000 });
 *
 * // In the HTTP client, before each fetch:
 * await limiter.waitForSlot();
 * const response = await fetch(url, options);
 */
export class RateLimiter {
  private readonly config: RateLimiterConfig;
  private readonly timestamps: number[] = [];

  /**
   * Creates a new RateLimiter.
   * @param config - Limits and window size. Defaults to {@link DEFAULT_RATE_LIMITER_CONFIG}.
   */
  constructor(config: RateLimiterConfig = DEFAULT_RATE_LIMITER_CONFIG) {
    this.config = config;
  }

  /**
   * Waits until a request slot is available within the current window,
   * records the request timestamp, and resolves.
   *
   * Callers `await` this before making an HTTP request. If the limit has been
   * reached, the call suspends until the oldest in-window request expires.
   *
   * @returns Promise that resolves when it is safe to proceed with a request
   */
  async waitForSlot(): Promise<void> {
    for (;;) {
      const now = Date.now();
      const windowStart = now - this.config.windowMs;

      // Evict timestamps that have fallen outside the rolling window
      while (this.timestamps.length > 0 && this.timestamps[0]! < windowStart) {
        this.timestamps.shift();
      }

      if (this.timestamps.length < this.config.maxRequests) {
        this.timestamps.push(now);
        return;
      }

      // Block until the oldest in-window timestamp expires
      const oldestTs = this.timestamps[0]!;
      const waitMs = oldestTs + this.config.windowMs - now + 1;
      await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
    }
  }

  /**
   * Returns the number of requests recorded within the current rolling window.
   * Useful for diagnostics and integration tests.
   */
  get activeCount(): number {
    const windowStart = Date.now() - this.config.windowMs;
    return this.timestamps.filter((ts) => ts >= windowStart).length;
  }

  /**
   * Clears all recorded timestamps, resetting the limiter to a clean state.
   * Primarily intended for use in tests.
   */
  reset(): void {
    this.timestamps.length = 0;
  }
}
