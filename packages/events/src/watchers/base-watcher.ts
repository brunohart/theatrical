import { Poller } from '../poller';
import { diff } from '../diff-engine';
import { StateStore } from '../state-store';
import { TypedEventEmitter } from '../emitter';

export interface BaseWatcherConfig<T extends { id: string }> {
  fetch: (signal: AbortSignal) => Promise<T[]>;
  intervalMs: number;
  store?: StateStore<T>;
  onError?: (error: unknown) => void;
  /**
   * How many polls in a row an item may be missing from the results and still be
   * recognised when it returns. It is reported removed once, on the first poll
   * without it; if it comes back in time it is compared with how it left (changed,
   * or nothing) rather than announced as new, so one truncated or empty response
   * does not re-create every order or swallow a status change made meanwhile.
   * Missing for longer, it is forgotten, and returns as new. 0 forgets at once.
   * Default 10.
   */
  rememberPolls?: number;
}

const DEFAULT_REMEMBER_POLLS = 10;

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
  /** Items that dropped out of the results, by id, with the poll they left on. */
  private readonly departed = new Map<string, { item: T; poll: number }>();
  private readonly rememberPolls: number;
  private polls = 0;

  constructor(config: BaseWatcherConfig<T>) {
    super();
    this.store = config.store ?? new StateStore<T>();
    this.rememberPolls = config.rememberPolls ?? DEFAULT_REMEMBER_POLLS;

    this.poller = new Poller<T[]>({
      fetch: config.fetch,
      onData: (items) => this.receive(items),
      onError: config.onError,
      intervalMs: config.intervalMs,
    });
  }

  /**
   * The store holds the last poll, not every poll. Kept whole, an item the poll no
   * longer returned was diffed as removed on every poll after, and the store (and
   * every diff) grew with every item ever seen. An item that leaves is reported
   * removed once and remembered for `rememberPolls` polls, so if it returns it
   * diffs against how it left.
   */
  private receive(items: T[]): void {
    this.polls += 1;
    const last = this.store.getAll();
    const seen = new Set<string>();
    const returning: T[] = [];
    for (const item of items) {
      const gone = this.departed.get(item.id);
      if (gone) returning.push(gone.item);
      this.departed.delete(item.id);
      this.store.set(item.id, item);
      seen.add(item.id);
    }
    for (const item of last) {
      if (!seen.has(item.id)) {
        this.store.delete(item.id);
        this.departed.set(item.id, { item, poll: this.polls });
      }
    }
    for (const [id, gone] of this.departed) {
      if (this.polls - gone.poll >= this.rememberPolls) this.departed.delete(id);
    }
    this.handleUpdate(items, returning.length ? last.concat(returning) : last);
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
