import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { MenuItem } from '@theatrical/sdk';
import { InventoryWatcher } from '../../src/watchers/inventory-watcher';

function createMenuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 'item-001',
    name: 'Large Popcorn',
    description: 'Freshly popped with real butter',
    price: 1150,
    currency: 'NZD',
    categoryId: 'cat-snacks',
    categoryName: 'Snacks',
    dietary: [],
    isAvailable: true,
    isPreOrderEligible: true,
    ...overrides,
  };
}

describe('InventoryWatcher', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('emits inventory.low when an item becomes unavailable', async () => {
    const available = createMenuItem({ isAvailable: true });
    const unavailable = createMenuItem({ isAvailable: false });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([available])
      .mockResolvedValueOnce([unavailable]);
    const watcher = new InventoryWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onLow = vi.fn();
    watcher.on('inventory.low', onLow);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onLow).toHaveBeenCalledOnce();
    expect(onLow.mock.calls[0][0].item.name).toBe('Large Popcorn');
    expect(onLow.mock.calls[0][0].item.isAvailable).toBe(false);
  });

  it('emits inventory.restocked when an item becomes available again', async () => {
    const unavailable = createMenuItem({ isAvailable: false });
    const restocked = createMenuItem({ isAvailable: true });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([unavailable])
      .mockResolvedValueOnce([restocked]);
    const watcher = new InventoryWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onRestocked = vi.fn();
    watcher.on('inventory.restocked', onRestocked);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onRestocked).toHaveBeenCalledOnce();
    expect(onRestocked.mock.calls[0][0].item.isAvailable).toBe(true);
    expect(onRestocked.mock.calls[0][0].previous.isAvailable).toBe(false);
  });

  it('emits menu.updated when item price changes', async () => {
    const original = createMenuItem({ price: 1150 });
    const priceChanged = createMenuItem({ price: 1250 });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([original])
      .mockResolvedValueOnce([priceChanged]);
    const watcher = new InventoryWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onUpdated = vi.fn();
    watcher.on('menu.updated', onUpdated);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onUpdated).toHaveBeenCalledOnce();
    expect(onUpdated.mock.calls[0][0].item.price).toBe(1250);
    expect(onUpdated.mock.calls[0][0].previous.price).toBe(1150);
  });

  it('emits menu.updated when dietary flags change', async () => {
    const original = createMenuItem({ dietary: [] });
    const updated = createMenuItem({ dietary: ['vegan', 'gluten-free'] });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([original])
      .mockResolvedValueOnce([updated]);
    const watcher = new InventoryWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onUpdated = vi.fn();
    watcher.on('menu.updated', onUpdated);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onUpdated).toHaveBeenCalledOnce();
    expect(onUpdated.mock.calls[0][0].item.dietary).toEqual(['vegan', 'gluten-free']);
  });

  it('emits both inventory.low and menu.updated when price changes with availability drop', async () => {
    const original = createMenuItem({ price: 1150, isAvailable: true });
    const changed = createMenuItem({ price: 1350, isAvailable: false });
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([original])
      .mockResolvedValueOnce([changed]);
    const watcher = new InventoryWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onLow = vi.fn();
    const onUpdated = vi.fn();
    watcher.on('inventory.low', onLow);
    watcher.on('menu.updated', onUpdated);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onLow).toHaveBeenCalledOnce();
    expect(onUpdated).toHaveBeenCalledOnce();
  });

  it('does not emit if item data is unchanged between polls', async () => {
    const item = createMenuItem();
    const fetchFn = vi.fn()
      .mockResolvedValueOnce([item])
      .mockResolvedValueOnce([item]);
    const watcher = new InventoryWatcher({ fetch: fetchFn, intervalMs: 1000 });
    const onLow = vi.fn();
    const onRestocked = vi.fn();
    const onUpdated = vi.fn();
    watcher.on('inventory.low', onLow);
    watcher.on('inventory.restocked', onRestocked);
    watcher.on('menu.updated', onUpdated);

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    expect(onLow).not.toHaveBeenCalled();
    expect(onRestocked).not.toHaveBeenCalled();
    expect(onUpdated).not.toHaveBeenCalled();
  });
});
