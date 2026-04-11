import type { TheatricalHTTPClient } from '../http/client';
import type { Order, AddTicketsInput, AddItemsInput } from '../types/order';

export interface CreateOrderInput {
  sessionId: string;
  tickets: Array<{ type: string; seatId: string }>;
  items?: Array<{ menuItemId: string; quantity: number }>;
  loyaltyMemberId?: string;
}

/**
 * Orders resource — the full booking lifecycle.
 *
 * Covers the entire booking flow for Vista OCAPI:
 * create → add tickets → optionally add F&B → apply loyalty → confirm → complete.
 * Orders can also be cancelled or refunded depending on their current state.
 */
export class OrdersResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  /**
   * Create a new draft order for a session.
   *
   * @param input - Session ID, initial tickets, optional F&B items, optional loyalty member
   * @returns The newly created order in 'draft' status
   */
  async create(input: CreateOrderInput): Promise<Order> {
    return this.http.post<Order>('/ocapi/v1/orders', { body: input });
  }

  /**
   * Retrieve an order by its unique identifier.
   *
   * @param orderId - The UUID of the order to retrieve
   */
  async get(orderId: string): Promise<Order> {
    return this.http.get<Order>(`/ocapi/v1/orders/${orderId}`);
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
    return this.http.post<Order>(`/ocapi/v1/orders/${orderId}/tickets`, { body: input });
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
    return this.http.post<Order>(`/ocapi/v1/orders/${orderId}/items`, { body: input });
  }

  /**
   * Confirm an order, transitioning it from 'pending' to 'confirmed'.
   * This locks in the seat selection and pricing.
   *
   * @param orderId - The UUID of the order to confirm
   */
  async confirm(orderId: string): Promise<Order> {
    return this.http.post<Order>(`/ocapi/v1/orders/${orderId}/confirm`);
  }

  /**
   * Cancel an order. Can be applied to 'pending' or 'confirmed' orders.
   * Releases any held seats back to the pool.
   *
   * @param orderId - The UUID of the order to cancel
   */
  async cancel(orderId: string): Promise<Order> {
    return this.http.post<Order>(`/ocapi/v1/orders/${orderId}/cancel`);
  }
}
