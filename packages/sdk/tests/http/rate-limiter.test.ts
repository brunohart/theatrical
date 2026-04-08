import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RateLimiter,
  DEFAULT_RATE_LIMITER_CONFIG,
  type RateLimiterConfig,
} from '../../src/http/rate-limiter';

/**
 * Tests for the sliding-window rate limiter.
 * Validates slot acquisition, window eviction, blocking behaviour, and reset
 * against typical Vista OCAPI throughput scenarios.
 */

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('construction', () => {
    it('initialises with zero active requests', () => {
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60_000 });
      expect(limiter.activeCount).toBe(0);
    });

    it('uses DEFAULT_RATE_LIMITER_CONFIG when no argument is provided', () => {
      const limiter = new RateLimiter();
      expect(limiter.activeCount).toBe(0);
    });
  });

  describe('waitForSlot', () => {
    it('resolves immediately when under the request limit', async () => {
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 60_000 });
      await expect(limiter.waitForSlot()).resolves.toBeUndefined();
      expect(limiter.activeCount).toBe(1);
    });

    it('tracks all accepted requests in the active count', async () => {
      vi.setSystemTime(new Date('2026-04-08T20:00:00.000Z'));
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60_000 });

      await limiter.waitForSlot(); // request 1 — Roxy Cinema Wellington
      await limiter.waitForSlot(); // request 2 — Embassy Theatre Wellington
      await limiter.waitForSlot(); // request 3 — Event Cinemas Queen Street

      expect(limiter.activeCount).toBe(3);
    });

    it('blocks when at the limit and resolves after the window advances', async () => {
      vi.setSystemTime(new Date('2026-04-08T20:00:00.000Z'));
      const config: RateLimiterConfig = { maxRequests: 2, windowMs: 1_000 };
      const limiter = new RateLimiter(config);

      await limiter.waitForSlot(); // slot 1
      await limiter.waitForSlot(); // slot 2 — limit reached

      // Third call should block
      const blocked = limiter.waitForSlot();

      // Advance past the 1-second window so both prior requests expire
      await vi.advanceTimersByTimeAsync(1_001);

      await expect(blocked).resolves.toBeUndefined();
    });

    it('evicts timestamps outside the window from the active count', async () => {
      vi.setSystemTime(new Date('2026-04-08T20:00:00.000Z'));
      const config: RateLimiterConfig = { maxRequests: 5, windowMs: 1_000 };
      const limiter = new RateLimiter(config);

      await limiter.waitForSlot(); // t=0
      await limiter.waitForSlot(); // t=0
      expect(limiter.activeCount).toBe(2);

      // Advance past the window — those timestamps should no longer count
      vi.setSystemTime(new Date('2026-04-08T20:00:01.100Z'));
      expect(limiter.activeCount).toBe(0);
    });
  });

  describe('reset', () => {
    it('clears all recorded timestamps', async () => {
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60_000 });
      await limiter.waitForSlot();
      await limiter.waitForSlot();
      expect(limiter.activeCount).toBe(2);

      limiter.reset();
      expect(limiter.activeCount).toBe(0);
    });

    it('allows requests again immediately after reset when limit was reached', async () => {
      vi.setSystemTime(new Date('2026-04-08T20:00:00.000Z'));
      const config: RateLimiterConfig = { maxRequests: 2, windowMs: 60_000 };
      const limiter = new RateLimiter(config);

      await limiter.waitForSlot(); // slot 1
      await limiter.waitForSlot(); // slot 2 — limit reached

      limiter.reset();

      // After reset, should accept new requests without blocking
      await expect(limiter.waitForSlot()).resolves.toBeUndefined();
      expect(limiter.activeCount).toBe(1);
    });
  });
});
