import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Session } from '@theatrical/sdk';
import { SessionWatcher } from '../../src/watchers/session-watcher';

function createSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'ses-001',
    filmId: 'film-001',
    siteId: 'site-001',
    startTime: '2026-05-03T19:00:00+12:00',
    endTime: '2026-05-03T21:00:00+12:00',
    format: '2D',
    isBookable: true,
    isSoldOut: false,
    seatsAvailable: 80,
    seatsTotal: 120,
    attributes: {},
    ...overrides,
  };
}

describe('SessionWatcher', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('emits session.added when a new session appears', async () => {
    const session = createSession();
    const fetchFn = vi.fn().mockResolvedValue([session]);
    const watcher = new SessionWatcher({ fetch: fetchFn, intervalMs: 10_000 });
    const onAdded = vi.fn();
    watcher.on('session.added', onAdded);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    watcher.stop();

    expect(onAdded).toHaveBeenCalledOnce();
    expect(onAdded.mock.calls[0][0].session.id).toBe('ses-001');
  });

  it('emits session.updated when session data changes', async () => {
    const original = createSession({ seatsAvailable: 80 });
    const updated = createSession({ seatsAvailable: 40 });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([original])
      .mockResolvedValueOnce([updated]);
    const watcher = new SessionWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onUpdated = vi.fn();
    watcher.on('session.updated', onUpdated);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onUpdated).toHaveBeenCalledOnce();
    expect(onUpdated.mock.calls[0][0].session.seatsAvailable).toBe(40);
    expect(onUpdated.mock.calls[0][0].previous.seatsAvailable).toBe(80);
  });

  it('emits session.soldout when isSoldOut transitions to true', async () => {
    const available = createSession({ isSoldOut: false, seatsAvailable: 2 });
    const soldOut = createSession({ isSoldOut: true, seatsAvailable: 0 });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([available])
      .mockResolvedValueOnce([soldOut]);
    const watcher = new SessionWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onSoldOut = vi.fn();
    const onUpdated = vi.fn();
    watcher.on('session.soldout', onSoldOut);
    watcher.on('session.updated', onUpdated);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onSoldOut).toHaveBeenCalledOnce();
    expect(onSoldOut.mock.calls[0][0].session.id).toBe('ses-001');
    expect(onUpdated).toHaveBeenCalledOnce();
  });

  it('does not emit session.soldout if already sold out on first poll', async () => {
    const soldOut = createSession({ isSoldOut: true, seatsAvailable: 0 });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([soldOut])
      .mockResolvedValueOnce([soldOut]);
    const watcher = new SessionWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onSoldOut = vi.fn();
    watcher.on('session.soldout', onSoldOut);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onSoldOut).not.toHaveBeenCalled();
  });

  it('tracks sessions at Embassy Theatre Wellington', async () => {
    const embassySessions = [
      createSession({ id: 'ses-embassy-1', siteId: 'site-embassy-wellington' }),
      createSession({ id: 'ses-embassy-2', siteId: 'site-embassy-wellington' }),
    ];
    const fetchFn = vi.fn().mockResolvedValue(embassySessions);
    const watcher = new SessionWatcher({ fetch: fetchFn, intervalMs: 10_000 });
    const onAdded = vi.fn();
    watcher.on('session.added', onAdded);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    watcher.stop();

    expect(onAdded).toHaveBeenCalledTimes(2);
  });
});
