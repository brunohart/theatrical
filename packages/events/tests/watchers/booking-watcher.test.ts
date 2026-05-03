import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Order } from '@theatrical/sdk';
import { BookingWatcher } from '../../src/watchers/booking-watcher';

function createOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ord-001',
    sessionId: 'ses-001',
    status: 'pending',
    tickets: [],
    items: [],
    subtotal: 2400,
    tax: 288,
    discount: 0,
    total: 2688,
    currency: 'NZD',
    createdAt: '2026-05-03T08:00:00Z',
    ...overrides,
  };
}

describe('BookingWatcher', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('emits booking.created when a new order appears', async () => {
    const order = createOrder();
    const fetchFn = vi.fn().mockResolvedValue([order]);
    const watcher = new BookingWatcher({ fetch: fetchFn, intervalMs: 5000 });
    const onCreated = vi.fn();
    watcher.on('booking.created', onCreated);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    watcher.stop();

    expect(onCreated).toHaveBeenCalledOnce();
    expect(onCreated.mock.calls[0][0].order.id).toBe('ord-001');
    expect(onCreated.mock.calls[0][0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('emits booking.confirmed when order status transitions to confirmed', async () => {
    const pending = createOrder({ status: 'pending' });
    const confirmed = createOrder({ status: 'confirmed' });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([pending])
      .mockResolvedValueOnce([confirmed]);
    const watcher = new BookingWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onConfirmed = vi.fn();
    watcher.on('booking.confirmed', onConfirmed);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onConfirmed).toHaveBeenCalledOnce();
    expect(onConfirmed.mock.calls[0][0].order.status).toBe('confirmed');
    expect(onConfirmed.mock.calls[0][0].previousStatus).toBe('pending');
  });

  it('emits booking.cancelled when order status transitions to cancelled', async () => {
    const pending = createOrder({ status: 'pending' });
    const cancelled = createOrder({ status: 'cancelled' });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([pending])
      .mockResolvedValueOnce([cancelled]);
    const watcher = new BookingWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onCancelled = vi.fn();
    watcher.on('booking.cancelled', onCancelled);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onCancelled).toHaveBeenCalledOnce();
    expect(onCancelled.mock.calls[0][0].order.id).toBe('ord-001');
    expect(onCancelled.mock.calls[0][0].previousStatus).toBe('pending');
  });

  it('does not emit booking.confirmed if status was already confirmed', async () => {
    const confirmed = createOrder({ status: 'confirmed' });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([confirmed])
      .mockResolvedValueOnce([confirmed]);
    const watcher = new BookingWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onConfirmed = vi.fn();
    watcher.on('booking.confirmed', onConfirmed);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onConfirmed).not.toHaveBeenCalled();
  });

  it('tracks multiple orders independently', async () => {
    const orderA = createOrder({ id: 'ord-A', status: 'pending' });
    const orderB = createOrder({ id: 'ord-B', status: 'pending' });
    const orderAConfirmed = createOrder({ id: 'ord-A', status: 'confirmed' });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([orderA, orderB])
      .mockResolvedValueOnce([orderAConfirmed, orderB]);
    const watcher = new BookingWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onConfirmed = vi.fn();
    watcher.on('booking.confirmed', onConfirmed);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onConfirmed).toHaveBeenCalledOnce();
    expect(onConfirmed.mock.calls[0][0].order.id).toBe('ord-A');
  });

  it('start() and stop() control the polling lifecycle', async () => {
    const fetchFn = vi.fn().mockResolvedValue([]);
    const watcher = new BookingWatcher({ fetch: fetchFn, intervalMs: 1000 });
    expect(watcher.isRunning).toBe(false);
    watcher.start();
    expect(watcher.isRunning).toBe(true);
    watcher.stop();
    expect(watcher.isRunning).toBe(false);
  });
});
