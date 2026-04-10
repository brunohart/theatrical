import { z } from 'zod';

/**
 * Pagination strategy supported by Vista's OCAPI endpoints.
 *
 * - `'cursor'` — opaque cursor string returned with each page; preferred for
 *   real-time data (sessions, orders) where rows may shift between requests.
 * - `'offset'` — numeric offset/limit; suitable for stable result sets
 *   (films, sites) where insertion order rarely changes mid-request.
 */
export type PaginationStrategy = 'cursor' | 'offset';

/**
 * Generic paginated response envelope.
 *
 * All list endpoints return data wrapped in this shape once pagination
 * is normalised. The `data` array contains the current page of results;
 * `hasMore` indicates whether additional pages exist.
 *
 * @typeParam T - The resource type contained in each page
 *
 * @example
 * ```typescript
 * const page: PaginatedResponse<Session> = await client.sessions.list({
 *   siteId: 'roxy-wellington',
 *   limit: 25,
 * });
 *
 * console.log(page.data.length);  // up to 25
 * console.log(page.hasMore);      // true if more pages exist
 * ```
 */
export interface PaginatedResponse<T> {
  /** The current page of results */
  data: T[];

  /** Total number of matching results across all pages */
  total: number;

  /** Whether additional pages are available */
  hasMore: boolean;

  /** Opaque cursor for the next page (cursor-based pagination) */
  nextCursor?: string;

  /** Numeric offset for the next page (offset-based pagination) */
  nextOffset?: number;

  /** The pagination strategy used for this response */
  strategy: PaginationStrategy;
}

/**
 * Options for controlling pagination behaviour on list endpoints.
 */
export interface PaginationParams {
  /** Maximum number of results per page (default: 50, max: 500) */
  limit?: number;

  /** Opaque cursor from a previous response — mutually exclusive with `offset` */
  cursor?: string;

  /** Numeric offset — mutually exclusive with `cursor` */
  offset?: number;
}

/**
 * Zod schema for pagination parameters.
 * Validates that limit is within bounds and that cursor/offset are not both set.
 */
export const paginationParamsSchema = z.object({
  limit: z.number().int().positive().max(500).optional(),
  cursor: z.string().optional(),
  offset: z.number().int().nonnegative().optional(),
}).refine(
  (data) => !(data.cursor && data.offset !== undefined),
  { message: 'Cannot specify both cursor and offset — choose one pagination strategy' },
);

/**
 * Zod schema for a paginated response envelope.
 * The `data` array is validated separately by each resource module using
 * its own item schema.
 */
export const paginatedResponseSchema = z.object({
  data: z.array(z.unknown()),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  nextCursor: z.string().optional(),
  nextOffset: z.number().int().nonnegative().optional(),
  strategy: z.enum(['cursor', 'offset']),
});
