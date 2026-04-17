import { z } from 'zod';

/** Billing interval for a subscription plan. */
export type SubscriptionInterval = 'monthly' | 'annual';

/** Current lifecycle state of a member's subscription. */
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'pending';

/** Category of a subscription benefit. */
export type BenefitCategory = 'booking' | 'concession' | 'companion' | 'priority' | 'exclusive';

/**
 * A specific benefit included with a subscription plan.
 *
 * Benefits define the concrete perks of a plan beyond the base booking
 * allowance — e.g., companion passes, F&B discounts, priority booking windows.
 */
export interface SubscriptionBenefit {
  id: string;
  category: BenefitCategory;
  name: string;
  description: string;
  /** Maximum number of times this benefit may be used per billing period. */
  usesPerPeriod?: number;
  /** Whether this benefit is currently active on the plan. */
  active: boolean;
}

/**
 * A subscribable cinema pass plan (e.g. Hoyts LoyaltyCinema Pass, Event Select).
 *
 * Plans define pricing, booking allowances, and the list of benefits included
 * for subscribers. Equivalent to AMC A-List or Cineworld Unlimited in structure.
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: SubscriptionInterval;
  /** Number of bookings included per billing period. Undefined = unlimited. */
  bookingsIncluded?: number;
  benefits: SubscriptionBenefit[];
  /** Whether new subscriptions can currently be purchased. */
  available: boolean;
  /** Minimum commitment period in months (e.g. 3 for lock-in plans). */
  minimumTermMonths?: number;
}

/**
 * Usage statistics for a member's active subscription in the current period.
 */
export interface SubscriptionUsage {
  subscriptionId: string;
  memberId: string;
  /** ISO-8601 start of the current billing period. */
  periodStart: string;
  /** ISO-8601 end of the current billing period. */
  periodEnd: string;
  bookingsUsed: number;
  /** Null when the plan has unlimited bookings. */
  bookingsIncluded: number | null;
  /** Derived: bookingsIncluded - bookingsUsed. Null for unlimited plans. */
  bookingsRemaining: number | null;
  /** Per-benefit usage counts keyed by benefit ID. */
  benefitUsage: Record<string, number>;
}

/**
 * A member's active or historical subscription record.
 */
export interface MemberSubscription {
  id: string;
  planId: string;
  plan?: SubscriptionPlan;
  memberId: string;
  status: SubscriptionStatus;
  /** ISO-8601 date the subscription started. */
  startDate: string;
  /** ISO-8601 date of the next renewal. Null if cancelled or expired. */
  renewalDate: string | null;
  /** ISO-8601 date the subscription was cancelled, if applicable. */
  cancelledAt?: string;
  /** ISO-8601 date the subscription expires, if applicable. */
  expiresAt?: string;
  /** Whether auto-renewal is enabled. */
  autoRenew: boolean;
  /** Shorthand usage for current period (populated on detail views). */
  usage?: SubscriptionUsage;
}

/**
 * Input for suspending a member's subscription temporarily.
 */
export interface SuspendSubscriptionInput {
  /** ISO-8601 date to resume the subscription. Required for timed suspension. */
  resumeDate?: string;
  reason?: string;
}

/**
 * Input for cancelling a member's subscription.
 */
export interface CancelSubscriptionInput {
  /** When true, cancel immediately. When false, cancel at end of period. */
  immediate?: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

/** Validates subscription billing interval strings. */
export const subscriptionIntervalSchema = z.enum(['monthly', 'annual']);

/** Validates subscription status strings. */
export const subscriptionStatusSchema = z.enum([
  'active',
  'paused',
  'cancelled',
  'expired',
  'pending',
]);

/** Validates benefit category strings. */
export const benefitCategorySchema = z.enum([
  'booking',
  'concession',
  'companion',
  'priority',
  'exclusive',
]);

/** Validates a single subscription benefit. */
export const subscriptionBenefitSchema = z.object({
  id: z.string(),
  category: benefitCategorySchema,
  name: z.string(),
  description: z.string(),
  usesPerPeriod: z.number().int().positive().optional(),
  active: z.boolean(),
});

/** Validates a subscription plan record. */
export const subscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  interval: subscriptionIntervalSchema,
  bookingsIncluded: z.number().int().positive().optional(),
  benefits: z.array(subscriptionBenefitSchema),
  available: z.boolean(),
  minimumTermMonths: z.number().int().positive().optional(),
});

/** Validates subscription usage for the current billing period. */
export const subscriptionUsageSchema = z.object({
  subscriptionId: z.string(),
  memberId: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  bookingsUsed: z.number().int().nonnegative(),
  bookingsIncluded: z.number().int().positive().nullable(),
  bookingsRemaining: z.number().int().nullable(),
  benefitUsage: z.record(z.number().int().nonnegative()),
});

/** Validates a member subscription record. */
export const memberSubscriptionSchema = z.object({
  id: z.string(),
  planId: z.string(),
  plan: subscriptionPlanSchema.optional(),
  memberId: z.string(),
  status: subscriptionStatusSchema,
  startDate: z.string(),
  renewalDate: z.string().nullable(),
  cancelledAt: z.string().optional(),
  expiresAt: z.string().optional(),
  autoRenew: z.boolean(),
  usage: subscriptionUsageSchema.optional(),
});

/** Validates suspension input. */
export const suspendSubscriptionInputSchema = z.object({
  resumeDate: z.string().optional(),
  reason: z.string().optional(),
});

/** Validates cancellation input. */
export const cancelSubscriptionInputSchema = z.object({
  immediate: z.boolean().optional(),
  reason: z.string().optional(),
});
