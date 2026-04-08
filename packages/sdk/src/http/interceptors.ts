/**
 * Request/response interceptor types and chain runner for the Theatrical HTTP client.
 * Interceptors allow consumers to inspect or mutate requests before they are sent
 * and responses before they are returned — useful for logging, auth header injection,
 * response normalisation, and telemetry.
 *
 * @module http/interceptors
 */

/**
 * A function that receives a {@link RequestConfig} before a request is sent
 * and returns a (possibly mutated) config to use instead.
 *
 * Return the same object to pass through unchanged, or return a new object to
 * override headers, the URL, the body, etc.
 *
 * Async interceptors are fully supported — return a `Promise<RequestConfig>` to
 * perform async work (e.g. look up a secondary token, log to an external service).
 *
 * @example
 * const addCorrelationId: RequestInterceptor = (config) => ({
 *   ...config,
 *   headers: { ...config.headers, 'X-Correlation-ID': uuid() },
 * });
 */
export type RequestInterceptor = (
  config: RequestConfig,
) => RequestConfig | Promise<RequestConfig>;

/**
 * A function that receives a `Response` after a successful HTTP call and returns
 * a (possibly mutated) `Response` to pass upstream.
 *
 * Note: interceptors run only on responses that pass the `response.ok` check.
 * Error responses are handled by the client's error-mapping logic before
 * interceptors are invoked.
 *
 * @example
 * const logLatency: ResponseInterceptor = (response) => {
 *   console.log(`[theatrical] ${response.url} — ${response.status}`);
 *   return response;
 * };
 */
export type ResponseInterceptor = (
  response: Response,
) => Response | Promise<Response>;

/**
 * A plain-object snapshot of the mutable parts of a fetch request.
 * Passed through the {@link RequestInterceptor} chain before each call.
 */
export interface RequestConfig {
  /** Fully-qualified URL for the request (base URL + path + query string). */
  url: string;
  /** HTTP method. */
  method: string;
  /** Request headers (merged with auth and content-type defaults). */
  headers: Record<string, string>;
  /** Serialised request body, or undefined for GET/DELETE. */
  body?: string;
}
