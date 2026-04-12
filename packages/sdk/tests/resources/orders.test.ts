import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrdersResource } from '../../src/resources/orders';
import type { TheatricalHTTPClient } from '../../src/http/client';
import type { Order, Ticket, OrderItem, OrderStatus } from '../../src/types/order';
import type { PaginatedResponse } from '../../src/types/pagination';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/** Create a mock HTTP client with both get() and post() vi.fn() methods. */
function createMockHTTPClient(): {
  resource: OrdersResource;
  mockGet: ReturnType<typeof vi.fn>;
  mockPost: ReturnType<typeof vi.fn>;
} {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const http = { get: mockGet, post: mockPost } as unknown as TheatricalHTTPClient;
  return { resource: new OrdersResource(http), mockGet, mockPost };
}

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

/** A realistic cinema seat ticket — Event Cinemas Queen Street, The Wild Robot. */
function createMockTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'tkt_evt_qst_001',
    type: 'Adult',
    seatId: 'J12',
    seatLabel: 'Row J, Seat 12',
    price: 22.50,
    ...overrides,
  };
}

/** A concession line item — large popcorn combo. */
function createMockOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: 'item_popcorn_large_001',
    name: 'Large Popcorn Combo',
    category: 'Snacks',
    quantity: 1,
    unitPrice: 14.00,
    totalPrice: 14.00,
    ...overrides,
  };
}

/**
 * Realistic cinema booking order — Event Cinemas Queen Street, The Wild Robot.
 * Two adult tickets, one large popcorn combo.
 */
function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ord_evt_qst_wildrobot_20260412',
    sessionId: 'ses_evt_qst_wildrobot_20260412_1930',
    status: 'draft',
    tickets: [
      createMockTicket({ id: 'tkt_001', seatId: 'J12', seatLabel: 'Row J, Seat 12' }),
      createMockTicket({ id: 'tkt_002', seatId: 'J13', seatLabel: 'Row J, Seat 13' }),
    ],
    items: [createMockOrderItem()],
    subtotal: 59.00,
    tax: 8.85,
    discount: 0,
    total: 67.85,
    currency: 'NZD',
    createdAt: '2026-04-12T09:00:00+12:00',
    ...overrides,
  };
}

/** A confirmed order with loyalty and timestamps. */
function createMockConfirmedOrder(overrides: Partial<Order> = {}): Order {
  return createMockOrder({
    status: 'confirmed',
    loyaltyMemberId: 'mem_hemi_walker_012',
    loyaltyPointsEarned: 68,
    loyaltyPointsRedeemed: 0,
    confirmedAt: '2026-04-12T09:02:00+12:00',
    updatedAt: '2026-04-12T09:02:00+12:00',
    ...overrides,
  });
}

/** A paginated order history response for a loyalty member. */
function createMockOrderHistory(
  orders: Order[] = [createMockConfirmedOrder()],
  overrides: Partial<PaginatedResponse<Order>> = {},
): PaginatedResponse<Order> {
  return {
    data: orders,
    total: orders.length,
    hasMore: false,
    cursor: undefined,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Smoke test — resource instantiation
// ---------------------------------------------------------------------------

describe('OrdersResource', () => {
  it('instantiates with an HTTP client', () => {
    const { resource } = createMockHTTPClient();
    expect(resource).toBeInstanceOf(OrdersResource);
  });
});
