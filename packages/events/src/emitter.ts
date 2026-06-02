import type { TheatricalEvent, EventCategory } from './types';

type EventHandler<T = unknown> = (event: TheatricalEvent<T>) => void | Promise<void>;

export class EventEmitter {
  private handlers = new Map<string, Set<EventHandler>>();
  private categoryHandlers = new Map<EventCategory, Set<EventHandler>>();

  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) this.handlers.set(eventType, new Set());
    this.handlers.get(eventType)!.add(handler);
    return () => this.handlers.get(eventType)?.delete(handler);
  }

  onCategory(category: EventCategory, handler: EventHandler): () => void {
    if (!this.categoryHandlers.has(category)) this.categoryHandlers.set(category, new Set());
    this.categoryHandlers.get(category)!.add(handler);
    return () => this.categoryHandlers.get(category)?.delete(handler);
  }

  async emit(event: TheatricalEvent): Promise<void> {
    const typeHandlers = this.handlers.get(event.type) ?? new Set();
    const catHandlers = this.categoryHandlers.get(event.category) ?? new Set();
    const all = [...typeHandlers, ...catHandlers];
    await Promise.all(all.map(h => h(event)));
  }
}

// The watcher hierarchy resolves `../emitter` to this module; re-export the
// typed base class here so the bare specifier yields both emitters.
export { TypedEventEmitter } from './emitter/typed-emitter';
