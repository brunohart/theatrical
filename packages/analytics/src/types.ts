import { z } from 'zod';

/**
 * Authentication modes for Horizon connections.
 *
 * `'api-key'` — standard server-to-server access using a Vista-issued analytics API key.
 * `'oauth'` — OAuth 2.0 client credentials flow for tenant-scoped access.
 */
export type HorizonAuthMode = 'api-key' | 'oauth';

/**
 * Configuration for connecting to a Vista Horizon data warehouse instance.
 */
export interface HorizonConfig {
  /** Base URL of the Horizon endpoint (e.g. `'https://horizon.vista.co'`) */
  baseUrl: string;

  /** Authentication mode */
  authMode: HorizonAuthMode;

  /** API key — required when authMode is `'api-key'` */
  apiKey?: string;

  /** OAuth client ID — required when authMode is `'oauth'` */
  clientId?: string;

  /** OAuth client secret — required when authMode is `'oauth'` */
  clientSecret?: string;

  /** Tenant/organisation identifier scoping all queries */
  tenantId: string;

  /** Request timeout in milliseconds (default: 30 000) */
  timeoutMs?: number;
}

export const horizonConfigSchema = z.object({
  baseUrl: z.string().url(),
  authMode: z.enum(['api-key', 'oauth']),
  apiKey: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  tenantId: z.string().min(1),
  timeoutMs: z.number().int().positive().optional(),
}).refine(
  (cfg) => cfg.authMode !== 'api-key' || !!cfg.apiKey,
  { message: 'apiKey is required when authMode is "api-key"' },
).refine(
  (cfg) => cfg.authMode !== 'oauth' || (!!cfg.clientId && !!cfg.clientSecret),
  { message: 'clientId and clientSecret are required when authMode is "oauth"' },
);

/**
 * Supported analytics metric names on the Horizon platform.
 *
 * Metrics are the numeric values you want to measure. Each corresponds to a
 * pre-aggregated column in Horizon's fact tables.
 */
export type HorizonMetric =
  | 'admissions'
  | 'revenue'
  | 'average_ticket_price'
  | 'occupancy_rate'
  | 'cancellations'
  | 'refunds'
  | 'loyalty_points_issued'
  | 'loyalty_points_redeemed'
  | 'fnb_revenue'
  | 'fnb_attach_rate';

/**
 * Supported dimension names for slicing and dicing analytics data.
 *
 * Dimensions are the categorical attributes you group by. Horizon joins
 * dimension tables automatically when a dimension is referenced in a query.
 */
export type HorizonDimension =
  | 'film'
  | 'site'
  | 'screen'
  | 'date'
  | 'week'
  | 'month'
  | 'session_format'
  | 'ticket_type'
  | 'loyalty_tier'
  | 'channel';

/** Sort direction for query results */
export type SortDirection = 'asc' | 'desc';

/** Comparison operators for filter expressions */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';

/**
 * A single filter clause applied to a dimension or metric.
 */
export interface QueryFilter {
  /** The dimension or metric field to filter on */
  field: HorizonDimension | HorizonMetric | string;
  /** Comparison operator */
  operator: FilterOperator;
  /** Filter value — scalar for eq/neq/gt/gte/lt/lte, array for in/not_in */
  value: string | number | boolean | Array<string | number>;
}

/**
 * A complete Horizon analytics query, ready to be serialised and sent to the API.
 */
export interface HorizonQuery {
  metrics: HorizonMetric[];
  dimensions: HorizonDimension[];
  filters: QueryFilter[];
  sortBy?: { field: string; direction: SortDirection };
  limit?: number;
  offset?: number;
  /** Opaque pagination cursor from a previous result's `nextCursor`. Mutually exclusive with `offset`. */
  cursor?: string;
}

/**
 * A single row in a Horizon query result.
 * Keys are dimension names and metric names; values are strings or numbers.
 */
export type ResultRow = Record<string, string | number | null>;

/**
 * The response envelope returned by Horizon for a completed query.
 */
export interface HorizonQueryResult {
  /** Rows returned by this page of results */
  rows: ResultRow[];
  /** Total matching row count (across all pages) */
  total: number;
  /** Whether more pages are available */
  hasMore: boolean;
  /** Opaque pagination cursor */
  nextCursor?: string;
  /** Wall-clock time the query took on the server (ms) */
  queryTimeMs: number;
}
