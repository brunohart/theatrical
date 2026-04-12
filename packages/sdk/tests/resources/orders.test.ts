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
    strategy: 'cursor',
    nextCursor: undefined,
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

// ---------------------------------------------------------------------------
// addTickets() — append tickets to a draft order
// ---------------------------------------------------------------------------

describe('OrdersResource.addTickets()', () => {
  let resource: OrdersResource;
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockPost } = createMockHTTPClient());
  });

  it('posts to the correct tickets sub-resource path', async () => {
    const orderId = 'ord_evt_qst_wildrobot_20260412';
    mockPost.mockResolvedValueOnce(createMockOrder());

    await resource.addTickets(orderId, {
      tickets: [{ type: 'Adult', seatId: 'K5' }],
    });

    expect(mockPost).toHaveBeenCalledWith(
      `/ocapi/v1/orders/${orderId}/tickets`,
      expect.any(Object),
    );
  });

  it('sends the tickets array in the request body', async () => {
    const orderId = 'ord_evt_qst_wildrobot_20260412';
    mockPost.mockResolvedValueOnce(createMockOrder());

    await resource.addTickets(orderId, {
      tickets: [
        { type: 'Child', seatId: 'K6' },
        { type: 'Senior', seatId: 'K7' },
      ],
    });

    expect(mockPost).toHaveBeenCalledWith(`/ocapi/v1/orders/${orderId}/tickets`, {
      body: {
        tickets: [
          { type: 'Child', seatId: 'K6' },
          { type: 'Senior', seatId: 'K7' },
        ],
      },
    });
  });

  it('returns the updated order with all tickets included', async () => {
    const updatedOrder = createMockOrder({
      tickets: [
        createMockTicket({ id: 'tkt_001', seatId: 'J12' }),
        createMockTicket({ id: 'tkt_002', seatId: 'J13' }),
        createMockTicket({ id: 'tkt_003', seatId: 'K5', type: 'Child', price: 14.50 }),
      ],
    });
    mockPost.mockResolvedValueOnce(updatedOrder);

    const result = await resource.addTickets('ord_evt_qst_wildrobot_20260412', {
      tickets: [{ type: 'Child', seatId: 'K5' }],
    });

    expect(result.tickets).toHaveLength(3);
    expect(result.tickets[2].type).toBe('Child');
    expect(result.tickets[2].seatId).toBe('K5');
  });

  it('reflects updated total after adding a ticket', async () => {
    const updatedOrder = createMockOrder({ subtotal: 81.50, total: 93.73 });
    mockPost.mockResolvedValueOnce(updatedOrder);

    const result = await resource.addTickets('ord_evt_qst_wildrobot_20260412', {
      tickets: [{ type: 'Child', seatId: 'K5' }],
    });

    expect(result.subtotal).toBe(81.50);
    expect(result.total).toBe(93.73);
  });
});

// ---------------------------------------------------------------------------
// addItems() — append concession items to an order
// ---------------------------------------------------------------------------

describe('OrdersResource.addItems()', () => {
  let resource: OrdersResource;
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockPost } = createMockHTTPClient());
  });

  it('posts to the correct items sub-resource path', async () => {
    const orderId = 'ord_evt_qst_wildrobot_20260412';
    mockPost.mockResolvedValueOnce(createMockOrder());

    await resource.addItems(orderId, {
      items: [{ menuItemId: 'mnui_large_popcorn', quantity: 2 }],
    });

    expect(mockPost).toHaveBeenCalledWith(
      `/ocapi/v1/orders/${orderId}/items`,
      expect.any(Object),
    );
  });

  it('sends the items array with menuItemId and quantity', async () => {
    const orderId = 'ord_evt_qst_wildrobot_20260412';
    mockPost.mockResolvedValueOnce(createMockOrder());

    await resource.addItems(orderId, {
      items: [
        { menuItemId: 'mnui_large_popcorn', quantity: 2 },
        { menuItemId: 'mnui_coke_large', quantity: 2 },
      ],
    });

    expect(mockPost).toHaveBeenCalledWith(`/ocapi/v1/orders/${orderId}/items`, {
      body: {
        items: [
          { menuItemId: 'mnui_large_popcorn', quantity: 2 },
          { menuItemId: 'mnui_coke_large', quantity: 2 },
        ],
      },
    });
  });

  it('returns the updated order with new items reflected', async () => {
    const updatedOrder = createMockOrder({
      items: [
        createMockOrderItem({ id: 'item_001', name: 'Large Popcorn Combo', quantity: 1, totalPrice: 14.00 }),
        createMockOrderItem({ id: 'item_002', name: 'Large Coca-Cola', category: 'Drinks', quantity: 2, unitPrice: 6.50, totalPrice: 13.00 }),
      ],
      subtotal: 72.00,
      total: 82.80,
    });
    mockPost.mockResolvedValueOnce(updatedOrder);

    const result = await resource.addItems('ord_evt_qst_wildrobot_20260412', {
      items: [{ menuItemId: 'mnui_coke_large', quantity: 2 }],
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[1].name).toBe('Large Coca-Cola');
    expect(result.items[1].quantity).toBe(2);
    expect(result.items[1].totalPrice).toBe(13.00);
  });
});

// ---------------------------------------------------------------------------
// confirm() / cancel() / complete() — order lifecycle transitions
// ---------------------------------------------------------------------------

describe('OrdersResource lifecycle transitions', () => {
  let resource: OrdersResource;
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockPost } = createMockHTTPClient());
  });

  it('confirm() posts to the correct confirm endpoint', async () => {
    const orderId = 'ord_evt_qst_wildrobot_20260412';
    mockPost.mockResolvedValueOnce(createMockConfirmedOrder());

    await resource.confirm(orderId);

    expect(mockPost).toHaveBeenCalledWith(`/ocapi/v1/orders/${orderId}/confirm`);
  });

  it('confirm() returns an order in confirmed status with confirmedAt timestamp', async () => {
    const confirmed = createMockConfirmedOrder();
    mockPost.mockResolvedValueOnce(confirmed);

    const result = await resource.confirm('ord_evt_qst_wildrobot_20260412');

    expect(result.status).toBe('confirmed');
    expect(result.confirmedAt).toBe('2026-04-12T09:02:00+12:00');
  });

  it('cancel() posts to the correct cancel endpoint', async () => {
    const orderId = 'ord_evt_qst_wildrobot_20260412';
    const cancelled = createMockOrder({
      status: 'cancelled',
      cancelledAt: '2026-04-12T09:05:00+12:00',
    });
    mockPost.mockResolvedValueOnce(cancelled);

    await resource.cancel(orderId);

    expect(mockPost).toHaveBeenCalledWith(`/ocapi/v1/orders/${orderId}/cancel`);
  });

  it('cancel() returns an order in cancelled status with cancelledAt timestamp', async () => {
    const cancelled = createMockOrder({
      status: 'cancelled',
      cancelledAt: '2026-04-12T09:05:00+12:00',
    });
    mockPost.mockResolvedValueOnce(cancelled);

    const result = await resource.cancel('ord_evt_qst_wildrobot_20260412');

    expect(result.status).toBe('cancelled');
    expect(result.cancelledAt).toBeDefined();
  });

  it('complete() posts to the correct complete endpoint', async () => {
    const orderId = 'ord_evt_qst_wildrobot_20260412';
    const completed = createMockConfirmedOrder({
      status: 'completed',
      completedAt: '2026-04-12T21:55:00+12:00',
    });
    mockPost.mockResolvedValueOnce(completed);

    await resource.complete(orderId);

    expect(mockPost).toHaveBeenCalledWith(`/ocapi/v1/orders/${orderId}/complete`);
  });

  it('complete() returns an order in completed status with completedAt timestamp', async () => {
    const completed = createMockConfirmedOrder({
      status: 'completed',
      completedAt: '2026-04-12T21:55:00+12:00',
    });
    mockPost.mockResolvedValueOnce(completed);

    const result = await resource.complete('ord_evt_qst_wildrobot_20260412');

    expect(result.status).toBe('completed');
    expect(result.completedAt).toBe('2026-04-12T21:55:00+12:00');
  });

  it('each lifecycle transition targets a different order status', async () => {
    const statuses: OrderStatus[] = ['confirmed', 'cancelled', 'completed'];
    for (const status of statuses) {
      mockPost.mockResolvedValueOnce(createMockOrder({ status }));
    }

    const confirmed = await resource.confirm('ord_001');
    const cancelled = await resource.cancel('ord_002');
    const completed = await resource.complete('ord_003');

    expect(confirmed.status).toBe('confirmed');
    expect(cancelled.status).toBe('cancelled');
    expect(completed.status).toBe('completed');
  });
});

// ---------------------------------------------------------------------------
// applyLoyalty() — attach loyalty member and redeem points
// ---------------------------------------------------------------------------

describe('OrdersResource.applyLoyalty()', () => {
  let resource: OrdersResource;
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockPost } = createMockHTTPClient());
  });

  it('posts to the correct loyalty sub-resource path', async () => {
    const orderId = 'ord_evt_qst_wildrobot_20260412';
    mockPost.mockResolvedValueOnce(createMockConfirmedOrder());

    await resource.applyLoyalty(orderId, { memberId: 'mem_hemi_walker_012' });

    expect(mockPost).toHaveBeenCalledWith(
      `/ocapi/v1/orders/${orderId}/loyalty`,
      expect.any(Object),
    );
  });

  it('sends the memberId in the request body', async () => {
    const orderId = 'ord_evt_qst_wildrobot_20260412';
    mockPost.mockResolvedValueOnce(createMockConfirmedOrder());

    await resource.applyLoyalty(orderId, { memberId: 'mem_hemi_walker_012' });

    expect(mockPost).toHaveBeenCalledWith(`/ocapi/v1/orders/${orderId}/loyalty`, {
      body: { memberId: 'mem_hemi_walker_012' },
    });
  });

  it('sends pointsToRedeem when provided', async () => {
    const orderId = 'ord_evt_qst_wildrobot_20260412';
    const withRedemption = createMockConfirmedOrder({
      loyaltyPointsRedeemed: 200,
      discount: 5.00,
      total: 62.85,
    });
    mockPost.mockResolvedValueOnce(withRedemption);

    await resource.applyLoyalty(orderId, {
      memberId: 'mem_hemi_walker_012',
      pointsToRedeem: 200,
    });

    expect(mockPost).toHaveBeenCalledWith(`/ocapi/v1/orders/${orderId}/loyalty`, {
      body: { memberId: 'mem_hemi_walker_012', pointsToRedeem: 200 },
    });
  });

  it('returns the updated order with loyalty fields populated', async () => {
    const withLoyalty = createMockConfirmedOrder({
      loyaltyMemberId: 'mem_hemi_walker_012',
      loyaltyPointsEarned: 68,
      loyaltyPointsRedeemed: 0,
    });
    mockPost.mockResolvedValueOnce(withLoyalty);

    const result = await resource.applyLoyalty('ord_evt_qst_wildrobot_20260412', {
      memberId: 'mem_hemi_walker_012',
    });

    expect(result.loyaltyMemberId).toBe('mem_hemi_walker_012');
    expect(result.loyaltyPointsEarned).toBe(68);
    expect(result.loyaltyPointsRedeemed).toBe(0);
  });

  it('reflects a discount on the order total when points are redeemed', async () => {
    const withDiscount = createMockConfirmedOrder({
      loyaltyPointsRedeemed: 500,
      discount: 10.00,
      total: 57.85,
    });
    mockPost.mockResolvedValueOnce(withDiscount);

    const result = await resource.applyLoyalty('ord_evt_qst_wildrobot_20260412', {
      memberId: 'mem_hemi_walker_012',
      pointsToRedeem: 500,
    });

    expect(result.discount).toBe(10.00);
    expect(result.total).toBe(57.85);
    expect(result.loyaltyPointsRedeemed).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// refund() — trigger refund workflow for a confirmed/completed order
// ---------------------------------------------------------------------------

describe('OrdersResource.refund()', () => {
  let resource: OrdersResource;
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockPost } = createMockHTTPClient());
  });

  it('posts to the correct refund endpoint', async () => {
    const orderId = 'ord_evt_qst_wildrobot_20260412';
    const refunded = createMockOrder({
      status: 'refunded',
      refundedAt: '2026-04-12T10:00:00+12:00',
    });
    mockPost.mockResolvedValueOnce(refunded);

    await resource.refund(orderId);

    expect(mockPost).toHaveBeenCalledWith(`/ocapi/v1/orders/${orderId}/refund`);
  });

  it('returns an order in refunded status with refundedAt timestamp', async () => {
    const refunded = createMockOrder({
      status: 'refunded',
      refundedAt: '2026-04-12T10:00:00+12:00',
    });
    mockPost.mockResolvedValueOnce(refunded);

    const result = await resource.refund('ord_evt_qst_wildrobot_20260412');

    expect(result.status).toBe('refunded');
    expect(result.refundedAt).toBe('2026-04-12T10:00:00+12:00');
  });

  it('preserves the original ticket and item data on the refunded order', async () => {
    const refunded = createMockOrder({
      status: 'refunded',
      refundedAt: '2026-04-12T10:00:00+12:00',
    });
    mockPost.mockResolvedValueOnce(refunded);

    const result = await resource.refund('ord_evt_qst_wildrobot_20260412');

    expect(result.tickets).toHaveLength(2);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(67.85);
  });
});

// ---------------------------------------------------------------------------
// history() — paginated order history for a loyalty member
// ---------------------------------------------------------------------------

describe('OrdersResource.history()', () => {
  let resource: OrdersResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('fetches from the correct member orders endpoint', async () => {
    const memberId = 'mem_hemi_walker_012';
    mockGet.mockResolvedValueOnce(createMockOrderHistory());

    await resource.history(memberId);

    expect(mockGet).toHaveBeenCalledWith(
      `/ocapi/v1/members/${memberId}/orders`,
      expect.any(Object),
    );
  });

  it('returns a paginated response with the orders array', async () => {
    const orders = [
      createMockConfirmedOrder({ id: 'ord_001' }),
      createMockConfirmedOrder({ id: 'ord_002', status: 'completed' }),
    ];
    mockGet.mockResolvedValueOnce(createMockOrderHistory(orders, { total: 2 }));

    const result = await resource.history('mem_hemi_walker_012');

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.data[0].id).toBe('ord_001');
    expect(result.data[1].status).toBe('completed');
  });

  it('passes status filter as a query parameter', async () => {
    mockGet.mockResolvedValueOnce(createMockOrderHistory());

    await resource.history('mem_hemi_walker_012', { status: 'confirmed' });

    expect(mockGet).toHaveBeenCalledWith(
      '/ocapi/v1/members/mem_hemi_walker_012/orders',
      { params: { status: 'confirmed' } },
    );
  });

  it('passes since and until date filters as query parameters', async () => {
    mockGet.mockResolvedValueOnce(createMockOrderHistory());

    await resource.history('mem_hemi_walker_012', {
      since: '2026-01-01T00:00:00+12:00',
      until: '2026-04-12T23:59:59+12:00',
    });

    expect(mockGet).toHaveBeenCalledWith(
      '/ocapi/v1/members/mem_hemi_walker_012/orders',
      {
        params: {
          since: '2026-01-01T00:00:00+12:00',
          until: '2026-04-12T23:59:59+12:00',
        },
      },
    );
  });

  it('passes limit and cursor pagination parameters', async () => {
    const page2cursor = 'cursor_page2_abc123';
    mockGet.mockResolvedValueOnce(createMockOrderHistory());

    await resource.history('mem_hemi_walker_012', {
      limit: 10,
      cursor: page2cursor,
    });

    expect(mockGet).toHaveBeenCalledWith(
      '/ocapi/v1/members/mem_hemi_walker_012/orders',
      { params: { limit: '10', cursor: page2cursor } },
    );
  });

  it('returns hasMore false and no nextCursor for the final page', async () => {
    mockGet.mockResolvedValueOnce(
      createMockOrderHistory([createMockConfirmedOrder()], { hasMore: false, nextCursor: undefined }),
    );

    const result = await resource.history('mem_hemi_walker_012');

    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });

  it('returns a nextCursor when more pages exist', async () => {
    const manyOrders = Array.from({ length: 10 }, (_, i) =>
      createMockConfirmedOrder({ id: `ord_${String(i).padStart(3, '0')}` }),
    );
    mockGet.mockResolvedValueOnce(
      createMockOrderHistory(manyOrders, { hasMore: true, nextCursor: 'cursor_next_page', total: 25 }),
    );

    const result = await resource.history('mem_hemi_walker_012', { limit: 10 });

    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('cursor_next_page');
    expect(result.total).toBe(25);
    expect(result.data).toHaveLength(10);
  });

  it('returns an empty history for a member with no orders', async () => {
    mockGet.mockResolvedValueOnce(createMockOrderHistory([], { total: 0, hasMore: false }));

    const result = await resource.history('mem_new_member_999');

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
