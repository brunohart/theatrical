import type { TheatricalHTTPClient } from '../http/client';
import type { Order, AddTicketsInput, AddItemsInput, ApplyLoyaltyInput, OrderHistoryFilter } from '../types/order';
import { orderSchema } from '../types/order';
import type { PaginatedResponse } from '../types/pagination';
import { paginatedResponseSchema } from '../types/pagination';
import { z } from 'zod';

/**
 * Input for creating a new draft order.
 *
 * A draft order locks the requested seats for a short window (typically 10 minutes)
 * while the customer completes checkout. If the order is not confirmed within that
 * window, Vista automatically cancels it and releases the seats.
 *
 * @example
 * ```typescript
 * const order = await client.orders.create({
 *   sessionId: 'sess_abc123',
 *   tickets: [
 *     { type: 'adult', seatId: 'seat_d5' },
 *     { type: 'child', seatId: 'seat_d6' },
 *   ],
 *   loyaltyMemberId: 'mem_xyz',
 * });
 * ```
 */
export interface CreateOrderInput {
  /** ID of the session (showtime) to book */
  sessionId: string;
  /** Tickets to reserve — each entry specifies a ticket type and the seat to assign */
  tickets: Array<{
    /** Ticket category — e.g. `'adult'`, `'child'`, `'senior'`, `'concession'` */
    type: string;
    /** Seat ID from the availability response (e.g. `'seat_d5'`) */
    seatId: string;
  }>;
  /** Optional concession or merchandise items to include at order creation time */
  items?: Array<{ menuItemId: string; quantity: number }>;
  /** Loyalty member ID — attach to earn points on this booking */
  loyaltyMemberId?: string;
}

/**
 * Orders resource — the full booking lifecycle.
 *
 * Covers the entire booking flow for Vista OCAPI:
 * create → add tickets → optionally add F&B → apply loyalty → confirm → complete.
 * Orders can also be cancelled or refunded depending on their current state.
 *
 * All responses are validated at runtime using Zod schemas to ensure
 * the API response matches the expected shape before reaching application code.
 */
export class OrdersResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  /**
   * Parse and validate a raw order response from the API.
   * Throws a ZodError if the response doesn't match the expected shape.
   */
  private parseOrder(data: unknown): Order {
    return orderSchema.parse(data) as Order;
  }

  /**
   * Parse and validate a paginated order response from the API.
   */
  private parsePaginatedOrders(data: unknown): PaginatedResponse<Order> {
    const envelopeSchema = paginatedResponseSchema.extend({
      data: z.array(orderSchema),
    });
    const parsed = envelopeSchema.parse(data);
    return parsed as PaginatedResponse<Order>;
  }

  /**
   * Create a new draft order for a session.
   *
   * @param input - Session ID, initial tickets, optional F&B items, optional loyalty member
   * @returns The newly created order in 'draft' status
   */
  async create(input: CreateOrderInput): Promise<Order> {
    const data = await this.http.post<unknown>('/ocapi/v1/orders', { body: input });
    return this.parseOrder(data);
  }

  /**
   * Retrieve an order by its unique identifier.
   *
   * @param orderId - The UUID of the order to retrieve
   */
  async get(orderId: string): Promise<Order> {
    const data = await this.http.get<unknown>(`/ocapi/v1/orders/${orderId}`);
    return this.parseOrder(data);
  }

  /**
   * Add tickets to a draft order. Each ticket specifies a seat and ticket type.
   * This is additive — it appends to existing tickets, not replaces.
   *
   * @param orderId - The UUID of the draft order
   * @param input - Tickets to add (type + seatId pairs)
   * @returns The updated order with new tickets included
   */
  async addTickets(orderId: string, input: AddTicketsInput): Promise<Order> {
    const data = await this.http.post<unknown>(`/ocapi/v1/orders/${orderId}/tickets`, { body: input });
    return this.parseOrder(data);
  }

  /**
   * Add concession or merchandise items to an order.
   * F&B items can be added to orders in 'draft' or 'pending' status.
   *
   * @param orderId - The UUID of the order
   * @param input - Items to add (menuItemId + quantity pairs)
   * @returns The updated order with new items included
   */
  async addItems(orderId: string, input: AddItemsInput): Promise<Order> {
    const data = await this.http.post<unknown>(`/ocapi/v1/orders/${orderId}/items`, { body: input });
    return this.parseOrder(data);
  }

  /**
   * Confirm an order, transitioning it from 'pending' to 'confirmed'.
   * This locks in the seat selection and pricing.
   *
   * @param orderId - The UUID of the order to confirm
   */
  async confirm(orderId: string): Promise<Order> {
    const data = await this.http.post<unknown>(`/ocapi/v1/orders/${orderId}/confirm`);
    return this.parseOrder(data);
  }

  /**
   * Cancel an order. Can be applied to 'pending' or 'confirmed' orders.
   * Releases any held seats back to the pool.
   *
   * @param orderId - The UUID of the order to cancel
   */
  async cancel(orderId: string): Promise<Order> {
    const data = await this.http.post<unknown>(`/ocapi/v1/orders/${orderId}/cancel`);
    return this.parseOrder(data);
  }

  /**
   * Apply a loyalty membership discount to an order.
   * Links the member to the order and optionally redeems loyalty points
   * for a discount on the total.
   *
   * @param orderId - The UUID of the order
   * @param input - Loyalty member ID and optional points to redeem
   * @returns The updated order with loyalty discount applied
   */
  async applyLoyalty(orderId: string, input: ApplyLoyaltyInput): Promise<Order> {
    const data = await this.http.post<unknown>(`/ocapi/v1/orders/${orderId}/loyalty`, { body: input });
    return this.parseOrder(data);
  }

  /**
   * Request a refund for a confirmed or completed order.
   * Triggers the refund workflow in Vista's payment system.
   *
   * @param orderId - The UUID of the order to refund
   */
  async refund(orderId: string): Promise<Order> {
    const data = await this.http.post<unknown>(`/ocapi/v1/orders/${orderId}/refund`);
    return this.parseOrder(data);
  }

  /**
   * Mark a confirmed order as completed (e.g., after the screening).
   *
   * @param orderId - The UUID of the confirmed order
   */
  async complete(orderId: string): Promise<Order> {
    const data = await this.http.post<unknown>(`/ocapi/v1/orders/${orderId}/complete`);
    return this.parseOrder(data);
  }

  /**
   * Retrieve order history for a loyalty member.
   * Returns a paginated list of orders, newest first.
   *
   * @param memberId - The loyalty member's unique identifier
   * @param filter - Optional filters for status, date range, and pagination
   */
  async history(memberId: string, filter?: OrderHistoryFilter): Promise<PaginatedResponse<Order>> {
    const params: Record<string, string> = {};
    if (filter?.status) params.status = filter.status;
    if (filter?.since) params.since = filter.since;
    if (filter?.until) params.until = filter.until;
    if (filter?.limit) params.limit = String(filter.limit);
    if (filter?.cursor) params.cursor = filter.cursor;

    const data = await this.http.get<unknown>(`/ocapi/v1/members/${memberId}/orders`, { params });
    return this.parsePaginatedOrders(data);
  }
}
