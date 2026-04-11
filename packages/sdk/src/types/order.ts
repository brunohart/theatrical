/**
 * Represents the lifecycle state of a cinema booking order.
 *
 * State transitions follow a strict flow:
 * ```
 * draft → pending → confirmed → completed
 *                 ↘ cancelled
 *        confirmed → refunded
 * ```
 */
export type OrderStatus = 'draft' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';

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
  action: 'confirm' | 'complete' | 'cancel' | 'refund';
}

/**
 * All valid order state transitions.
 * The Vista OCAPI enforces these server-side; this map enables
 * the SDK to fail fast with a descriptive error before making the request.
 */
export const ORDER_TRANSITIONS: readonly OrderTransition[] = [
  { from: 'draft', to: 'pending', action: 'confirm' },
  { from: 'pending', to: 'confirmed', action: 'confirm' },
  { from: 'confirmed', to: 'completed', action: 'complete' },
  { from: 'pending', to: 'cancelled', action: 'cancel' },
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
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
}

/** Input for adding tickets to a draft order */
export interface AddTicketsInput {
  tickets: Array<{
    type: string;
    seatId: string;
  }>;
}

/** Input for adding concession items to an order */
export interface AddItemsInput {
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
}

/** Input for applying a loyalty discount to an order */
export interface ApplyLoyaltyInput {
  memberId: string;
  /** Number of loyalty points to redeem, if any */
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
