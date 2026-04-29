/**
 * A generic analytics tracking event.
 *
 * Providers receive this envelope and map it to their own schema
 * (e.g. Segment's `track()` call, a webhook payload, Movio CDP).
 */
export interface TrackEvent {
  /** Event type identifier (e.g. `'session_browsed'`, `'booking_completed'`) */
  readonly type: string;
  /** ISO 8601 timestamp — defaults to now if omitted */
  readonly timestamp?: string;
  /** Freeform event properties */
  readonly properties: Record<string, unknown>;
  /** Optional user / member identifier */
  readonly userId?: string;
  /** Optional anonymous session identifier */
  readonly anonymousId?: string;
}

/**
 * An identity event associating a user with known attributes.
 */
export interface IdentifyEvent {
  /** Member or user identifier */
  readonly userId: string;
  /** Traits to associate with the identity */
  readonly traits: Record<string, unknown>;
  /** ISO 8601 timestamp */
  readonly timestamp?: string;
}

/**
 * Public interface for analytics provider adapters.
 *
 * Implement this interface to connect `@theatrical/analytics` to any downstream
 * analytics target — Segment, PostHog, Movio CDP, a custom webhook, or your
 * own data pipeline.
 *
 * `HorizonClient.track()` fans out to all registered providers via
 * `Promise.allSettled`, so a failing provider never blocks others.
 *
 * @example Custom provider
 * ```typescript
 * import type { AnalyticsProvider, TrackEvent } from '@theatrical/analytics';
 *
 * class MovioCDPProvider implements AnalyticsProvider {
 *   readonly name = 'movio-cdp';
 *   async track(event: TrackEvent): Promise<void> {
 *     await fetch('https://cdp.movio.co/events', {
 *       method: 'POST',
 *       body: JSON.stringify(event),
 *     });
 *   }
 * }
 * ```
 */
export interface AnalyticsProvider {
  /** Human-readable name used in log messages */
  readonly name: string;

  /**
   * Track a single analytics event.
   * Called by `HorizonClient.track()` for every registered provider.
   */
  track(event: TrackEvent): Promise<void>;

  /**
   * Associate a user ID with a set of known traits.
   * Optional — implement when the downstream target supports identity stitching.
   */
  identify?(user: IdentifyEvent): Promise<void>;

  /**
   * Flush any buffered events to the upstream target.
   * Optional — implement for providers that batch events internally.
   */
  flush?(): Promise<void>;
}
