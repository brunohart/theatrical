import type { Order } from '@theatrical/sdk';
import { BaseWatcher, BaseWatcherConfig } from './base-watcher';

export interface BookingCreatedPayload {
  order: Order;
  timestamp: string;
}

export interface BookingConfirmedPayload {
  order: Order;
  previousStatus: string;
  timestamp: string;
}

export interface BookingCancelledPayload {
  order: Order;
  previousStatus: string;
  timestamp: string;
}

export type BookingEvents = {
  'booking.created': BookingCreatedPayload;
  'booking.confirmed': BookingConfirmedPayload;
  'booking.cancelled': BookingCancelledPayload;
};

export type BookingWatcherConfig = Omit<BaseWatcherConfig<Order>, 'intervalMs'> & {
  intervalMs?: number;
};

/**
 * Watches orders for status changes and emits typed booking lifecycle events.
 *
 * Events:
 * - `booking.created` — new order appeared in the poll result
 * - `booking.confirmed` — order status transitioned to 'confirmed'
 * - `booking.cancelled` — order status transitioned to 'cancelled'
 *
 * @example
 * ```typescript
 * const watcher = new BookingWatcher({ fetch: (signal) => client.orders.list({}, signal) });
 * watcher.on('booking.confirmed', ({ order }) => sendConfirmationEmail(order));
 * watcher.start();
 * ```
 */
export class BookingWatcher extends BaseWatcher<Order, BookingEvents> {
  constructor(config: BookingWatcherConfig) {
    super({ ...config, intervalMs: config.intervalMs ?? 5_000 });
  }

  protected handleUpdate(current: Order[], previous: Order[]): void {
    const timestamp = new Date().toISOString();
    const events = this.diff(current, previous);

    for (const event of events) {
      if (event.type === 'added') {
        this.emit('booking.created', { order: event.item, timestamp });
      } else if (event.type === 'changed') {
        const prevStatus = event.previous?.status ?? 'unknown';
        if (
          event.item.status === 'confirmed' &&
          prevStatus !== 'confirmed'
        ) {
          this.emit('booking.confirmed', {
            order: event.item,
            previousStatus: prevStatus,
            timestamp,
          });
        } else if (
          event.item.status === 'cancelled' &&
          prevStatus !== 'cancelled'
        ) {
          this.emit('booking.cancelled', {
            order: event.item,
            previousStatus: prevStatus,
            timestamp,
          });
        }
      }
    }
  }
}
