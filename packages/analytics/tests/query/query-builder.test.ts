import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryBuilder, FilterBuilder } from '../../src/query/index';
import { HorizonClient } from '../../src/horizon-client';
import type { HorizonQuery } from '../../src/types';

// ────────────────────────────────────────────────────────────────────────────
// QueryBuilder unit tests
// ────────────────────────────────────────────────────────────────────────────

describe('QueryBuilder', () => {
  describe('build()', () => {
    it('builds a minimal valid query', () => {
      const query = new QueryBuilder()
        .metric('admissions')
        .dimension('film')
        .build();

      expect(query).toMatchObject<Partial<HorizonQuery>>({
        metrics: ['admissions'],
        dimensions: ['film'],
        filters: [],
      });
    });

    it('builds a query with multiple dimensions', () => {
      const query = new QueryBuilder()
        .metric('revenue')
        .dimension('site')
        .dimension('month')
        .build();

      expect(query.metrics).toEqual(['revenue']);
      expect(query.dimensions).toEqual(['site', 'month']);
    });

    it('attaches a filter clause', () => {
      const query = new QueryBuilder()
        .metric('admissions')
        .dimension('film')
        .filter('date', 'gte', '2026-01-01')
        .build();

      expect(query.filters).toHaveLength(1);
      expect(query.filters[0]).toEqual({ field: 'date', operator: 'gte', value: '2026-01-01' });
    });

    it('attaches multiple filter clauses', () => {
      const query = new QueryBuilder()
        .metric('revenue')
        .dimension('site')
        .filter('date', 'gte', '2026-01-01')
        .filter('date', 'lte', '2026-03-31')
        .filter('site', 'in', ['site_roxy_wellington', 'site_embassy_wellington'])
        .build();

      expect(query.filters).toHaveLength(3);
    });

    it('accepts filters from a FilterBuilder', () => {
      const fb = new FilterBuilder()
        .from('date', '2026-01-01')
        .to('date', '2026-03-31')
        .in('site', ['site_roxy_wellington', 'site_civic_auckland']);

      const query = new QueryBuilder()
        .metric('admissions')
        .dimension('site')
        .filters(fb)
        .build();

      expect(query.filters).toHaveLength(3);
      expect(query.filters[0]).toMatchObject({ field: 'date', operator: 'gte' });
      expect(query.filters[2]).toMatchObject({ field: 'site', operator: 'in' });
    });

    it('applies sort, limit and offset', () => {
      const query = new QueryBuilder()
        .metric('admissions')
        .dimension('film')
        .sort('admissions', 'desc')
        .limit(25)
        .offset(50)
        .build();

      expect(query.sortBy).toEqual({ field: 'admissions', direction: 'desc' });
      expect(query.limit).toBe(25);
      expect(query.offset).toBe(50);
    });

    it('applies cursor pagination (cursor takes precedence over offset)', () => {
      const query = new QueryBuilder()
        .metric('admissions')
        .dimension('film')
        .offset(100)
        .cursor('cur_page2')
        .build();

      expect(query.cursor).toBe('cur_page2');
      expect(query.offset).toBeUndefined();
    });

    it('throws when no metric is set', () => {
      expect(() =>
        (new QueryBuilder() as unknown as QueryBuilder<'admissions'>)
          .dimension('film' as never)
          .build(),
      ).toThrow('metric()');
    });

    it('throws when no dimension is set', () => {
      expect(() =>
        new QueryBuilder().metric('admissions').build(),
      ).toThrow('dimension()');
    });
  });

  describe('metric type constraints', () => {
    it('accepts all dimensions for admissions', () => {
      expect(() =>
        new QueryBuilder().metric('admissions').dimension('film').build(),
      ).not.toThrow();

      expect(() =>
        new QueryBuilder().metric('admissions').dimension('loyalty_tier').build(),
      ).not.toThrow();

      expect(() =>
        new QueryBuilder().metric('admissions').dimension('channel').build(),
      ).not.toThrow();
    });

    it('accepts only valid dimensions for occupancy_rate', () => {
      expect(() =>
        new QueryBuilder().metric('occupancy_rate').dimension('screen').build(),
      ).not.toThrow();

      expect(() =>
        new QueryBuilder().metric('occupancy_rate').dimension('site').build(),
      ).not.toThrow();

      // TypeScript would reject this at compile time — we confirm runtime accepts valid ones
      expect(() =>
        new QueryBuilder().metric('occupancy_rate').dimension('session_format').build(),
      ).not.toThrow();
    });

    it('accepts loyalty_tier as a dimension for loyalty_points_issued', () => {
      const query = new QueryBuilder()
        .metric('loyalty_points_issued')
        .dimension('loyalty_tier')
        .build();

      expect(query.dimensions).toContain('loyalty_tier');
    });

    it('accepts film and ticket_type for fnb_revenue', () => {
      const query = new QueryBuilder()
        .metric('fnb_revenue')
        .dimension('site')
        .dimension('ticket_type')
        .build();

      expect(query.dimensions).toEqual(['site', 'ticket_type']);
    });

    /*
     * Compile-time proof that TypeScript rejects invalid metric/dimension combos.
     * Uncomment the @ts-expect-error lines to see the type error.
     */
    it('TypeScript rejects invalid dimension for occupancy_rate at compile time', () => {
      // @ts-expect-error — 'channel' is not a valid dimension for 'occupancy_rate'
      expect(() => new QueryBuilder().metric('occupancy_rate').dimension('channel').build()).toThrow();
    });

    it('TypeScript rejects loyalty_tier for fnb_revenue at compile time', () => {
      // @ts-expect-error — 'loyalty_tier' is not a valid dimension for 'fnb_revenue'
      expect(() => new QueryBuilder().metric('fnb_revenue').dimension('loyalty_tier').build()).toThrow();
    });

    it('TypeScript rejects screen dimension for cancellations at compile time', () => {
      // @ts-expect-error — 'screen' is not a valid dimension for 'cancellations'
      expect(() => new QueryBuilder().metric('cancellations').dimension('screen').build()).toThrow();
    });
  });

  describe('metric() method chaining', () => {
    it('replacing metric via chained .metric() returns a new builder', () => {
      const b1 = new QueryBuilder().metric('admissions');
      const b2 = b1.metric('revenue');
      expect(b1).not.toBe(b2);

      const q = b2.dimension('film').build();
      expect(q.metrics).toEqual(['revenue']);
    });

    it('carries over existing filters when metric changes', () => {
      const q = new QueryBuilder()
        .metric('admissions')
        .filter('date', 'gte', '2026-01-01')
        .metric('revenue')
        .dimension('site')
        .build();

      expect(q.metrics).toEqual(['revenue']);
      expect(q.filters[0]).toMatchObject({ field: 'date' });
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// FilterBuilder unit tests
// ────────────────────────────────────────────────────────────────────────────

describe('FilterBuilder', () => {
  it('builds empty filter array', () => {
    expect(new FilterBuilder().build()).toEqual([]);
  });

  it('accumulates where() clauses', () => {
    const filters = new FilterBuilder()
      .where('date', 'gte', '2026-01-01')
      .where('site', 'eq', 'site_roxy_wellington')
      .build();

    expect(filters).toHaveLength(2);
    expect(filters[0]).toMatchObject({ field: 'date', operator: 'gte', value: '2026-01-01' });
    expect(filters[1]).toMatchObject({ field: 'site', operator: 'eq', value: 'site_roxy_wellington' });
  });

  it('shorthand equals(), from(), to(), in() produce correct operators', () => {
    const filters = new FilterBuilder()
      .equals('channel', 'web')
      .from('date', '2026-01-01')
      .to('date', '2026-03-31')
      .in('site', ['site_roxy_wellington', 'site_penthouse'])
      .build();

    expect(filters[0]?.operator).toBe('eq');
    expect(filters[1]?.operator).toBe('gte');
    expect(filters[2]?.operator).toBe('lte');
    expect(filters[3]?.operator).toBe('in');
    expect(filters[3]?.value).toEqual(['site_roxy_wellington', 'site_penthouse']);
  });

  it('build() returns a copy — mutations do not propagate', () => {
    const fb = new FilterBuilder().where('date', 'gte', '2026-01-01');
    const a = fb.build();
    const b = fb.build();
    expect(a).not.toBe(b);
    a.push({ field: 'extra', operator: 'eq', value: 'x' });
    expect(b).toHaveLength(1);
  });

  it('size returns the number of clauses', () => {
    const fb = new FilterBuilder().where('date', 'gte', '2026-01-01').where('site', 'eq', 'site_roxy');
    expect(fb.size).toBe(2);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// HorizonClient.execute() integration
// ────────────────────────────────────────────────────────────────────────────

describe('HorizonClient.execute()', () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => mockFetch.mockReset());

  it('delegates to query() with the built HorizonQuery', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        rows: [{ film: 'The Wild Robot', admissions: 1850 }],
        total: 1,
        hasMore: false,
        queryTimeMs: 18,
      }),
      text: () => Promise.resolve(''),
    } as Response);

    const client = new HorizonClient({
      baseUrl: 'https://horizon.vista.co',
      authMode: 'api-key',
      apiKey: 'test_key',
      tenantId: 'tenant_nz_pvt',
    });

    const result = await client.execute(
      new QueryBuilder()
        .metric('admissions')
        .dimension('film')
        .filter('date', 'gte', '2026-01-01')
        .sort('admissions', 'desc')
        .limit(5),
    );

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as HorizonQuery;
    expect(body.metrics).toEqual(['admissions']);
    expect(body.dimensions).toEqual(['film']);
    expect(body.limit).toBe(5);
    expect(body.sortBy).toEqual({ field: 'admissions', direction: 'desc' });

    expect(result.rows[0].film).toBe('The Wild Robot');
  });
});
