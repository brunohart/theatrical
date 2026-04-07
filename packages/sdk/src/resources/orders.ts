import type { TheatricalHTTPClient } from '../http/client';
import type { Order } from '../types/order';

export interface CreateOrderInput {
  sessionId: string;
  tickets: Array<{ type: string; seatId: string }>;
  items?: Array<{ menuItemId: string; quantity: number }>;
  loyaltyMemberId?: string;
}

/**
 * Orders resource — the full booking lifecycle.
 */
export class OrdersResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  async create(input: CreateOrderInput): Promise<Order> {
    return this.http.post<Order>('/ocapi/v1/orders', { body: input });
  }

  async get(orderId: string): Promise<Order> {
    return this.http.get<Order>(`/ocapi/v1/orders/${orderId}`);
  }

  async confirm(orderId: string): Promise<Order> {
    return this.http.post<Order>(`/ocapi/v1/orders/${orderId}/confirm`);
  }

  async cancel(orderId: string): Promise<Order> {
    return this.http.post<Order>(`/ocapi/v1/orders/${orderId}/cancel`);
  }
}
