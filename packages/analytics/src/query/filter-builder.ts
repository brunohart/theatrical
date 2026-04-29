import type { QueryFilter, FilterOperator, HorizonDimension, HorizonMetric } from '../types';

type FilterField = HorizonDimension | HorizonMetric | string;
type FilterValue = string | number | boolean | Array<string | number>;

/**
 * Fluent builder for Horizon query filter clauses.
 *
 * Attach to a `QueryBuilder` via `.filter()`, or construct standalone and
 * pass the built array to `HorizonClient.query()`.
 *
 * @example
 * ```typescript
 * const filters = new FilterBuilder()
 *   .where('date', 'gte', '2026-01-01')
 *   .where('site', 'in', ['site_roxy_wellington', 'site_embassy_wellington'])
 *   .build();
 * ```
 */
export class FilterBuilder {
  private readonly clauses: QueryFilter[] = [];

  /**
   * Add a filter clause.
   *
   * @param field - Dimension or metric name to filter on
   * @param operator - Comparison operator
   * @param value - Filter value (scalar for eq/neq/gt/gte/lt/lte, array for in/not_in)
   */
  where(field: FilterField, operator: FilterOperator, value: FilterValue): this {
    this.clauses.push({ field, operator, value });
    return this;
  }

  /** Shorthand for `where(field, 'eq', value)` */
  equals(field: FilterField, value: string | number | boolean): this {
    return this.where(field, 'eq', value);
  }

  /** Shorthand for `where(field, 'gte', value)` */
  from(field: FilterField, value: string | number): this {
    return this.where(field, 'gte', value);
  }

  /** Shorthand for `where(field, 'lte', value)` */
  to(field: FilterField, value: string | number): this {
    return this.where(field, 'lte', value);
  }

  /** Shorthand for `where(field, 'in', values)` */
  in(field: FilterField, values: Array<string | number>): this {
    return this.where(field, 'in', values);
  }

  /** Return the accumulated filter clauses. Does not mutate this builder. */
  build(): QueryFilter[] {
    return [...this.clauses];
  }

  /** Number of filter clauses accumulated so far. */
  get size(): number {
    return this.clauses.length;
  }
}
