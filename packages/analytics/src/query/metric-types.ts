import type { HorizonMetric, HorizonDimension } from '../types';

/**
 * Maps each Horizon metric to the set of dimensions it can be grouped by.
 *
 * Vista's Horizon enforces these constraints server-side. Encoding them as a
 * TypeScript conditional type catches invalid combinations at compile time —
 * a mismatched `.dimension()` call produces a type error, not a runtime 400.
 *
 * The companion `VALID_DIMENSIONS_FOR` object mirrors the same rules at runtime
 * so `QueryBuilder.dimension()` can validate eagerly and throw a clear error
 * before a request is even sent.
 *
 * Mapping rules derived from Horizon's schema reference (2026-Q1):
 * - `admissions` / `revenue` / `average_ticket_price`: any dimension
 * - `occupancy_rate`: screen-oriented — site, screen, date, week, month, session_format
 * - `cancellations` / `refunds`: film, site, date, week, month, channel
 * - `loyalty_points_issued` / `loyalty_points_redeemed`: loyalty_tier, film, site, date, week, month
 * - `fnb_revenue` / `fnb_attach_rate`: site, date, week, month, film, ticket_type
 */
export type ValidDimensionFor<M extends HorizonMetric> =
  M extends 'admissions' | 'revenue' | 'average_ticket_price'
    ? HorizonDimension
    : M extends 'occupancy_rate'
    ? 'site' | 'screen' | 'date' | 'week' | 'month' | 'session_format'
    : M extends 'cancellations' | 'refunds'
    ? 'film' | 'site' | 'date' | 'week' | 'month' | 'channel'
    : M extends 'loyalty_points_issued' | 'loyalty_points_redeemed'
    ? 'loyalty_tier' | 'film' | 'site' | 'date' | 'week' | 'month'
    : M extends 'fnb_revenue' | 'fnb_attach_rate'
    ? 'site' | 'date' | 'week' | 'month' | 'film' | 'ticket_type'
    : HorizonDimension;

const ALL_DIMENSIONS: readonly HorizonDimension[] = [
  'film', 'site', 'screen', 'date', 'week', 'month',
  'session_format', 'ticket_type', 'loyalty_tier', 'channel',
];

/**
 * Runtime mirror of `ValidDimensionFor<M>`.
 *
 * Used by `QueryBuilder.dimension()` for eager validation before a query is
 * dispatched. Keeps compile-time type constraints and runtime checks in sync
 * from a single source of truth in this file.
 */
export const VALID_DIMENSIONS_FOR: Readonly<Record<HorizonMetric, readonly HorizonDimension[]>> = {
  admissions:               ALL_DIMENSIONS,
  revenue:                  ALL_DIMENSIONS,
  average_ticket_price:     ALL_DIMENSIONS,
  occupancy_rate:           ['site', 'screen', 'date', 'week', 'month', 'session_format'],
  cancellations:            ['film', 'site', 'date', 'week', 'month', 'channel'],
  refunds:                  ['film', 'site', 'date', 'week', 'month', 'channel'],
  loyalty_points_issued:    ['loyalty_tier', 'film', 'site', 'date', 'week', 'month'],
  loyalty_points_redeemed:  ['loyalty_tier', 'film', 'site', 'date', 'week', 'month'],
  fnb_revenue:              ['site', 'date', 'week', 'month', 'film', 'ticket_type'],
  fnb_attach_rate:          ['site', 'date', 'week', 'month', 'film', 'ticket_type'],
} as const;

export type { HorizonMetric, HorizonDimension };
