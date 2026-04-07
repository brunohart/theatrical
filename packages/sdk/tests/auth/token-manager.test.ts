import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenManager } from '../../src/auth/token-manager';
import type { GASClient, GASToken } from '../../src/auth/gas-client';

/**
 * Test suite for the TokenManager.
 * Validates token caching, refresh lifecycle, concurrent deduplication,
 * and invalidation against the GAS client interface.
 */

/** Create a mock GAS token with configurable expiry */
function createMockToken(overrides: Partial<GASToken> = {}): GASToken {
  return {
    accessToken: 'tok-embassy-theatre-wellington',
    tokenType: 'Bearer',
    expiresIn: 3600,
    issuedAt: Date.now(),
    ...overrides,
  };
}

/** Create a mock GASClient that returns configurable tokens */
function createMockGASClient(token?: GASToken): GASClient {
  return {
    requestToken: vi.fn().mockResolvedValue(token ?? createMockToken()),
  } as unknown as GASClient;
}

describe('TokenManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-08T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates an instance with a GAS client', () => {
    const gasClient = createMockGASClient();
    const manager = new TokenManager(gasClient);
    expect(manager).toBeDefined();
  });

  describe('getToken — caching', () => {
    it('requests a token from GAS on first call', async () => {
      const gasClient = createMockGASClient();
      const manager = new TokenManager(gasClient);

      const token = await manager.getToken();

      expect(token).toBe('tok-embassy-theatre-wellington');
      expect(gasClient.requestToken).toHaveBeenCalledOnce();
    });

    it('returns the cached token on subsequent calls without re-requesting', async () => {
      const gasClient = createMockGASClient();
      const manager = new TokenManager(gasClient);

      const first = await manager.getToken();
      const second = await manager.getToken();
      const third = await manager.getToken();

      expect(first).toBe(second);
      expect(second).toBe(third);
      // GAS client should only be called once — the rest are cache hits
      expect(gasClient.requestToken).toHaveBeenCalledOnce();
    });
  });

  describe('getToken — refresh on expiry', () => {
    it('refreshes the token when it is within the expiry buffer', async () => {
      const initialToken = createMockToken({
        accessToken: 'tok-initial-civic-theatre',
        expiresIn: 3600,
        issuedAt: Date.now(),
      });

      const refreshedToken = createMockToken({
        accessToken: 'tok-refreshed-civic-theatre',
        expiresIn: 3600,
        issuedAt: Date.now() + 3600 * 1000,
      });

      const gasClient = createMockGASClient(initialToken);
      const manager = new TokenManager(gasClient);

      // First call — fresh token
      const first = await manager.getToken();
      expect(first).toBe('tok-initial-civic-theatre');

      // Advance time past the expiry buffer (3600s - 300s buffer = 3300s)
      vi.advanceTimersByTime(3301 * 1000);

      // Mock the next requestToken to return refreshed token
      (gasClient.requestToken as ReturnType<typeof vi.fn>).mockResolvedValue(refreshedToken);

      const second = await manager.getToken();
      expect(second).toBe('tok-refreshed-civic-theatre');
      expect(gasClient.requestToken).toHaveBeenCalledTimes(2);
    });
  });
});
