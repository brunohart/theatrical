import type { HorizonMetric, HorizonQuery, QueryFilter, SortDirection } from '../types';
import type { ValidDimensionFor } from './metric-types';
import { VALID_DIMENSIONS_FOR } from './metric-types';
import { FilterBuilder } from './filter-builder';

/**
 * Fluent, type-safe builder for Horizon analytics queries.
 *
 * The generic parameter `M` tracks the metric selected via `.metric()`. Once a
 * metric is set, `.dimension()` only accepts dimensions that are valid for that
 * metric — invalid combinations produce a compile-time error rather than a
 * runtime 400 from the API.
 *
 * @typeParam M - The metric currently selected (starts as `never`; set by `.metric()`)
 *
 * @example Basic admissions query
 * ```typescript
 * import { QueryBuilder } from '@theatrical/analytics';
 *
 * const query = new QueryBuilder()
 *   .metric('admissions')
 *   .dimension('film')
 *   .dimension('date')
 *   .filter('date', 'gte', '2026-01-01')
 *   .sort('admissions', 'desc')
 *   .limit(10)
 *   .build();
 * ```
 *
 * @example TypeScript catches invalid metric/dimension pair at compile time
 * ```typescript
 * // @ts-expect-error — 'channel' is not a valid dimension for 'occupancy_rate'
 * new QueryBuilder().metric('occupancy_rate').dimension('channel');
 * ```
 */
export class QueryBuilder<M extends HorizonMetric = never> {
  private _metric: HorizonMetric | undefined;
  private readonly _dimensions: string[] = [];
  private readonly _filters: QueryFilter[] = [];
  private _sortBy: { field: string; direction: SortDirection } | undefined;
  private _limit: number | undefined;
  private _offset: number | undefined;
  private _cursor: string | undefined;

  /**
   * Set the metric to measure. Returns a new `QueryBuilder<N>` typed to the
   * chosen metric, enabling dimension validation on subsequent `.dimension()` calls.
   *
   * Calling `.metric()` more than once replaces the current metric.
   */
  metric<N extends HorizonMetric>(m: N): QueryBuilder<N> {
    const next = new QueryBuilder<N>();
    next._metric = m;
    next._dimensions.push(...this._dimensions);
    next._filters.push(...this._filters);
    next._sortBy = this._sortBy;
    next._limit = this._limit;
    next._offset = this._offset;
    return next;
  }

  /**
   * Add a dimension to group results by.
   *
   * TypeScript will reject dimensions that are not valid for the selected metric.
   * Call `.metric()` before `.dimension()` — with no metric selected (`M = never`),
   * no dimension is accepted.
   *
   * At runtime, a `QueryBuilder` with a metric set also validates the dimension
   * against `VALID_DIMENSIONS_FOR` and throws if the combination is invalid.
   * This mirrors the compile-time constraint so both paths produce clear errors.
   *
   * @param d - A dimension valid for metric `M`
   */
  dimension(d: ValidDimensionFor<M>): this {
    if (this._metric) {
      const valid = VALID_DIMENSIONS_FOR[this._metric];
      if (!valid.includes(d as string as never)) {
        throw new Error(
          `QueryBuilder: '${d as string}' is not a valid dimension for metric '${this._metric}'. ` +
          `Valid dimensions: ${valid.join(', ')}`,
        );
      }
    }
    this._dimensions.push(d as string);
    return this;
  }

  /**
   * Add a filter clause to the query.
   *
   * @param field - Dimension or metric name
   * @param operator - Comparison operator
   * @param value - Filter value
   */
  filter(
    field: string,
    operator: QueryFilter['operator'],
    value: QueryFilter['value'],
  ): this {
    this._filters.push({ field, operator, value });
    return this;
  }

  /**
   * Apply all filter clauses from a `FilterBuilder`.
   *
   * @example
   * ```typescript
   * const fb = new FilterBuilder().from('date', '2026-01-01').to('date', '2026-03-31');
   * const query = new QueryBuilder().metric('revenue').dimension('site').filters(fb).build();
   * ```
   */
  filters(fb: FilterBuilder): this {
    this._filters.push(...fb.build());
    return this;
  }

  /**
   * Sort results by a field.
   *
   * @param field - Dimension or metric name to sort by
   * @param direction - `'asc'` or `'desc'` (default `'desc'`)
   */
  sort(field: string, direction: SortDirection = 'desc'): this {
    this._sortBy = { field, direction };
    return this;
  }

  /**
   * Maximum number of rows to return per page.
   * Horizon's default is 100; maximum is 10 000.
   */
  limit(n: number): this {
    this._limit = n;
    return this;
  }

  /**
   * Number of rows to skip (offset-based pagination).
   * Mutually exclusive with `.cursor()`.
   */
  offset(n: number): this {
    this._offset = n;
    return this;
  }

  /**
   * Resume from an opaque pagination cursor returned by a previous query.
   * Mutually exclusive with `.offset()`.
   */
  cursor(c: string): this {
    this._cursor = c;
    return this;
  }

  /**
   * Build the final `HorizonQuery` object ready for `HorizonClient.query()`.
   *
   * @throws {Error} if no metric has been selected
   * @throws {Error} if no dimensions have been added
   */
  build(): HorizonQuery {
    if (!this._metric) {
      throw new Error('QueryBuilder: call .metric() before .build()');
    }
    if (this._dimensions.length === 0) {
      throw new Error('QueryBuilder: call .dimension() at least once before .build()');
    }

    const query: HorizonQuery = {
      metrics: [this._metric],
      dimensions: [...this._dimensions] as HorizonQuery['dimensions'],
      filters: [...this._filters],
    };

    if (this._sortBy) query.sortBy = this._sortBy;
    if (this._limit !== undefined) query.limit = this._limit;
    if (this._cursor !== undefined) {
      query.cursor = this._cursor;
    } else if (this._offset !== undefined) {
      query.offset = this._offset;
    }

    return query;
  }
}
