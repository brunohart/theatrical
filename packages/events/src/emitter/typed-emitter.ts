import { EventEmitter } from 'node:events';

/**
 * TypedEventEmitter — wraps Node's EventEmitter with compile-time event and
 * payload type checking. Extend with a specific Events map to get typed
 * emit/on/off/once across the entire watcher hierarchy.
 *
 * @example
 * ```typescript
 * type BookingEvents = {
 *   'booking.created': { orderId: string; timestamp: string };
 * };
 * class MyEmitter extends TypedEventEmitter<BookingEvents> {}
 * const e = new MyEmitter();
 * e.on('booking.created', ({ orderId }) => console.log(orderId));
 * ```
 */
export class TypedEventEmitter<
  Events extends Record<string, unknown>,
> extends EventEmitter {
  emit<K extends keyof Events & string>(event: K, payload: Events[K]): boolean {
    return super.emit(event, payload);
  }

  on<K extends keyof Events & string>(
    event: K,
    listener: (payload: Events[K]) => void,
  ): this {
    return super.on(event, listener);
  }

  off<K extends keyof Events & string>(
    event: K,
    listener: (payload: Events[K]) => void,
  ): this {
    return super.off(event, listener);
  }

  once<K extends keyof Events & string>(
    event: K,
    listener: (payload: Events[K]) => void,
  ): this {
    return super.once(event, listener);
  }
}
