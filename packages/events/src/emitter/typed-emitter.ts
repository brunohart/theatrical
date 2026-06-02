/**
 * TypedEventEmitter — a tiny, dependency-free (browser- and edge-safe) event
 * emitter with compile-time event and payload type checking. Extend with a
 * specific Events map to get typed emit/on/off/once across the watcher hierarchy.
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
export class TypedEventEmitter<Events extends Record<string, unknown>> {
  private listeners = new Map<string, Set<(payload: never) => void>>();

  emit<K extends keyof Events & string>(event: K, payload: Events[K]): boolean {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return false;
    for (const fn of [...set]) (fn as (p: Events[K]) => void)(payload);
    return true;
  }

  on<K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): this {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener as (payload: never) => void);
    return this;
  }

  off<K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): this {
    this.listeners.get(event)?.delete(listener as (payload: never) => void);
    return this;
  }

  once<K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): this {
    const wrap = (payload: Events[K]) => { this.off(event, wrap); listener(payload); };
    return this.on(event, wrap);
  }

  removeAllListeners(): this { this.listeners.clear(); return this; }
}
