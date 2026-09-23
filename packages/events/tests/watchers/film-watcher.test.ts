import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Film } from '@theatrical/sdk';
import { FilmWatcher } from '../../src/watchers/film-watcher';

function createFilm(overrides: Partial<Film> = {}): Film {
  return {
    id: 'film-001',
    title: 'The Last Projection',
    synopsis: 'A projectionist discovers her cinema holds secrets between frames.',
    genres: ['drama', 'mystery'],
    runtimeMinutes: 118,
    rating: { classification: 'M', description: 'Mature themes' },
    releaseDate: '2026-04-18',
    posterUrl: 'https://images.theatrical.dev/the-last-projection.jpg',
    formats: ['2D', 'Dolby Atmos'],
    languages: ['en'],
    isNowShowing: true,
    ...overrides,
  };
}

describe('FilmWatcher', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('emits film.added when a new film appears in the catalogue', async () => {
    const film = createFilm();
    const fetchFn = vi.fn().mockResolvedValue([film]);
    const watcher = new FilmWatcher({ fetch: fetchFn, intervalMs: 5000 });
    const onAdded = vi.fn();
    watcher.on('film.added', onAdded);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    watcher.stop();

    expect(onAdded).toHaveBeenCalledOnce();
    expect(onAdded.mock.calls[0][0].film.title).toBe('The Last Projection');
    expect(onAdded.mock.calls[0][0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('emits film.removed when a film disappears from the catalogue', async () => {
    const film = createFilm();
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([film])
      .mockResolvedValueOnce([]);
    const watcher = new FilmWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onRemoved = vi.fn();
    watcher.on('film.removed', onRemoved);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onRemoved).toHaveBeenCalledOnce();
    expect(onRemoved.mock.calls[0][0].film.id).toBe('film-001');
  });

  it('emits film.removed once, not again on every poll after', async () => {
    const filmA = createFilm({ id: 'film-A' });
    const filmB = createFilm({ id: 'film-B' });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([filmA, filmB])
      .mockResolvedValue([filmA]);
    const watcher = new FilmWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onRemoved = vi.fn();
    watcher.on('film.removed', onRemoved);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(3000);
    watcher.stop();

    expect(fetchFn).toHaveBeenCalledTimes(4);
    expect(onRemoved).toHaveBeenCalledOnce();
    expect(onRemoved.mock.calls[0][0].film.id).toBe('film-B');
  });

  it('does not announce a film as new when it returns after a short absence', async () => {
    const film = createFilm();
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([film])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([film]);
    const watcher = new FilmWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onAdded = vi.fn();
    const onRemoved = vi.fn();
    watcher.on('film.added', onAdded);
    watcher.on('film.removed', onRemoved);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(2000);
    watcher.stop();

    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(onRemoved).toHaveBeenCalledOnce();
    expect(onAdded).toHaveBeenCalledOnce();
  });

  it('forgets a film missing for longer than rememberPolls, and announces its return', async () => {
    const film = createFilm();
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([film])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([film]);
    const watcher = new FilmWatcher({ fetch: fetchFn, intervalMs: 1000, rememberPolls: 1 });
    const onAdded = vi.fn();
    watcher.on('film.added', onAdded);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(3000);
    watcher.stop();

    expect(fetchFn).toHaveBeenCalledTimes(4);
    expect(onAdded).toHaveBeenCalledTimes(2);
  });

  it('emits film.updated when film metadata changes', async () => {
    const original = createFilm({ title: 'The Last Projection' });
    const updated = createFilm({ title: 'The Last Projection: Director\'s Cut' });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([original])
      .mockResolvedValueOnce([updated]);
    const watcher = new FilmWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onUpdated = vi.fn();
    watcher.on('film.updated', onUpdated);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onUpdated).toHaveBeenCalledOnce();
    expect(onUpdated.mock.calls[0][0].film.title).toBe("The Last Projection: Director's Cut");
    expect(onUpdated.mock.calls[0][0].previous.title).toBe('The Last Projection');
  });

  it('tracks multiple films independently', async () => {
    const filmA = createFilm({ id: 'film-A', title: 'The Wild Robot' });
    const filmB = createFilm({ id: 'film-B', title: 'Paddington in Peru' });
    const filmBUpdated = createFilm({ id: 'film-B', title: 'Paddington in Peru (Extended)' });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([filmA, filmB])
      .mockResolvedValueOnce([filmA, filmBUpdated]);
    const watcher = new FilmWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onUpdated = vi.fn();
    watcher.on('film.updated', onUpdated);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onUpdated).toHaveBeenCalledOnce();
    expect(onUpdated.mock.calls[0][0].film.id).toBe('film-B');
  });

  it('uses 60-second default polling interval', () => {
    const fetchFn = vi.fn().mockResolvedValue([]);
    const watcher = new FilmWatcher({ fetch: fetchFn });
    expect(watcher.isRunning).toBe(false);
    watcher.start();
    expect(watcher.isRunning).toBe(true);
    watcher.stop();
    expect(watcher.isRunning).toBe(false);
  });
});
