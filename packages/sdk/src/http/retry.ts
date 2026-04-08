/**
 * Retry utilities for the Theatrical HTTP client.
 * Provides configurable exponential backoff with optional jitter,
 * designed for resilient communication with Vista's OCAPI platform.
 *
 * @module http/retry
 */

/** Configuration for automatic request retry behaviour. */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts. The initial request is not counted.
   * A value of 3 means up to 4 total attempts (initial + 3 retries).
   * @default 3
   */
  maxRetries: number;

  /**
   * Base delay in milliseconds for the first retry.
   * Subsequent retries use exponential backoff: `baseDelay * 2^(attempt - 1)`.
   * @default 1000
   */
  baseDelay: number;

  /**
   * Maximum delay cap in milliseconds.
   * Prevents backoff from growing unbounded on high retry counts.
   * @default 30_000
   */
  maxDelay: number;

  /**
   * When true, adds randomised full jitter to each delay.
   * Spreads retry storms across the Vista API cluster.
   * @default true
   */
  jitter: boolean;

  /**
   * Optional predicate — when provided, retries only if this function returns
   * true for the thrown error. Use to avoid retrying non-recoverable errors
   * such as 400 Bad Request or 401 Unauthorised.
   */
  shouldRetry?: (error: unknown) => boolean;
}

/** Default retry configuration used by TheatricalHTTPClient when none is specified. */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1_000,
  maxDelay: 30_000,
  jitter: true,
};

/**
 * Computes the exponential backoff delay for a given attempt number.
 *
 * @param attempt - 1-indexed attempt number (attempt 1 = first retry after initial failure)
 * @param config - Retry configuration controlling base delay, max delay, and jitter
 * @returns Delay in milliseconds
 *
 * @example
 * computeBackoffDelay(1, DEFAULT_RETRY_CONFIG) // 500–1000ms (with jitter)
 * computeBackoffDelay(2, DEFAULT_RETRY_CONFIG) // 1000–2000ms (with jitter)
 * computeBackoffDelay(3, DEFAULT_RETRY_CONFIG) // 2000–4000ms (with jitter)
 */
export function computeBackoffDelay(attempt: number, config: RetryConfig): number {
  const exponential = Math.min(
    config.baseDelay * Math.pow(2, attempt - 1),
    config.maxDelay,
  );
  if (!config.jitter) return exponential;
  // Full jitter: random value in [exponential / 2, exponential]
  return Math.floor(exponential * (0.5 + Math.random() * 0.5));
}

/**
 * Wraps an async operation with configurable retry logic and exponential backoff.
 * Retries on any thrown error by default; pass `shouldRetry` in config to narrow
 * the retry condition to specific error types or status codes.
 *
 * @param fn - Async function to execute and retry on failure
 * @param config - Retry configuration
 * @returns The result of `fn` on success
 * @throws The last error if all retries are exhausted or `shouldRetry` returns false
 *
 * @example
 * const sessions = await withRetry(
 *   () => fetch('https://ocapi.moviexchange.com/sessions'),
 *   { ...DEFAULT_RETRY_CONFIG, maxRetries: 2 },
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt > config.maxRetries;
      const nonRetryable =
        config.shouldRetry !== undefined && !config.shouldRetry(error);

      if (isLastAttempt || nonRetryable) break;

      const delayMs = computeBackoffDelay(attempt, config);
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
