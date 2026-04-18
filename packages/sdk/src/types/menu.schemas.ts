import { z } from 'zod';

// ---------------------------------------------------------------------------
// Menu Zod schemas
// ---------------------------------------------------------------------------

export const dietaryFlagSchema = z.enum([
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'halal',
  'kosher',
]);

export const menuSectionTypeSchema = z.enum([
  'hot-food',
  'cold-food',
  'drinks',
  'combos',
  'snacks',
  'ice-cream',
  'alcohol',
]);

export const menuCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  sectionType: menuSectionTypeSchema,
  displayOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
});

export const itemCustomisationOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceDelta: z.number().int(),
});

export const itemCustomisationSchema = z.object({
  id: z.string(),
  name: z.string(),
  required: z.boolean(),
  options: z.array(itemCustomisationOptionSchema).min(1),
});

export const menuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  categoryId: z.string(),
  categoryName: z.string().optional(),
  imageUrl: z.string().url().optional(),
  dietary: z.array(dietaryFlagSchema),
  isAvailable: z.boolean(),
  isPreOrderEligible: z.boolean(),
  comboDealId: z.string().optional(),
  calories: z.number().int().nonnegative().optional(),
  customisations: z.array(itemCustomisationSchema).optional(),
});

export const comboOfferSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  itemIds: z.array(z.string()).min(2),
  savings: z.number().nonnegative(),
  isAvailable: z.boolean(),
  isPreOrderEligible: z.boolean(),
  imageUrl: z.string().url().optional(),
});

export const fnbOrderLineItemSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().positive(),
  customisations: z.record(z.string()).optional(),
  unitPrice: z.number().nonnegative(),
});

export const addToOrderInputSchema = z.object({
  orderId: z.string(),
  items: z.array(fnbOrderLineItemSchema).min(1),
  sessionId: z.string().optional(),
});

export const fnbOrderConfirmationSchema = z.object({
  orderId: z.string(),
  addedItems: z.array(fnbOrderLineItemSchema),
  fnbSubtotal: z.number().nonnegative(),
  currency: z.string().length(3),
});

export const menuFilterSchema = z.object({
  siteId: z.string(),
  categoryId: z.string().optional(),
  dietary: z.array(dietaryFlagSchema).optional(),
  availableOnly: z.boolean().optional(),
  preOrderOnly: z.boolean().optional(),
});
