import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { StateStore } from '../../src/state-store';

interface Item {
  id: string;
  name: string;
}

describe('StateStore', () => {
  let store: StateStore<Item>;

  beforeEach(() => {
    store = new StateStore<Item>();
  });

  it('stores and retrieves a value', () => {
    store.set('a', { id: 'a', name: 'Alpha' });
    expect(store.get('a')).toEqual({ id: 'a', name: 'Alpha' });
  });

  it('returns undefined for missing keys', () => {
    expect(store.get('missing')).toBeUndefined();
  });

  it('returns all stored values via getAll()', () => {
    store.set('a', { id: 'a', name: 'Alpha' });
    store.set('b', { id: 'b', name: 'Beta' });
    expect(store.getAll()).toHaveLength(2);
  });

  it('clears all entries', () => {
    store.set('a', { id: 'a', name: 'Alpha' });
    store.clear();
    expect(store.getAll()).toHaveLength(0);
    expect(store.size).toBe(0);
  });

  it('has() returns true for present keys', () => {
    store.set('a', { id: 'a', name: 'Alpha' });
    expect(store.has('a')).toBe(true);
    expect(store.has('missing')).toBe(false);
  });

  it('delete() removes a single entry', () => {
    store.set('a', { id: 'a', name: 'Alpha' });
    store.set('b', { id: 'b', name: 'Beta' });
    store.delete('a');
    expect(store.has('a')).toBe(false);
    expect(store.has('b')).toBe(true);
  });

  describe('TTL expiry', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('returns value before TTL expires', () => {
      store.set('a', { id: 'a', name: 'Alpha' }, 1000);
      vi.advanceTimersByTime(500);
      expect(store.get('a')).toEqual({ id: 'a', name: 'Alpha' });
    });

    it('returns undefined and evicts after TTL expires', () => {
      store.set('a', { id: 'a', name: 'Alpha' }, 1000);
      vi.advanceTimersByTime(1001);
      expect(store.get('a')).toBeUndefined();
      expect(store.size).toBe(0);
    });

    it('isStale() returns true for expired entries', () => {
      store.set('a', { id: 'a', name: 'Alpha' }, 500);
      vi.advanceTimersByTime(501);
      expect(store.isStale('a')).toBe(true);
    });

    it('isStale() returns false for fresh entries', () => {
      store.set('a', { id: 'a', name: 'Alpha' }, 5000);
      expect(store.isStale('a')).toBe(false);
    });

    it('getAll() evicts and excludes expired entries', () => {
      store.set('a', { id: 'a', name: 'Alpha' }, 500);
      store.set('b', { id: 'b', name: 'Beta' }, 5000);
      vi.advanceTimersByTime(501);
      const all = store.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe('b');
    });

    it('entries without TTL never expire', () => {
      store.set('a', { id: 'a', name: 'Alpha' });
      vi.advanceTimersByTime(999_999);
      expect(store.get('a')).toBeDefined();
    });
  });
});
