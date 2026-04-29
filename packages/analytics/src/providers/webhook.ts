import crypto from 'crypto';
import type { AnalyticsProvider, TrackEvent } from './base';

/** Configuration for the webhook provider */
export interface WebhookProviderConfig {
  /** HTTP endpoint to POST events to */
  url: string;
  /** Optional HMAC-SHA256 secret — if set, adds `X-Theatrical-Signature` header */
  secret?: string;
  /** Request timeout in milliseconds (default: 5 000) */
  timeoutMs?: number;
}

/**
 * Analytics provider adapter that delivers events via HTTP webhook.
 *
 * When a `secret` is configured, each request includes an
 * `X-Theatrical-Signature` header containing a HMAC-SHA256 digest of the
 * request body — allowing the receiving server to verify the payload origin.
 *
 * @example
 * ```typescript
 * import { HorizonClient, WebhookProvider } from '@theatrical/analytics';
 *
 * const horizon = new HorizonClient({
 *   baseUrl: 'https://horizon.vista.co',
 *   authMode: 'api-key',
 *   apiKey: process.env.HORIZON_API_KEY!,
 *   tenantId: 'tenant_nz_pvt',
 *   providers: [
 *     new WebhookProvider({
 *       url: 'https://data.example.com/ingest',
 *       secret: process.env.WEBHOOK_SECRET!,
 *     }),
 *   ],
 * });
 * ```
 */
export class WebhookProvider implements AnalyticsProvider {
  readonly name = 'webhook';
  private readonly url: string;
  private readonly secret?: string;
  private readonly timeoutMs: number;

  constructor(config: WebhookProviderConfig) {
    this.url = config.url;
    this.secret = config.secret;
    this.timeoutMs = config.timeoutMs ?? 5_000;
  }

  async track(event: TrackEvent): Promise<void> {
    const payload = JSON.stringify({
      type: event.type,
      timestamp: event.timestamp ?? new Date().toISOString(),
      properties: event.properties,
      userId: event.userId,
      anonymousId: event.anonymousId,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Theatrical-Event': event.type,
    };

    if (this.secret) {
      const sig = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
      headers['X-Theatrical-Signature'] = `sha256=${sig}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      await fetch(this.url, { method: 'POST', headers, body: payload, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }
}
