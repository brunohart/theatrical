export interface PollerConfig<T> {
  fetch: (signal: AbortSignal) => Promise<T>;
  onData: (data: T) => void;
  onError?: (error: unknown) => void;
  intervalMs: number;
}

/** Poll intervals recommended per resource type (milliseconds). */
export const DEFAULT_POLL_INTERVALS = {
  sessions: 10_000,
  orders: 5_000,
  films: 60_000,
} as const;

/**
 * AbortController-based polling engine.
 *
 * Uses setTimeout-after-completion to avoid request overlap when the fetch
 * takes longer than intervalMs. start()/stop() control the lifecycle.
 */
export class Poller<T> {
  private controller: AbortController | undefined;

  constructor(private config: PollerConfig<T>) {}

  start(): void {
    if (this.controller) return;
    this.controller = new AbortController();
    this.loop(this.controller.signal);
  }

  stop(): void {
    this.controller?.abort();
    this.controller = undefined;
  }

  get isRunning(): boolean {
    return this.controller !== undefined;
  }

  private async loop(signal: AbortSignal): Promise<void> {
    while (!signal.aborted) {
      try {
        const data = await this.config.fetch(signal);
        if (!signal.aborted) {
          this.config.onData(data);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        if (this.config.onError) {
          this.config.onError(error);
        } else {
          console.warn('[theatrical/events] poll error:', error);
        }
      }
      if (!signal.aborted) {
        await this.delay(this.config.intervalMs, signal);
      }
    }
  }

  private delay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
    });
  }
}
