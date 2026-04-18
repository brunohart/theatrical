import type { TheatricalHTTPClient } from '../http/client';
import type {
  PriceCalculation,
  TicketType,
  TicketTypeFilter,
  ApplyCouponsInput,
  CouponApplicationResult,
} from '../types/pricing';

/**
 * Pricing resource — ticket types, price calculations, tax handling, and coupon application.
 *
 * Handles the complexity of Vista's pricing model: matinee vs peak pricing,
 * format surcharges (IMAX, 4DX), loyalty tier discounts, and coupon stacking.
 */
export class PricingResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  /**
   * List available ticket types for a session.
   *
   * @param sessionId - The Vista session ID.
   * @param filter - Optional filter params (category, availableOnly).
   */
  async ticketTypes(sessionId: string, filter?: Omit<TicketTypeFilter, 'sessionId'>): Promise<TicketType[]> {
    return this.http.get<TicketType[]>(`/ocapi/v1/sessions/${sessionId}/ticket-types`, {
      params: { ...filter },
    });
  }

  /**
   * Calculate the price for a ticket type and quantity.
   *
   * Returns an itemised {@link PriceBreakdown} including base price, discounts,
   * surcharges, and tax. The breakdown reflects the caller's Vista site tax
   * configuration (inclusive vs exclusive).
   *
   * @param sessionId - The Vista session ID.
   * @param ticketTypeId - Ticket type to price.
   * @param quantity - Number of tickets (default 1).
   */
  async calculate(sessionId: string, ticketTypeId: string, quantity = 1): Promise<PriceCalculation> {
    return this.http.get<PriceCalculation>(`/ocapi/v1/pricing/calculate`, {
      params: { sessionId, ticketTypeId, quantity },
    });
  }

  /**
   * Apply coupon codes and resolve loyalty-tier discounts.
   *
   * Validates each coupon code, stacks applicable discounts, and returns
   * an updated {@link PriceBreakdown}. Invalid or expired codes are listed
   * in the `rejected` array rather than throwing.
   *
   * @param input - Session, ticket type, quantity, coupon codes, and optional member ID.
   */
  async applyCoupons(input: ApplyCouponsInput): Promise<CouponApplicationResult> {
    return this.http.post<CouponApplicationResult>(`/ocapi/v1/pricing/apply-coupons`, { body: input });
  }
}
