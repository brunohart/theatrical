import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HorizonClient } from '../src/horizon-client';
import type { HorizonQuery } from '../src/types';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeResult(rows: Record<string, unknown>[], hasMore = false, nextCursor?: string) {
  return {
    rows,
    total: rows.length,
    hasMore,
    nextCursor,
    queryTimeMs: 42,
  };
}

function mockOkResponse(body: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(''),
  } as Response);
}

function mockErrorResponse(status: number, statusText = 'Error') {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText,
    text: () => Promise.resolve(`{"error":"${statusText}"}`),
  } as unknown as Response);
}

const baseConfig = {
  baseUrl: 'https://horizon.vista.co',
  authMode: 'api-key' as const,
  apiKey: 'test_key',
  tenantId: 'tenant_test',
};

const oauthConfig = {
  baseUrl: 'https://horizon.vista.co',
  authMode: 'oauth' as const,
  clientId: 'client_nz_pvt',
  clientSecret: 'secret_abc123',
  tenantId: 'tenant_nz_pvt',
};

const simpleQuery: HorizonQuery = {
  metrics: ['admissions'],
  dimensions: ['film'],
  filters: [],
};

describe('HorizonClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('throws when no metrics are provided', async () => {
    const client = new HorizonClient(baseConfig);
    const query: HorizonQuery = { metrics: [], dimensions: ['film'], filters: [] };
    await expect(client.query(query)).rejects.toThrow('at least one metric');
  });

  it('throws when no dimensions are provided', async () => {
    const client = new HorizonClient(baseConfig);
    const query: HorizonQuery = { metrics: ['admissions'], dimensions: [], filters: [] };
    await expect(client.query(query)).rejects.toThrow('at least one dimension');
  });

  it('sends the correct request headers and body', async () => {
    mockOkResponse(makeResult([{ film: 'The Wild Robot', admissions: 1850 }]));

    const client = new HorizonClient(baseConfig);
    const query: HorizonQuery = {
      metrics: ['admissions'],
      dimensions: ['film'],
      filters: [{ field: 'date', operator: 'gte', value: '2026-01-01' }],
    };

    const result = await client.query(query);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://horizon.vista.co/api/v1/query');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toMatchObject({
      metrics: ['admissions'],
      dimensions: ['film'],
    });
    const headers = options.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer test_key');
    expect(headers['X-Horizon-Tenant']).toBe('tenant_test');

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].film).toBe('The Wild Robot');
  });

  it('rejects invalid config (api-key mode without key)', () => {
    expect(() => new HorizonClient({
      baseUrl: 'https://horizon.vista.co',
      authMode: 'api-key',
      tenantId: 'tenant_test',
    })).toThrow();
  });

  it('auto-paginates through multiple pages with queryAll', async () => {
    mockOkResponse(makeResult([{ film: 'The Wild Robot', admissions: 1850 }], true, 'cur_1'));
    mockOkResponse(makeResult([{ film: 'A Quiet Place: Day One', admissions: 2100 }], false));

    const client = new HorizonClient(baseConfig);
    const rows: unknown[] = [];
    for await (const row of client.queryAll(simpleQuery)) {
      rows.push(row);
    }

    expect(rows).toHaveLength(2);
    expect((rows[0] as Record<string, unknown>).film).toBe('The Wild Robot');
    expect((rows[1] as Record<string, unknown>).film).toBe('A Quiet Place: Day One');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  describe('OAuth authentication', () => {
    it('fetches an OAuth token before the first query', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'tok_nz_pvt_abc', expires_in: 3600 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(makeResult([{ film: 'The Last Projection', admissions: 420 }])),
          text: () => Promise.resolve(''),
        } as Response);

      const client = new HorizonClient(oauthConfig);
      const result = await client.query(simpleQuery);

      expect(mockFetch).toHaveBeenCalledTimes(2);

      const [tokenUrl, tokenOptions] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(tokenUrl).toBe('https://horizon.vista.co/oauth/token');
      expect(tokenOptions.method).toBe('POST');
      expect(tokenOptions.body).toContain('client_credentials');

      const [, queryOptions] = mockFetch.mock.calls[1] as [string, RequestInit];
      const headers = queryOptions.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer tok_nz_pvt_abc');

      expect(result.rows[0].film).toBe('The Last Projection');
    });

    it('reuses a cached token for subsequent queries', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'tok_cached', expires_in: 3600 }),
        } as Response)
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(makeResult([{ film: 'Neon Requiem', revenue: 5400 }])),
          text: () => Promise.resolve(''),
        } as Response);

      const client = new HorizonClient(oauthConfig);
      await client.query(simpleQuery);
      await client.query(simpleQuery);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      const [, , secondQueryOptions] = mockFetch.mock.calls as [string, RequestInit][];
      const headers = (secondQueryOptions as unknown as [string, RequestInit])[1].headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer tok_cached');
    });

    it('refreshes the token when it has expired', async () => {
      const freshTime = Date.now();
      vi.useFakeTimers();
      vi.setSystemTime(freshTime);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'tok_first', expires_in: 60 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(makeResult([{ film: 'Meridian', admissions: 300 }])),
          text: () => Promise.resolve(''),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'tok_refreshed', expires_in: 3600 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(makeResult([{ film: 'Meridian', admissions: 310 }])),
          text: () => Promise.resolve(''),
        } as Response);

      const client = new HorizonClient(oauthConfig);

      await client.query(simpleQuery);

      vi.advanceTimersByTime(90_000);

      const result = await client.query(simpleQuery);

      expect(mockFetch).toHaveBeenCalledTimes(4);
      const lastQueryOptions = (mockFetch.mock.calls[3] as [string, RequestInit])[1];
      expect((lastQueryOptions.headers as Record<string, string>)['Authorization']).toBe('Bearer tok_refreshed');
      expect(result.rows[0].admissions).toBe(310);

      vi.useRealTimers();
    });

    it('rejects invalid OAuth config (missing client secret)', () => {
      expect(() => new HorizonClient({
        baseUrl: 'https://horizon.vista.co',
        authMode: 'oauth',
        clientId: 'client_nz_pvt',
        tenantId: 'tenant_test',
      })).toThrow();
    });
  });

  describe('error handling', () => {
    it('rejects with a message containing the status code on non-ok responses', async () => {
      mockErrorResponse(503, 'Service Unavailable');

      const client = new HorizonClient(baseConfig);
      await expect(client.query(simpleQuery)).rejects.toThrow('503');
    });

    it('rejects on 401 with message containing status', async () => {
      mockErrorResponse(401, 'Unauthorized');

      const client = new HorizonClient(baseConfig);
      await expect(client.query(simpleQuery)).rejects.toThrow('401');
    });
  });
});
