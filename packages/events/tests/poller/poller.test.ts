import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Poller } from '../../src/poller';

describe('Poller', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('calls fetch and onData on the first tick', async () => {
    const fetchFn = vi.fn().mockResolvedValue(['session-001']);
    const onData = vi.fn();
    const poller = new Poller({ fetch: fetchFn, onData, intervalMs: 5000 });
    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchFn).toHaveBeenCalledOnce();
    expect(onData).toHaveBeenCalledWith(['session-001']);
    poller.stop();
  });

  it('isRunning reflects start/stop state', () => {
    const poller = new Poller({
      fetch: vi.fn().mockResolvedValue([]),
      onData: vi.fn(),
      intervalMs: 5000,
    });
    expect(poller.isRunning).toBe(false);
    poller.start();
    expect(poller.isRunning).toBe(true);
    poller.stop();
    expect(poller.isRunning).toBe(false);
  });

  it('calling start() twice does not create duplicate loops', async () => {
    const fetchFn = vi.fn().mockResolvedValue([]);
    const poller = new Poller({ fetch: fetchFn, onData: vi.fn(), intervalMs: 5000 });
    poller.start();
    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchFn).toHaveBeenCalledOnce();
    poller.stop();
  });

  it('stop() halts subsequent fetches', async () => {
    const fetchFn = vi.fn().mockResolvedValue([]);
    const poller = new Poller({ fetch: fetchFn, onData: vi.fn(), intervalMs: 1000 });
    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    poller.stop();
    const countAfterStop = fetchFn.mock.calls.length;
    await vi.advanceTimersByTimeAsync(3000);
    expect(fetchFn.mock.calls.length).toBe(countAfterStop);
  });

  it('calls onError when fetch rejects (non-abort error)', async () => {
    const onError = vi.fn();
    const poller = new Poller({
      fetch: vi.fn().mockRejectedValue(new Error('network failure')),
      onData: vi.fn(),
      onError,
      intervalMs: 5000,
    });
    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    poller.stop();
  });

  it('stop() does not trigger onError — AbortError is swallowed', async () => {
    const onError = vi.fn();
    let rejectFn: ((e: Error) => void) | undefined;
    const fetchFn = vi.fn().mockImplementation(() => {
      return new Promise<string[]>((_, reject) => {
        rejectFn = reject;
      });
    });
    const poller = new Poller({ fetch: fetchFn, onData: vi.fn(), onError, intervalMs: 5000 });
    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    poller.stop();
    const abortErr = new Error('aborted');
    abortErr.name = 'AbortError';
    rejectFn?.(abortErr);
    await vi.advanceTimersByTimeAsync(0);
    expect(onError).not.toHaveBeenCalled();
  });
});
