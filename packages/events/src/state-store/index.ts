interface StoreEntry<T> {
  value: T;
  expiresAt: number | null;
}

/**
 * In-memory state store with optional TTL per entry.
 *
 * Expired entries are lazily evicted on read. Use isStale() to check
 * freshness before trusting a value for diff computation.
 */
export class StateStore<T extends { id: string }> {
  private store = new Map<string, StoreEntry<T>>();

  set(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: ttlMs !== undefined ? Date.now() + ttlMs : null,
    });
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  isStale(key: string): boolean {
    return this.get(key) === undefined;
  }

  getAll(): T[] {
    const result: T[] = [];
    for (const [key, entry] of this.store) {
      if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
        this.store.delete(key);
      } else {
        result.push(entry.value);
      }
    }
    return result;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
