import { z } from 'zod';

/**
 * Zod schema for order status — validates the lifecycle state string from the API.
 *
 * The `held` state is set by Vista when a hold-and-release promotion locks a block
 * of seats for a limited window (e.g. group bookings, season-pass allocation).
 * Orders in `held` transition to `pending` when the hold expires or is manually released.
 */
export const orderStatusSchema = z.enum([
  'draft',
  'pending',
  'held',
  'confirmed',
  'completed',
  'cancelled',
  'refunded',
]);

/**
 * Zod schema for a ticket within a booking order.
 */
export const ticketSchema = z.object({
  id: z.string(),
  type: z.string(),
  seatId: z.string(),
  seatLabel: z.string(),
  price: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
});

/**
 * Zod schema for a concession or merchandise line item.
 */
export const orderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
});

/**
 * Zod schema for a complete booking order — validates the full API response shape.
 */
export const orderSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  status: orderStatusSchema,
  tickets: z.array(ticketSchema),
  items: z.array(orderItemSchema),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  total: z.number().nonnegative(),
  currency: z.string().length(3),
  loyaltyMemberId: z.string().optional(),
  loyaltyPointsEarned: z.number().int().nonnegative().optional(),
  loyaltyPointsRedeemed: z.number().int().nonnegative().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  heldAt: z.string().optional(),
  heldUntil: z.string().optional(),
  confirmedAt: z.string().optional(),
  completedAt: z.string().optional(),
  cancelledAt: z.string().optional(),
  refundedAt: z.string().optional(),
});

/**
 * Zod schema for order history filter parameters.
 */
export const orderHistoryFilterSchema = z.object({
  status: orderStatusSchema.optional(),
  since: z.string().optional(),
  until: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

/**
 * Represents the lifecycle state of a cinema booking order.
 *
 * State transitions follow a strict flow:
 * ```
 * draft → pending → confirmed → completed
 *       ↗ held ↗    ↘ cancelled
 *        confirmed → refunded
 * ```
 *
 * The `held` state is a Vista-specific pause: seats are reserved but payment not yet initiated.
 * A held order transitions to `pending` when the hold window elapses or the caller invokes release.
 */
export type OrderStatus = 'draft' | 'pending' | 'held' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';

/**
 * Defines a valid state transition in the order lifecycle.
 * Used for client-side validation before issuing API calls.
 */
export interface OrderTransition {
  /** The current state of the order */
  from: OrderStatus;
  /** The target state to transition to */
  to: OrderStatus;
  /** The API action that triggers this transition */
  action: 'hold' | 'release' | 'confirm' | 'complete' | 'cancel' | 'refund';
}

/**
 * All valid order state transitions.
 * The Vista OCAPI enforces these server-side; this map enables
 * the SDK to fail fast with a descriptive error before making the request.
 *
 * State machine:
 * | From      | To         | Action  |
 * |-----------|------------|---------|
 * | draft     | held       | hold    |
 * | held      | pending    | release |
 * | pending   | confirmed  | confirm |
 * | confirmed | completed  | complete|
 * | held      | cancelled  | cancel  |
 * | pending   | cancelled  | cancel  |
 * | confirmed | cancelled  | cancel  |
 * | confirmed | refunded   | refund  |
 * | completed | refunded   | refund  |
 */
export const ORDER_TRANSITIONS: readonly OrderTransition[] = [
  { from: 'draft', to: 'held', action: 'hold' },
  { from: 'held', to: 'pending', action: 'release' },
  { from: 'pending', to: 'confirmed', action: 'confirm' },
  { from: 'confirmed', to: 'completed', action: 'complete' },
  { from: 'pending', to: 'cancelled', action: 'cancel' },
  { from: 'held', to: 'cancelled', action: 'cancel' },
  { from: 'confirmed', to: 'cancelled', action: 'cancel' },
  { from: 'confirmed', to: 'refunded', action: 'refund' },
  { from: 'completed', to: 'refunded', action: 'refund' },
] as const;

/** A single ticket within a booking order */
export interface Ticket {
  id: string;
  type: string;
  seatId: string;
  seatLabel: string;
  price: number;
  discount?: number;
}

/** A concession or merchandise item added to an order */
export interface OrderItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/** A booking order — the transactional core of the cinema experience */
export interface Order {
  id: string;
  sessionId: string;
  status: OrderStatus;
  tickets: Ticket[];
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  loyaltyMemberId?: string;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  createdAt: string;
  updatedAt?: string;
  /** ISO timestamp when the order entered the `held` state */
  heldAt?: string;
  /** ISO timestamp when the hold expires — after this the order auto-transitions to `pending` */
  heldUntil?: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
}

/**
 * Input for replacing tickets on a draft order.
 *
 * Call `orders.addTickets()` after creating a draft order to assign specific seats.
 * The Vista OCAPI replaces all existing tickets on the order — include every desired
 * ticket in a single call to avoid partial state.
 */
export interface AddTicketsInput {
  tickets: Array<{
    /** Ticket category — e.g. `'adult'`, `'child'`, `'senior'` */
    type: string;
    /** Seat ID from the session availability response */
    seatId: string;
  }>;
}

/**
 * Input for adding concession or merchandise items to an order.
 *
 * Items can be added at any point before the order is confirmed.
 * Duplicate `menuItemId` entries are merged — quantities accumulate.
 */
export interface AddItemsInput {
  items: Array<{
    /** Menu item ID from the F&B menu response */
    menuItemId: string;
    /** Number of units to add (must be ≥ 1) */
    quantity: number;
  }>;
}

/**
 * Input for applying a loyalty account to an order.
 *
 * Attaches a loyalty member to earn points on the purchase. Optionally redeems
 * accumulated points to reduce the order total — Vista enforces per-transaction
 * redemption limits based on the member's tier.
 */
export interface ApplyLoyaltyInput {
  /** Loyalty member ID to attach to this order */
  memberId: string;
  /** Number of loyalty points to redeem — reduces order total at ~1pt = $0.01 NZD */
  pointsToRedeem?: number;
}

/** Filter parameters for querying order history */
export interface OrderHistoryFilter {
  /** Filter by order status */
  status?: OrderStatus;
  /** ISO date string — orders created after this date */
  since?: string;
  /** ISO date string — orders created before this date */
  until?: string;
  /** Maximum number of results to return */
  limit?: number;
  /** Pagination cursor from a previous response */
  cursor?: string;
}
