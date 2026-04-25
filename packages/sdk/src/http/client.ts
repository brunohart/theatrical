import type { TokenManager } from '../auth/token-manager';
import {
  TheatricalError,
  AuthenticationError,
  RateLimitError,
  ServerError,
} from '../errors';
import { parseErrorResponse } from '../errors/parser';
import { computeBackoffDelay, DEFAULT_RETRY_CONFIG, type RetryConfig } from './retry';
import { RateLimiter } from './rate-limiter';
import { runInterceptors, type RequestInterceptor, type RequestConfig, type ResponseInterceptor } from './interceptors';

export interface HTTPClientConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  tokenManager: TokenManager;
  debug: boolean;
  /** Optional retry configuration. Defaults to {@link DEFAULT_RETRY_CONFIG}. */
  retry?: RetryConfig;
  /**
   * Optional rate limiter instance for proactive request throttling.
   *
   * When provided, `waitForSlot()` is called before each outgoing request to
   * ensure the SDK never exceeds Vista's OCAPI rate limits. If not provided,
   * no proactive limiting is applied — the client falls back to reactive
   * handling of 429 responses.
   *
   * Inject a shared `RateLimiter` when multiple SDK instances target the same
   * Vista operator key, so all instances contribute to the same window count.
   *
   * @example
   * ```typescript
   * import { RateLimiter } from '@theatrical/sdk';
   *
   * const limiter = new RateLimiter({ maxRequests: 60, windowMs: 60_000 });
   * const client = new TheatricalHTTPClient({ ..., rateLimiter: limiter });
   * ```
   */
  rateLimiter?: RateLimiter;
  /**
   * Ordered list of request interceptors.
   * Each interceptor receives the {@link RequestConfig} built for the outgoing
   * request and may return a mutated copy. Interceptors run in array order
   * before the `fetch` call is made.
   */
  onRequest?: RequestInterceptor[];
  /**
   * Ordered list of response interceptors.
   * Each interceptor receives the raw `Response` object after a successful
   * (`response.ok`) fetch and may return a mutated copy. Interceptors run in
   * array order before the response body is decoded.
   */
  onResponse?: ResponseInterceptor[];
}

interface RequestOptions {
  method?: string;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Core HTTP client for all Vista API communication.
 * Handles authentication, retries, rate limiting, and error transformation.
 */
export class TheatricalHTTPClient {
  private readonly config: HTTPClientConfig;

  constructor(config: HTTPClientConfig) {
    this.config = config;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'GET' }, path);
  }

  async post<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'POST' }, path);
  }

  async put<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'PUT' }, path);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'DELETE' }, path);
  }

  private async request<T>(options: RequestOptions, path: string, attempt = 1): Promise<T> {
    // Proactively wait for a rate-limit slot before acquiring a token or
    // building the request. This prevents bursting past Vista's OCAPI limits.
    if (this.config.rateLimiter) {
      await this.config.rateLimiter.waitForSlot();
    }

    const token = await this.config.tokenManager.getToken();
    const url = this.buildUrl(path, options.params);
    const requestId = this.generateRequestId();

    if (this.config.debug) {
      console.log(`[theatrical] ${options.method} ${url} (${requestId})`);
    }

    // Build the initial RequestConfig and run it through any request interceptors.
    const serialisedBody = options.body ? JSON.stringify(options.body) : undefined;
    let requestConfig: RequestConfig = {
      url,
      method: options.method ?? 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...options.headers,
      },
      body: serialisedBody,
    };

    if (this.config.onRequest?.length) {
      requestConfig = await runInterceptors(requestConfig, this.config.onRequest);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      let response = await fetch(requestConfig.url, {
        method: requestConfig.method,
        headers: requestConfig.headers,
        body: requestConfig.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Run response interceptors before decoding the body.
        if (this.config.onResponse?.length) {
          response = await runInterceptors(response, this.config.onResponse);
        }
        return (await response.json()) as T;
      }

      // 401 needs token invalidation before error parsing — handle first.
      if (response.status === 401) {
        this.config.tokenManager.invalidate();
        if (attempt <= 1) {
          return this.request<T>(options, path, attempt + 1);
        }
      }

      // Parse all other non-ok responses via the full error parser.
      // Fixes: Vista error codes, field-level errors, HTTP-date Retry-After (cr-005, cr-006).
      const error = await parseErrorResponse(response, requestConfig.url);

      // Unified retry path for rate limits and server errors (cr-001).
      if ((error instanceof RateLimitError || error instanceof ServerError) && attempt <= this.config.maxRetries) {
        const retryConfig = this.config.retry ?? { ...DEFAULT_RETRY_CONFIG, maxRetries: this.config.maxRetries };
        const delayMs = error instanceof RateLimitError
          ? error.retryAfter * 1000
          : computeBackoffDelay(attempt, retryConfig);
        await this.delay(delayMs);
        return this.request<T>(options, path, attempt + 1);
      }

      throw error;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof TheatricalError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TheatricalError('Request timed out', 408, undefined, requestId);
      }

      throw new TheatricalError(
        `Network error: ${(error as Error).message}`,
        0,
        undefined,
        requestId,
      );
    }
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.config.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private generateRequestId(): string {
    return `th_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
