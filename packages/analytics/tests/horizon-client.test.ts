import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HorizonClient } from '../src/horizon-client';
import type { HorizonQuery } from '../src/types';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeResult(rows: Record<string, unknown>[], hasMore = false) {
  return {
    rows,
    total: rows.length,
    hasMore,
    queryTimeMs: 42,
  };
}

function mockOkResponse(body: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(body),
  } as Response);
}

const baseConfig = {
  baseUrl: 'https://horizon.vista.co',
  authMode: 'api-key' as const,
  apiKey: 'test_key',
  tenantId: 'tenant_test',
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
    mockOkResponse(makeResult([{ film: 'Inception', admissions: 200 }]));

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
    expect(result.rows[0].film).toBe('Inception');
  });

  it('rejects invalid config (api-key mode without key)', () => {
    expect(() => new HorizonClient({
      baseUrl: 'https://horizon.vista.co',
      authMode: 'api-key',
      tenantId: 'tenant_test',
    })).toThrow();
  });

  it('auto-paginates through multiple pages with queryAll', async () => {
    mockOkResponse({ rows: [{ film: 'A', admissions: 1 }], total: 2, hasMore: true, nextCursor: 'cur_1', queryTimeMs: 10 });
    mockOkResponse({ rows: [{ film: 'B', admissions: 2 }], total: 2, hasMore: false, queryTimeMs: 10 });

    const client = new HorizonClient(baseConfig);
    const rows: unknown[] = [];
    for await (const row of client.queryAll({ metrics: ['admissions'], dimensions: ['film'], filters: [] })) {
      rows.push(row);
    }

    expect(rows).toHaveLength(2);
    expect((rows[0] as Record<string, unknown>).film).toBe('A');
    expect((rows[1] as Record<string, unknown>).film).toBe('B');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
