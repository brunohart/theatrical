import type { Session } from '@theatrical/sdk';
import { BaseWatcher, BaseWatcherConfig } from './base-watcher';

export interface SessionAddedPayload {
  session: Session;
  timestamp: string;
}

export interface SessionUpdatedPayload {
  session: Session;
  previous: Session;
  timestamp: string;
}

export interface SessionSoldOutPayload {
  session: Session;
  timestamp: string;
}

export type SessionEvents = {
  'session.added': SessionAddedPayload;
  'session.updated': SessionUpdatedPayload;
  'session.soldout': SessionSoldOutPayload;
};

export type SessionWatcherConfig = Omit<BaseWatcherConfig<Session>, 'intervalMs'> & {
  intervalMs?: number;
};

/**
 * Watches sessions for additions, updates, and sell-outs.
 *
 * Events:
 * - `session.added` — new session appeared in the poll result
 * - `session.updated` — an existing session's data changed
 * - `session.soldout` — session's available seats dropped to zero
 *
 * @example
 * ```typescript
 * const watcher = new SessionWatcher({
 *   fetch: (signal) => client.sessions.list({ siteId: 'site-001' }, signal),
 * });
 * watcher.on('session.soldout', ({ session }) => updateInventoryDashboard(session));
 * watcher.start();
 * ```
 */
export class SessionWatcher extends BaseWatcher<Session, SessionEvents> {
  constructor(config: SessionWatcherConfig) {
    super({ ...config, intervalMs: config.intervalMs ?? 10_000 });
  }

  protected handleUpdate(current: Session[], previous: Session[]): void {
    const timestamp = new Date().toISOString();
    const events = this.diff(current, previous);

    for (const event of events) {
      if (event.type === 'added') {
        this.emit('session.added', { session: event.item, timestamp });
        // session.soldout fires only on transitions (changed events), not initial appearance
      } else if (event.type === 'changed') {
        this.emit('session.updated', {
          session: event.item,
          previous: event.previous!,
          timestamp,
        });
        if (event.item.isSoldOut && !event.previous?.isSoldOut) {
          this.emit('session.soldout', { session: event.item, timestamp });
        }
      }
    }
  }
}
