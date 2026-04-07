import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GASClient, type GASConfig } from '../../src/auth/gas-client';

/**
 * Test suite for the GAS (Global Authentication Service) client.
 * Validates JWT token acquisition, error handling, and response parsing
 * against Vista's auth.moviexchange.com endpoint.
 */

/** Default test config pointing to a mock GAS endpoint */
const TEST_CONFIG: GASConfig = {
  apiKey: 'test-api-key-nz-hoyts',
  authUrl: 'https://auth.moviexchange.com',
};

/** Helper to create a mock fetch response */
function mockFetchResponse(data: Record<string, unknown>, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 401 ? 'Unauthorized' : status === 403 ? 'Forbidden' : 'Internal Server Error',
    json: () => Promise.resolve(data),
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: () => ({} as Response),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response;
}

describe('GASClient', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('creates an instance with the provided config', () => {
    const client = new GASClient(TEST_CONFIG);
    expect(client).toBeDefined();
  });

  describe('requestToken', () => {
    it('sends a client_credentials grant and returns a parsed GAS token', async () => {
      const mockTokenResponse = {
        access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.mock-gas-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      globalThis.fetch = vi.fn().mockResolvedValue(
        mockFetchResponse(mockTokenResponse),
      );

      vi.setSystemTime(new Date('2026-04-08T10:00:00Z'));

      const client = new GASClient(TEST_CONFIG);
      const token = await client.requestToken();

      // Verify the request was made correctly
      expect(fetch).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledWith(
        'https://auth.moviexchange.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'client_credentials',
            api_key: 'test-api-key-nz-hoyts',
          }),
        }),
      );

      // Verify token parsing
      expect(token.accessToken).toBe('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.mock-gas-token');
      expect(token.tokenType).toBe('Bearer');
      expect(token.expiresIn).toBe(3600);
      expect(token.issuedAt).toBe(Date.now());
    });
  });
});
