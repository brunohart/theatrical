/**
 * @theatrical/sdk — Type-safe TypeScript SDK for cinema management platform APIs
 *
 * @example
 * ```typescript
 * import { TheatricalClient } from '@theatrical/sdk';
 *
 * const client = new TheatricalClient({
 *   apiKey: process.env.VISTA_API_KEY,
 *   environment: 'sandbox',
 * });
 *
 * const films = await client.films.nowShowing({ siteId: 'roxy-wellington' });
 * ```
 *
 * @packageDocumentation
 */

export { TheatricalClient } from './client';
export type { TheatricalConfig, TheatricalEnvironment } from './types/config';

// Resource types
export type { Session, SessionFilter, SessionListResponse, SeatAvailability } from './types/session';
export type { Site, Screen, SiteConfig } from './types/site';
export type { Film, FilmFilter } from './types/film';
export type { Order, OrderItem, Ticket, OrderStatus } from './types/order';
export type { LoyaltyMember, LoyaltyTier } from './types/loyalty';
export type { MemberSubscription, SubscriptionPlan, SubscriptionBenefit, SubscriptionUsage } from './types/subscription';
export type { PriceCalculation, TicketType } from './types/pricing';
export type { MenuItem, MenuCategory } from './types/menu';

// Error types
export {
  TheatricalError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ServerError,
} from './errors';
