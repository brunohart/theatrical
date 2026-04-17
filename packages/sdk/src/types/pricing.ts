// ---------------------------------------------------------------------------
// Core pricing types for the Theatrical SDK
// ---------------------------------------------------------------------------

/** Cinema price format — standard, IMAX, 4DX, ScreenX, Dolby Atmos, etc. */
export type SessionFormat = 'standard' | 'imax' | '4dx' | 'screenx' | 'dolby' | 'vmax' | 'gold-class';

/** Day-part classification affecting matinee/peak pricing. */
export type DayPart = 'matinee' | 'afternoon' | 'peak' | 'late';

/** Ticket type grouping — matches Vista OCAPI ticket type categories. */
export type TicketCategory = 'adult' | 'child' | 'senior' | 'student' | 'family' | 'concession' | 'loyalty-member';

// ---------------------------------------------------------------------------
// Ticket types
// ---------------------------------------------------------------------------

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  /** Base price in minor currency units (e.g., cents). */
  price: number;
  currency: string;
  category: TicketCategory;
  isDefault: boolean;
  requiresLoyalty: boolean;
  /** Minimum age for this ticket type (e.g. senior >= 65). */
  minimumAge?: number;
  /** Maximum age (e.g. child <= 14). */
  maximumAge?: number;
  /** Whether this ticket type is currently purchasable. */
  isAvailable: boolean;
}

export interface TicketTypeFilter {
  sessionId: string;
  /** Filter by category (e.g., only loyalty-eligible types). */
  category?: TicketCategory;
  /** Exclude unavailable ticket types. Defaults to true. */
  availableOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Tax configuration
// ---------------------------------------------------------------------------

/**
 * Regional tax configuration for price display.
 *
 * NZ cinema operators present tax-inclusive prices; Australian operators
 * sometimes break GST out separately in B2B contexts.
 */
export interface TaxConfig {
  /** ISO 4217 currency code. */
  currency: string;
  /** Tax rate as a decimal fraction (e.g. 0.15 for 15% NZ GST). */
  rate: number;
  /** Label shown on receipts (e.g. "GST", "VAT"). */
  label: string;
  /**
   * When true, all prices are tax-inclusive (consumer-facing display).
   * When false, tax is added on top (B2B / booking-system context).
   */
  inclusive: boolean;
}

// ---------------------------------------------------------------------------
// Discounts & surcharges
// ---------------------------------------------------------------------------

export type DiscountSource = 'loyalty-tier' | 'coupon' | 'promo' | 'member' | 'employee' | 'group';

export interface Discount {
  id: string;
  source: DiscountSource;
  /** Human-readable label (e.g. "Gold Member Discount"). */
  label: string;
  /** Discount amount in minor units. */
  amount: number;
  /** Percentage discount, 0–100. Informational only when `amount` is authoritative. */
  percentage?: number;
  /** Coupon code that triggered this discount, if applicable. */
  couponCode?: string;
}

export type SurchargeReason = 'format' | 'seat-type' | 'booking-fee' | 'service-fee' | 'peak-surcharge';

export interface Surcharge {
  id: string;
  reason: SurchargeReason;
  /** Human-readable label (e.g. "IMAX Surcharge"). */
  label: string;
  /** Surcharge amount in minor units. */
  amount: number;
}

// ---------------------------------------------------------------------------
// Price breakdown & calculation
// ---------------------------------------------------------------------------

/**
 * Itemised price breakdown for a single ticket or a quantity of tickets.
 *
 * All amounts are in minor units of `currency` (e.g. cents for NZD).
 */
export interface PriceBreakdown {
  /** Base price per ticket before adjustments. */
  basePrice: number;
  /** Ordered list of discounts applied. */
  discounts: Discount[];
  /** Ordered list of surcharges applied. */
  surcharges: Surcharge[];
  /** Tax amount. Zero when `taxConfig.inclusive` is true. */
  taxAmount: number;
  /** Sum of all discounts. */
  totalDiscount: number;
  /** Sum of all surcharges. */
  totalSurcharge: number;
  /** Per-ticket price after all adjustments. */
  pricePerTicket: number;
  /** `pricePerTicket * quantity`. */
  totalPrice: number;
  quantity: number;
  currency: string;
  taxConfig: TaxConfig;
}

/**
 * Full price calculation response from the Vista pricing engine.
 *
 * Returned by `PricingResource.calculate()`. The `breakdown` field gives
 * full itemisation; legacy integrations can use the flat fields.
 */
export interface PriceCalculation {
  sessionId: string;
  ticketTypeId: string;
  /** Total price, minor units. */
  totalPrice: number;
  currency: string;
  /** Whether returned price includes tax. */
  taxInclusive: boolean;
  /** Detailed, itemised breakdown. */
  breakdown: PriceBreakdown;
  /** ISO 8601 timestamp — price is valid until this time. */
  validUntil: string;
}

// ---------------------------------------------------------------------------
// Coupon application
// ---------------------------------------------------------------------------

export interface ApplyCouponsInput {
  sessionId: string;
  ticketTypeId: string;
  quantity: number;
  couponCodes: string[];
  /** Loyalty member ID for tier-based discount resolution. */
  membershipId?: string;
}

export interface CouponApplicationResult {
  applied: Discount[];
  rejected: Array<{ code: string; reason: string }>;
  updatedBreakdown: PriceBreakdown;
}
