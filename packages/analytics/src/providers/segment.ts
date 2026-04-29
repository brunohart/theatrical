import type { AnalyticsProvider, IdentifyEvent, TrackEvent } from './base';

/** Configuration for the Segment provider */
export interface SegmentProviderConfig {
  /** Segment Write Key */
  writeKey: string;
  /** Segment API endpoint (default: `'https://api.segment.io/v1'`) */
  endpoint?: string;
}

/**
 * Analytics provider adapter for Segment.
 *
 * Sends `track` and `identify` calls to the Segment HTTP Tracking API.
 * Events are dispatched individually (no batching) — implement a batching
 * provider on top if throughput requires it.
 *
 * @example
 * ```typescript
 * import { HorizonClient, SegmentProvider } from '@theatrical/analytics';
 *
 * const horizon = new HorizonClient({
 *   baseUrl: 'https://horizon.vista.co',
 *   authMode: 'api-key',
 *   apiKey: process.env.HORIZON_API_KEY!,
 *   tenantId: 'tenant_nz_pvt',
 *   providers: [new SegmentProvider({ writeKey: process.env.SEGMENT_WRITE_KEY! })],
 * });
 * ```
 */
export class SegmentProvider implements AnalyticsProvider {
  readonly name = 'segment';
  private readonly endpoint: string;
  private readonly auth: string;

  constructor(config: SegmentProviderConfig) {
    this.endpoint = (config.endpoint ?? 'https://api.segment.io/v1').replace(/\/$/, '');
    this.auth = Buffer.from(`${config.writeKey}:`).toString('base64');
  }

  async track(event: TrackEvent): Promise<void> {
    await fetch(`${this.endpoint}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.auth}`,
      },
      body: JSON.stringify({
        event: event.type,
        timestamp: event.timestamp ?? new Date().toISOString(),
        properties: event.properties,
        userId: event.userId,
        anonymousId: event.anonymousId ?? 'anon',
      }),
    });
  }

  async identify(user: IdentifyEvent): Promise<void> {
    await fetch(`${this.endpoint}/identify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.auth}`,
      },
      body: JSON.stringify({
        userId: user.userId,
        traits: user.traits,
        timestamp: user.timestamp ?? new Date().toISOString(),
      }),
    });
  }
}
