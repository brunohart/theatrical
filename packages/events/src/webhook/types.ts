/**
 * Configuration for a webhook endpoint registered to receive event notifications.
 */
export interface WebhookEndpoint {
  /** Unique identifier for this webhook registration */
  id: string;
  /** The HTTPS URL to deliver events to */
  url: string;
  /** Shared secret used for HMAC-SHA256 signature generation */
  secret: string;
  /** Event types this endpoint subscribes to (e.g., 'booking.confirmed', 'film.added') */
  events: string[];
  /** Whether this endpoint is currently active */
  enabled: boolean;
}

/**
 * A webhook delivery payload sent to registered endpoints.
 */
export interface WebhookPayload {
  /** Unique delivery ID for idempotency */
  id: string;
  /** Event type identifier (e.g., 'booking.confirmed') */
  event: string;
  /** ISO 8601 timestamp of when the event occurred */
  timestamp: string;
  /** The event data — shape depends on the event type */
  data: unknown;
}

/**
 * Result of a webhook delivery attempt.
 */
export interface WebhookDeliveryResult {
  /** The endpoint that was targeted */
  endpointId: string;
  /** Whether the delivery succeeded (2xx response) */
  success: boolean;
  /** HTTP status code from the endpoint */
  statusCode?: number;
  /** Number of attempts made (1 = first try, 2+ = retries) */
  attempts: number;
  /** Error message if delivery failed */
  error?: string;
  /** Duration of the delivery in milliseconds */
  durationMs: number;
}

/**
 * Configuration for the webhook delivery engine.
 */
export interface WebhookDeliveryConfig {
  /** Maximum retry attempts for failed deliveries (default: 3) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff between retries (default: 1000) */
  retryBaseDelayMs?: number;
  /** Request timeout in ms (default: 10000) */
  timeoutMs?: number;
  /** Custom fetch implementation for testing */
  fetch?: typeof globalThis.fetch;
}
