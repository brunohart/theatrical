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

// ---------------------------------------------------------------------------
// create() — new draft order
// ---------------------------------------------------------------------------

describe('OrdersResource.create()', () => {
  let resource: OrdersResource;
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockPost } = createMockHTTPClient());
  });

  it('posts to the correct OCAPI orders endpoint', async () => {
    mockPost.mockResolvedValueOnce(createMockOrder());

    await resource.create({
      sessionId: 'ses_evt_qst_wildrobot_20260412_1930',
      tickets: [{ type: 'Adult', seatId: 'J12' }],
    });

    expect(mockPost).toHaveBeenCalledOnce();
    expect(mockPost).toHaveBeenCalledWith('/ocapi/v1/orders', expect.any(Object));
  });

  it('sends sessionId and tickets in the request body', async () => {
    mockPost.mockResolvedValueOnce(createMockOrder());

    await resource.create({
      sessionId: 'ses_evt_qst_wildrobot_20260412_1930',
      tickets: [
        { type: 'Adult', seatId: 'J12' },
        { type: 'Adult', seatId: 'J13' },
      ],
    });

    expect(mockPost).toHaveBeenCalledWith('/ocapi/v1/orders', {
      body: {
        sessionId: 'ses_evt_qst_wildrobot_20260412_1930',
        tickets: [
          { type: 'Adult', seatId: 'J12' },
          { type: 'Adult', seatId: 'J13' },
        ],
      },
    });
  });

  it('returns a new order in draft status', async () => {
    const draft = createMockOrder({ status: 'draft' });
    mockPost.mockResolvedValueOnce(draft);

    const result = await resource.create({
      sessionId: draft.sessionId,
      tickets: [{ type: 'Adult', seatId: 'J12' }],
    });

    expect(result.status).toBe('draft');
    expect(result.id).toBe(draft.id);
    expect(result.sessionId).toBe(draft.sessionId);
  });

  it('includes optional loyaltyMemberId when provided', async () => {
    mockPost.mockResolvedValueOnce(
      createMockOrder({ loyaltyMemberId: 'mem_hemi_walker_012' }),
    );

    await resource.create({
      sessionId: 'ses_evt_qst_wildrobot_20260412_1930',
      tickets: [{ type: 'Adult', seatId: 'J12' }],
      loyaltyMemberId: 'mem_hemi_walker_012',
    });

    expect(mockPost).toHaveBeenCalledWith('/ocapi/v1/orders', {
      body: expect.objectContaining({ loyaltyMemberId: 'mem_hemi_walker_012' }),
    });
  });

  it('returns correct totals from the created order', async () => {
    const order = createMockOrder({ subtotal: 45.00, tax: 6.75, discount: 0, total: 51.75 });
    mockPost.mockResolvedValueOnce(order);

    const result = await resource.create({
      sessionId: order.sessionId,
      tickets: [{ type: 'Adult', seatId: 'J12' }],
    });

    expect(result.subtotal).toBe(45.00);
    expect(result.tax).toBe(6.75);
    expect(result.total).toBe(51.75);
    expect(result.currency).toBe('NZD');
  });
});

// ---------------------------------------------------------------------------
// get() — single order retrieval
// ---------------------------------------------------------------------------

describe('OrdersResource.get()', () => {
  let resource: OrdersResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('fetches from the correct order endpoint path', async () => {
    const order = createMockOrder();
    mockGet.mockResolvedValueOnce(order);

    await resource.get(order.id);

    expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/orders/ord_evt_qst_wildrobot_20260412');
  });

  it('returns an order with the correct status and ID', async () => {
    const confirmed = createMockConfirmedOrder();
    mockGet.mockResolvedValueOnce(confirmed);

    const result = await resource.get(confirmed.id);

    expect(result.status).toBe('confirmed');
    expect(result.confirmedAt).toBeDefined();
  });

  it('returns the tickets array with seat labels', async () => {
    const order = createMockOrder();
    mockGet.mockResolvedValueOnce(order);

    const result = await resource.get(order.id);

    expect(result.tickets).toHaveLength(2);
    expect(result.tickets[0].seatLabel).toBe('Row J, Seat 12');
    expect(result.tickets[1].seatId).toBe('J13');
  });

  it('returns the items array with price breakdown', async () => {
    const order = createMockOrder();
    mockGet.mockResolvedValueOnce(order);

    const result = await resource.get(order.id);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Large Popcorn Combo');
    expect(result.items[0].unitPrice).toBe(14.00);
    expect(result.items[0].totalPrice).toBe(14.00);
  });

  it('returns loyalty fields when present on the order', async () => {
    const order = createMockConfirmedOrder({ loyaltyPointsEarned: 68 });
    mockGet.mockResolvedValueOnce(order);

    const result = await resource.get(order.id);

    expect(result.loyaltyMemberId).toBe('mem_hemi_walker_012');
    expect(result.loyaltyPointsEarned).toBe(68);
  });
});
