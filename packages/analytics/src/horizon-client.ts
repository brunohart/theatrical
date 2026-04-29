import { HorizonHTTPClient } from './client';
import type { HorizonConfig, HorizonQuery, HorizonQueryResult } from './types';
import type { QueryBuilder } from './query/query-builder';
import type { AnalyticsProvider, TrackEvent, IdentifyEvent } from './providers/base';

/**
 * The primary entry point for Theatrical's analytics package.
 *
 * `HorizonClient` provides a typed interface to Vista's Horizon data warehouse.
 * All queries are validated before dispatch; responses are normalised into
 * `HorizonQueryResult` envelopes with consistent pagination metadata.
 *
 * @example API-key authentication
 * ```typescript
 * import { HorizonClient } from '@theatrical/analytics';
 *
 * const horizon = new HorizonClient({
 *   baseUrl: 'https://horizon.vista.co',
 *   authMode: 'api-key',
 *   apiKey: process.env.HORIZON_API_KEY!,
 *   tenantId: 'tenant_nz_pvt',
 * });
 *
 * const result = await horizon.query({
 *   metrics: ['admissions', 'revenue'],
 *   dimensions: ['film', 'date'],
 *   filters: [{ field: 'date', operator: 'gte', value: '2026-01-01' }],
 *   limit: 100,
 * });
 *
 * for (const row of result.rows) {
 *   console.log(row.film, row.date, row.admissions, row.revenue);
 * }
 * ```
 *
 * @example OAuth client credentials
 * ```typescript
 * const horizon = new HorizonClient({
 *   baseUrl: 'https://horizon.vista.co',
 *   authMode: 'oauth',
 *   clientId: process.env.HORIZON_CLIENT_ID!,
 *   clientSecret: process.env.HORIZON_CLIENT_SECRET!,
 *   tenantId: 'tenant_nz_pvt',
 * });
 * ```
 */
export class HorizonClient {
  private readonly http: HorizonHTTPClient;
  private readonly providers: AnalyticsProvider[];

  constructor(config: HorizonConfig & { providers?: AnalyticsProvider[] }) {
    this.http = new HorizonHTTPClient(config);
    this.providers = config.providers ?? [];
  }

  /**
   * Fan an analytics event out to all registered providers.
   *
   * Uses `Promise.allSettled` — a failing provider never blocks others.
   * Rejections are logged with the provider name but not re-thrown.
   *
   * @example
   * ```typescript
   * await horizon.track({
   *   type: 'session_browsed',
   *   userId: 'mem_hemi_walker_5528',
   *   properties: { filmId: 'film_001', siteId: 'site_roxy_wellington' },
   * });
   * ```
   */
  async track(event: TrackEvent): Promise<void> {
    const results = await Promise.allSettled(
      this.providers.map((p) => p.track(event)),
    );
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.warn(
          `[theatrical/analytics] provider "${this.providers[i].name}" failed to track event "${event.type}":`,
          result.reason,
        );
      }
    });
  }

  /**
   * Fan an identify event out to all providers that support it.
   *
   * @example
   * ```typescript
   * await horizon.identify({
   *   userId: 'mem_hemi_walker_5528',
   *   traits: { tier: 'gold', pointsBalance: 4200 },
   * });
   * ```
   */
  async identify(user: IdentifyEvent): Promise<void> {
    const results = await Promise.allSettled(
      this.providers
        .filter((p): p is AnalyticsProvider & Required<Pick<AnalyticsProvider, 'identify'>> =>
          typeof p.identify === 'function',
        )
        .map((p) => p.identify(user)),
    );
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.warn(
          `[theatrical/analytics] provider "${this.providers[i].name}" failed to identify user "${user.userId}":`,
          result.reason,
        );
      }
    });
  }

  /**
   * Flush all providers that support buffering.
   * Call before process exit to ensure no events are dropped.
   */
  async flush(): Promise<void> {
    await Promise.allSettled(
      this.providers
        .filter((p): p is AnalyticsProvider & Required<Pick<AnalyticsProvider, 'flush'>> =>
          typeof p.flush === 'function',
        )
        .map((p) => p.flush()),
    );
  }

  /**
   * Execute an analytics query against Horizon and return the first page of results.
   *
   * The query must specify at least one metric and at least one dimension.
   * Horizon enforces valid metric/dimension combinations server-side; the
   * `QueryBuilder` (from `@theatrical/analytics/builder`) validates common
   * constraints client-side before the request is sent.
   *
   * @param query - The query to execute
   * @returns A normalised result envelope with rows, total count, and pagination metadata
   *
   * @example
   * ```typescript
   * const result = await horizon.query({
   *   metrics: ['admissions'],
   *   dimensions: ['site', 'month'],
   *   filters: [{ field: 'month', operator: 'gte', value: '2026-01' }],
   *   sortBy: { field: 'admissions', direction: 'desc' },
   *   limit: 10,
   * });
   * ```
   */
  async query(query: HorizonQuery): Promise<HorizonQueryResult> {
    if (query.metrics.length === 0) {
      throw new Error('HorizonClient.query: at least one metric is required');
    }
    if (query.dimensions.length === 0) {
      throw new Error('HorizonClient.query: at least one dimension is required');
    }

    return this.http.post<HorizonQueryResult>('/api/v1/query', query);
  }

  /**
   * Auto-paginate through all pages of a query result, yielding each row.
   *
   * Internally uses cursor-based pagination. The generator fetches the next
   * page transparently when the current page is exhausted.
   *
   * @param query - The base query (limit controls page size; offset/cursor are managed internally)
   *
   * @example
   * ```typescript
   * for await (const row of horizon.queryAll({
   *   metrics: ['revenue'],
   *   dimensions: ['film'],
   *   filters: [],
   *   limit: 500,
   * })) {
   *   console.log(row.film, row.revenue);
   * }
   * ```
   */
  async *queryAll(
    query: HorizonQuery,
  ): AsyncGenerator<Record<string, string | number | null>, void, undefined> {
    let cursor: string | undefined;

    do {
      const result = await this.query({ ...query, ...(cursor ? { cursor } : {}) });

      for (const row of result.rows) {
        yield row;
      }

      cursor = result.nextCursor;
    } while (cursor);
  }

  /**
   * Execute a `QueryBuilder` and return the first page of results.
   *
   * Convenience method — equivalent to `horizon.query(builder.build())`.
   *
   * @example
   * ```typescript
   * const result = await horizon.execute(
   *   new QueryBuilder()
   *     .metric('admissions')
   *     .dimension('film')
   *     .filter('date', 'gte', '2026-01-01')
   *     .sort('admissions', 'desc')
   *     .limit(10)
   * );
   * ```
   */
  async execute(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder: QueryBuilder<any>,
  ): Promise<HorizonQueryResult> {
    return this.query(builder.build());
  }
}
