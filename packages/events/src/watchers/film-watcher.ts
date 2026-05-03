import type { Film } from '@theatrical/sdk';
import { BaseWatcher, BaseWatcherConfig } from './base-watcher';

export interface FilmAddedPayload {
  film: Film;
  timestamp: string;
}

export interface FilmRemovedPayload {
  film: Film;
  timestamp: string;
}

export interface FilmUpdatedPayload {
  film: Film;
  previous: Film;
  timestamp: string;
}

export type FilmEvents = {
  'film.added': FilmAddedPayload;
  'film.removed': FilmRemovedPayload;
  'film.updated': FilmUpdatedPayload;
};

export type FilmWatcherConfig = Omit<BaseWatcherConfig<Film>, 'intervalMs'> & {
  intervalMs?: number;
};

/**
 * Watches films for additions, removals, and metadata changes.
 *
 * Events:
 * - `film.added` — new film appeared in the catalogue
 * - `film.removed` — film disappeared from the catalogue
 * - `film.updated` — film metadata changed (title, synopsis, ratings, etc.)
 *
 * @example
 * ```typescript
 * const watcher = new FilmWatcher({
 *   fetch: (signal) => client.films.nowShowing({ siteId: 'site-001' }),
 * });
 * watcher.on('film.added', ({ film }) => notifyNewRelease(film));
 * watcher.start();
 * ```
 */
export class FilmWatcher extends BaseWatcher<Film, FilmEvents> {
  constructor(config: FilmWatcherConfig) {
    super({ ...config, intervalMs: config.intervalMs ?? 60_000 });
  }

  protected handleUpdate(current: Film[], previous: Film[]): void {
    const timestamp = new Date().toISOString();
    const events = this.diff(current, previous);

    for (const event of events) {
      if (event.type === 'added') {
        this.emit('film.added', { film: event.item, timestamp });
      } else if (event.type === 'removed') {
        this.emit('film.removed', { film: event.item, timestamp });
      } else if (event.type === 'changed') {
        this.emit('film.updated', {
          film: event.item,
          previous: event.previous!,
          timestamp,
        });
      }
    }
  }
}
