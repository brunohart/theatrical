import { Poller } from '../poller';
import { diff } from '../diff-engine';
import { StateStore } from '../state-store';
import { TypedEventEmitter } from '../emitter';

export interface BaseWatcherConfig<T extends { id: string }> {
  fetch: (signal: AbortSignal) => Promise<T[]>;
  intervalMs: number;
  store?: StateStore<T>;
  onError?: (error: unknown) => void;
}

/**
 * Abstract base class wiring Poller + DiffEngine + StateStore + TypedEventEmitter
 * into a unified start/stop lifecycle.
 *
 * Subclasses implement handleUpdate() to translate diff events into typed emissions.
 */
export abstract class BaseWatcher<
  T extends { id: string },
  Events extends Record<string, unknown>,
> extends TypedEventEmitter<Events> {
  protected readonly store: StateStore<T>;
  private readonly poller: Poller<T[]>;

  constructor(config: BaseWatcherConfig<T>) {
    super();
    this.store = config.store ?? new StateStore<T>();

    this.poller = new Poller<T[]>({
      fetch: config.fetch,
      onData: (items) => {
        const previous = this.store.getAll();
        items.forEach((item) => this.store.set(item.id, item));
        this.handleUpdate(items, previous);
      },
      onError: config.onError,
      intervalMs: config.intervalMs,
    });
  }

  start(): void {
    this.poller.start();
  }

  stop(): void {
    this.poller.stop();
  }

  get isRunning(): boolean {
    return this.poller.isRunning;
  }

  protected abstract handleUpdate(current: T[], previous: T[]): void;

  protected diff(current: T[], previous: T[]) {
    return diff(current, previous);
  }
}
