import { randomUUID } from 'node:crypto';
import { computeSignature } from './signature';
import type {
  WebhookEndpoint,
  WebhookPayload,
  WebhookDeliveryResult,
  WebhookDeliveryConfig,
} from './types';

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 1000;
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Delivers webhook payloads to registered endpoints with HMAC-SHA256 signatures
 * and exponential backoff retry logic.
 *
 * @example
 * ```typescript
 * const engine = new WebhookDeliveryEngine({
 *   maxRetries: 3,
 *   retryBaseDelayMs: 1000,
 * });
 *
 * const result = await engine.deliver(endpoint, {
 *   id: 'evt_123',
 *   event: 'booking.confirmed',
 *   timestamp: new Date().toISOString(),
 *   data: { orderId: 'ord-001' },
 * });
 * ```
 */
export class WebhookDeliveryEngine {
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof globalThis.fetch;

  constructor(config: WebhookDeliveryConfig = {}) {
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryBaseDelayMs = config.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = config.fetch ?? globalThis.fetch;
  }

  /**
   * Deliver a payload to a single endpoint with retry logic.
   */
  async deliver(
    endpoint: WebhookEndpoint,
    payload: WebhookPayload,
  ): Promise<WebhookDeliveryResult> {
    const body = JSON.stringify(payload);
    const signature = computeSignature(body, endpoint.secret);
    const startMs = Date.now();
    let lastError: string | undefined;
    let lastStatusCode: number | undefined;

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await this.fetchFn(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Theatrical-Signature': `sha256=${signature}`,
            'X-Theatrical-Event': payload.event,
            'X-Theatrical-Delivery': payload.id,
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        lastStatusCode = response.status;

        if (response.ok) {
          return {
            endpointId: endpoint.id,
            success: true,
            statusCode: response.status,
            attempts: attempt,
            durationMs: Date.now() - startMs,
          };
        }

        lastError = `HTTP ${response.status}`;
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : String(error);
      }

      // Exponential backoff before retry
      if (attempt <= this.maxRetries) {
        const delay = this.retryBaseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return {
      endpointId: endpoint.id,
      success: false,
      statusCode: lastStatusCode,
      attempts: this.maxRetries + 1,
      error: lastError,
      durationMs: Date.now() - startMs,
    };
  }

  /**
   * Deliver a payload to multiple endpoints concurrently.
   * Uses Promise.allSettled so one endpoint failure does not block others.
   */
  async deliverAll(
    endpoints: WebhookEndpoint[],
    event: string,
    data: unknown,
  ): Promise<WebhookDeliveryResult[]> {
    const payload: WebhookPayload = {
      id: randomUUID(),
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const activeEndpoints = endpoints.filter(
      (ep) => ep.enabled && ep.events.includes(event),
    );

    const results = await Promise.allSettled(
      activeEndpoints.map((ep) => this.deliver(ep, payload)),
    );

    return results.map((result, i) => {
      if (result.status === 'fulfilled') return result.value;
      return {
        endpointId: activeEndpoints[i].id,
        success: false,
        attempts: this.maxRetries + 1,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        durationMs: 0,
      };
    });
  }
}
