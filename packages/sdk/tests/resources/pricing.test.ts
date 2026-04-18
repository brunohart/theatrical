import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PricingResource } from '../../src/resources/pricing';
import type { TheatricalHTTPClient } from '../../src/http/client';
import type {
  TicketType,
  PriceCalculation,
  PriceBreakdown,
  TaxConfig,
  Discount,
  Surcharge,
  CouponApplicationResult,
} from '../../src/types/pricing';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockHTTPClient(): {
  resource: PricingResource;
  mockGet: ReturnType<typeof vi.fn>;
  mockPost: ReturnType<typeof vi.fn>;
} {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const http = { get: mockGet, post: mockPost } as unknown as TheatricalHTTPClient;
  return { resource: new PricingResource(http), mockGet, mockPost };
}

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

/** NZ GST config — 15% tax-inclusive, standard for NZ cinema consumer pricing. */
function createNzTaxConfig(overrides: Partial<TaxConfig> = {}): TaxConfig {
  return {
    currency: 'NZD',
    rate: 0.15,
    label: 'GST',
    inclusive: true,
    ...overrides,
  };
}

/** Adult general admission at Event Cinemas Wellington. */
function createAdultTicketType(overrides: Partial<TicketType> = {}): TicketType {
  return {
    id: 'tt_adult_standard',
    name: 'Adult',
    description: 'General admission adult ticket',
    price: 2200,
    currency: 'NZD',
    category: 'adult',
    isDefault: true,
    requiresLoyalty: false,
    isAvailable: true,
    ...overrides,
  };
}

function createImaxSurcharge(overrides: Partial<Surcharge> = {}): Surcharge {
  return {
    id: 'sur_imax_format',
    reason: 'format',
    label: 'IMAX Surcharge',
    amount: 500,
    ...overrides,
  };
}

function createLoyaltyDiscount(overrides: Partial<Discount> = {}): Discount {
  return {
    id: 'disc_gold_tier',
    source: 'loyalty-tier',
    label: 'Gold Member Discount',
    amount: 330,
    percentage: 15,
    ...overrides,
  };
}

function createPriceBreakdown(overrides: Partial<PriceBreakdown> = {}): PriceBreakdown {
  return {
    basePrice: 2200,
    discounts: [],
    surcharges: [],
    taxAmount: 0,
    totalDiscount: 0,
    totalSurcharge: 0,
    pricePerTicket: 2200,
    totalPrice: 2200,
    quantity: 1,
    currency: 'NZD',
    taxConfig: createNzTaxConfig(),
    ...overrides,
  };
}

function createPriceCalculation(overrides: Partial<PriceCalculation> = {}): PriceCalculation {
  return {
    sessionId: 'session_event_wellington_001',
    ticketTypeId: 'tt_adult_standard',
    totalPrice: 2200,
    currency: 'NZD',
    taxInclusive: true,
    breakdown: createPriceBreakdown(),
    validUntil: '2026-04-18T23:59:59.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('PricingResource', () => {
  let resource: PricingResource;
  let mockGet: ReturnType<typeof vi.fn>;
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet, mockPost } = createMockHTTPClient());
  });

  // -------------------------------------------------------------------------
  // ticketTypes
  // -------------------------------------------------------------------------

  describe('ticketTypes', () => {
    it('fetches ticket types for a session', async () => {
      const types = [
        createAdultTicketType(),
        createAdultTicketType({
          id: 'tt_child_standard',
          name: 'Child',
          category: 'child',
          price: 1500,
          maximumAge: 14,
        }),
        createAdultTicketType({
          id: 'tt_loyalty_member',
          name: 'Loyalty Member',
          category: 'loyalty-member',
          price: 1870,
          requiresLoyalty: true,
        }),
      ];
      mockGet.mockResolvedValue(types);

      const result = await resource.ticketTypes('session_event_wellington_001');

      expect(mockGet).toHaveBeenCalledWith(
        '/ocapi/v1/sessions/session_event_wellington_001/ticket-types',
        { params: {} },
      );
      expect(result).toHaveLength(3);
      expect(result[2].requiresLoyalty).toBe(true);
    });

    it('passes category filter param', async () => {
      mockGet.mockResolvedValue([createAdultTicketType({ category: 'loyalty-member', requiresLoyalty: true })]);

      await resource.ticketTypes('session_hoyts_sylvia_001', { category: 'loyalty-member' });

      expect(mockGet).toHaveBeenCalledWith(
        '/ocapi/v1/sessions/session_hoyts_sylvia_001/ticket-types',
        { params: { category: 'loyalty-member' } },
      );
    });

    it('passes availableOnly filter param', async () => {
      mockGet.mockResolvedValue([createAdultTicketType()]);

      await resource.ticketTypes('session_hoyts_sylvia_001', { availableOnly: true });

      expect(mockGet).toHaveBeenCalledWith(
        '/ocapi/v1/sessions/session_hoyts_sylvia_001/ticket-types',
        { params: { availableOnly: true } },
      );
    });
  });

  // -------------------------------------------------------------------------
  // calculate
  // -------------------------------------------------------------------------

  describe('calculate', () => {
    it('calculates standard adult price — matinee, no adjustments', async () => {
      const calculation = createPriceCalculation({
        totalPrice: 1600,
        breakdown: createPriceBreakdown({
          basePrice: 1600,
          pricePerTicket: 1600,
          totalPrice: 1600,
        }),
      });
      mockGet.mockResolvedValue(calculation);

      const result = await resource.calculate('session_rialto_matinee_001', 'tt_adult_standard');

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/pricing/calculate', {
        params: { sessionId: 'session_rialto_matinee_001', ticketTypeId: 'tt_adult_standard', quantity: 1 },
      });
      expect(result.totalPrice).toBe(1600);
      expect(result.taxInclusive).toBe(true);
    });

    it('calculates IMAX peak price with format surcharge', async () => {
      const breakdown = createPriceBreakdown({
        basePrice: 2200,
        surcharges: [createImaxSurcharge()],
        totalSurcharge: 500,
        pricePerTicket: 2700,
        totalPrice: 5400,
        quantity: 2,
      });
      const calculation = createPriceCalculation({
        sessionId: 'session_hoyts_imax_friday_001',
        totalPrice: 5400,
        breakdown,
      });
      mockGet.mockResolvedValue(calculation);

      const result = await resource.calculate('session_hoyts_imax_friday_001', 'tt_adult_standard', 2);

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/pricing/calculate', {
        params: { sessionId: 'session_hoyts_imax_friday_001', ticketTypeId: 'tt_adult_standard', quantity: 2 },
      });
      expect(result.breakdown.surcharges[0].label).toBe('IMAX Surcharge');
      expect(result.breakdown.totalSurcharge).toBe(500);
      expect(result.breakdown.quantity).toBe(2);
    });

    it('reflects loyalty member discounted price', async () => {
      const breakdown = createPriceBreakdown({
        basePrice: 2200,
        discounts: [createLoyaltyDiscount()],
        totalDiscount: 330,
        pricePerTicket: 1870,
        totalPrice: 1870,
      });
      const calculation = createPriceCalculation({
        totalPrice: 1870,
        breakdown,
      });
      mockGet.mockResolvedValue(calculation);

      const result = await resource.calculate('session_hoyts_sylvia_001', 'tt_loyalty_member');

      expect(result.breakdown.discounts[0].source).toBe('loyalty-tier');
      expect(result.breakdown.totalDiscount).toBe(330);
      expect(result.breakdown.pricePerTicket).toBe(1870);
    });
  });

  // -------------------------------------------------------------------------
  // applyCoupons
  // -------------------------------------------------------------------------

  describe('applyCoupons', () => {
    it('applies a valid coupon code and returns updated breakdown', async () => {
      const couponDiscount: Discount = {
        id: 'disc_coupon_tuesday',
        source: 'coupon',
        label: 'Tuesday Saver',
        amount: 400,
        percentage: 18,
        couponCode: 'TUESDAY18',
      };
      const updatedBreakdown = createPriceBreakdown({
        basePrice: 2200,
        discounts: [couponDiscount],
        totalDiscount: 400,
        pricePerTicket: 1800,
        totalPrice: 1800,
      });
      const applicationResult: CouponApplicationResult = {
        applied: [couponDiscount],
        rejected: [],
        updatedBreakdown,
      };
      mockPost.mockResolvedValue(applicationResult);

      const result = await resource.applyCoupons({
        sessionId: 'session_event_lower_hutt_001',
        ticketTypeId: 'tt_adult_standard',
        quantity: 1,
        couponCodes: ['TUESDAY18'],
      });

      expect(mockPost).toHaveBeenCalledWith('/ocapi/v1/pricing/apply-coupons', {
        body: {
          sessionId: 'session_event_lower_hutt_001',
          ticketTypeId: 'tt_adult_standard',
          quantity: 1,
          couponCodes: ['TUESDAY18'],
        },
      });
      expect(result.applied).toHaveLength(1);
      expect(result.rejected).toHaveLength(0);
      expect(result.updatedBreakdown.totalDiscount).toBe(400);
    });

    it('stacks loyalty tier and coupon discounts', async () => {
      const loyaltyDisc = createLoyaltyDiscount();
      const couponDisc: Discount = {
        id: 'disc_coupon_preview',
        source: 'coupon',
        label: 'Preview Night Promo',
        amount: 220,
        couponCode: 'PREVIEW',
      };
      const updatedBreakdown = createPriceBreakdown({
        basePrice: 2200,
        discounts: [loyaltyDisc, couponDisc],
        totalDiscount: 550,
        pricePerTicket: 1650,
        totalPrice: 3300,
        quantity: 2,
      });
      const applicationResult: CouponApplicationResult = {
        applied: [loyaltyDisc, couponDisc],
        rejected: [],
        updatedBreakdown,
      };
      mockPost.mockResolvedValue(applicationResult);

      const result = await resource.applyCoupons({
        sessionId: 'session_hoyts_ponsonby_001',
        ticketTypeId: 'tt_loyalty_member',
        quantity: 2,
        couponCodes: ['PREVIEW'],
        membershipId: 'mem_hemi_walker_012',
      });

      expect(result.applied).toHaveLength(2);
      expect(result.applied.map((d) => d.source)).toEqual(['loyalty-tier', 'coupon']);
    });

    it('returns rejected entry for expired coupon code', async () => {
      const applicationResult: CouponApplicationResult = {
        applied: [],
        rejected: [{ code: 'EXPIRED99', reason: 'Coupon has expired' }],
        updatedBreakdown: createPriceBreakdown(),
      };
      mockPost.mockResolvedValue(applicationResult);

      const result = await resource.applyCoupons({
        sessionId: 'session_event_newmarket_001',
        ticketTypeId: 'tt_adult_standard',
        quantity: 1,
        couponCodes: ['EXPIRED99'],
      });

      expect(result.applied).toHaveLength(0);
      expect(result.rejected[0].code).toBe('EXPIRED99');
      expect(result.rejected[0].reason).toBe('Coupon has expired');
    });
  });
});
