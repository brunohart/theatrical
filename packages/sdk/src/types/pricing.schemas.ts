import { z } from 'zod';

// ---------------------------------------------------------------------------
// Pricing schemas
// ---------------------------------------------------------------------------

export const sessionFormatSchema = z.enum(['standard', 'imax', '4dx', 'screenx', 'dolby', 'vmax', 'gold-class']);

export const dayPartSchema = z.enum(['matinee', 'afternoon', 'peak', 'late']);

export const ticketCategorySchema = z.enum([
  'adult',
  'child',
  'senior',
  'student',
  'family',
  'concession',
  'loyalty-member',
]);

export const ticketTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  category: ticketCategorySchema,
  isDefault: z.boolean(),
  requiresLoyalty: z.boolean(),
  minimumAge: z.number().int().nonnegative().optional(),
  maximumAge: z.number().int().nonnegative().optional(),
  isAvailable: z.boolean(),
});

export const ticketTypeFilterSchema = z.object({
  sessionId: z.string(),
  category: ticketCategorySchema.optional(),
  availableOnly: z.boolean().optional(),
});

export const taxConfigSchema = z.object({
  currency: z.string().length(3),
  rate: z.number().min(0).max(1),
  label: z.string(),
  inclusive: z.boolean(),
});

export const discountSourceSchema = z.enum([
  'loyalty-tier',
  'coupon',
  'promo',
  'member',
  'employee',
  'group',
]);

export const discountSchema = z.object({
  id: z.string(),
  source: discountSourceSchema,
  label: z.string(),
  amount: z.number().nonnegative(),
  percentage: z.number().min(0).max(100).optional(),
  couponCode: z.string().optional(),
});

export const surchargeReasonSchema = z.enum([
  'format',
  'seat-type',
  'booking-fee',
  'service-fee',
  'peak-surcharge',
]);

export const surchargeSchema = z.object({
  id: z.string(),
  reason: surchargeReasonSchema,
  label: z.string(),
  amount: z.number().nonnegative(),
});

export const priceBreakdownSchema = z.object({
  basePrice: z.number().nonnegative(),
  discounts: z.array(discountSchema),
  surcharges: z.array(surchargeSchema),
  taxAmount: z.number().nonnegative(),
  totalDiscount: z.number().nonnegative(),
  totalSurcharge: z.number().nonnegative(),
  pricePerTicket: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  currency: z.string().length(3),
  taxConfig: taxConfigSchema,
});

export const priceCalculationSchema = z.object({
  sessionId: z.string(),
  ticketTypeId: z.string(),
  totalPrice: z.number().nonnegative(),
  currency: z.string().length(3),
  taxInclusive: z.boolean(),
  breakdown: priceBreakdownSchema,
  validUntil: z.string().datetime(),
});

export const applyCouponsInputSchema = z.object({
  sessionId: z.string(),
  ticketTypeId: z.string(),
  quantity: z.number().int().positive(),
  couponCodes: z.array(z.string()).min(1),
  membershipId: z.string().optional(),
});

export const couponApplicationResultSchema = z.object({
  applied: z.array(discountSchema),
  rejected: z.array(z.object({ code: z.string(), reason: z.string() })),
  updatedBreakdown: priceBreakdownSchema,
});
