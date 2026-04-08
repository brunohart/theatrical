import type { TokenManager } from '../auth/token-manager';
import {
  TheatricalError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ServerError,
} from '../errors';
import { computeBackoffDelay, DEFAULT_RETRY_CONFIG, type RetryConfig } from './retry';
import type { RequestInterceptor, ResponseInterceptor } from './interceptors';

export interface HTTPClientConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  tokenManager: TokenManager;
  debug: boolean;
  /** Optional retry configuration. Defaults to {@link DEFAULT_RETRY_CONFIG}. */
  retry?: RetryConfig;
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
    const token = await this.config.tokenManager.getToken();
    const url = this.buildUrl(path, options.params);
    const requestId = this.generateRequestId();

    if (this.config.debug) {
      console.log(`[theatrical] ${options.method} ${url} (${requestId})`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: options.method ?? 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return (await response.json()) as T;
      }

      // Handle specific error codes
      if (response.status === 401) {
        this.config.tokenManager.invalidate();
        if (attempt <= 1) {
          // Retry once with a fresh token
          return this.request<T>(options, path, attempt + 1);
        }
        throw new AuthenticationError(undefined, undefined, requestId);
      }

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60', 10);
        if (attempt <= this.config.maxRetries) {
          await this.delay(retryAfter * 1000);
          return this.request<T>(options, path, attempt + 1);
        }
        throw new RateLimitError(retryAfter, requestId);
      }

      if (response.status === 404) {
        throw new NotFoundError('resource', path, requestId);
      }

      if (response.status >= 500) {
        if (attempt <= this.config.maxRetries) {
          const retryConfig = this.config.retry ?? { ...DEFAULT_RETRY_CONFIG, maxRetries: this.config.maxRetries };
          await this.delay(computeBackoffDelay(attempt, retryConfig));
          return this.request<T>(options, path, attempt + 1);
        }
        throw new ServerError(undefined, requestId);
      }

      // Generic error
      const errorBody = await response.text();
      throw new TheatricalError(
        `Request failed: ${response.status} ${errorBody}`,
        response.status,
        undefined,
        requestId,
      );
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
