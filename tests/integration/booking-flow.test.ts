/**
 * Integration test: Booking Flow
 *
 * Simulates the full cinema booking lifecycle:
 *   get session → create order → add tickets → add F&B → apply loyalty → confirm → complete
 *
 * Also tests cancellation, refund, and order history retrieval.
 * Mocks the HTTP layer but exercises the full SDK resource modules.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OrdersResource } from '../../packages/sdk/src/resources/orders';
import { SessionsResource } from '../../packages/sdk/src/resources/sessions';
import {
  createMockHTTP,
  asHTTPClient,
  ANORA_SESSION_ROXY,
  ROXY_SCREEN1_SEATS,
  createDraftOrder,
  createTicket,
  createOrderItem,
  createOrderWithTickets,
  createConfirmedOrder,
  type MockHTTPClient,
} from './fixtures';

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

let mock: MockHTTPClient;
let orders: OrdersResource;
let sessions: SessionsResource;

beforeEach(() => {
  mock = createMockHTTP();
  const http = asHTTPClient(mock);
  orders = new OrdersResource(http);
  sessions = new SessionsResource(http);
});

// ---------------------------------------------------------------------------
// Phase 1 — Create order from a session
// ---------------------------------------------------------------------------

describe('Booking flow: create order', () => {
  it('creates a draft order for a bookable session', async () => {
    const draftOrder = createDraftOrder();
    mock.post.mockResolvedValueOnce(draftOrder);

    const order = await orders.create({
      sessionId: 'ses_roxy_anora_20260413_1930',
      tickets: [{ type: 'Adult', seatId: 'H7' }],
    });

    expect(order.id).toBe('ord_roxy_anora_20260413');
    expect(order.status).toBe('draft');
    expect(order.sessionId).toBe('ses_roxy_anora_20260413_1930');
    expect(order.currency).toBe('NZD');
    expect(mock.post).toHaveBeenCalledWith('/ocapi/v1/orders', {
      body: {
        sessionId: 'ses_roxy_anora_20260413_1930',
        tickets: [{ type: 'Adult', seatId: 'H7' }],
      },
    });
  });

  it('retrieves an existing order by ID', async () => {
    const draftOrder = createDraftOrder();
    mock.get.mockResolvedValueOnce(draftOrder);

    const order = await orders.get('ord_roxy_anora_20260413');

    expect(order.id).toBe('ord_roxy_anora_20260413');
    expect(mock.get).toHaveBeenCalledWith('/ocapi/v1/orders/ord_roxy_anora_20260413');
  });
});

// ---------------------------------------------------------------------------
// Phase 2 — Add tickets and F&B
// ---------------------------------------------------------------------------

describe('Booking flow: add tickets and items', () => {
  it('adds two adult tickets with seat selection', async () => {
    const orderWithTickets = createOrderWithTickets();
    mock.post.mockResolvedValueOnce(orderWithTickets);

    const updated = await orders.addTickets('ord_roxy_anora_20260413', {
      tickets: [
        { type: 'Adult', seatId: 'H7' },
        { type: 'Adult', seatId: 'H8' },
      ],
    });

    expect(updated.tickets).toHaveLength(2);
    expect(updated.tickets[0].seatLabel).toBe('Row H, Seat 7');
    expect(updated.tickets[1].seatLabel).toBe('Row H, Seat 8');
    expect(updated.subtotal).toBe(39.00);
    expect(mock.post).toHaveBeenCalledWith(
      '/ocapi/v1/orders/ord_roxy_anora_20260413/tickets',
      expect.objectContaining({
        body: { tickets: expect.arrayContaining([{ type: 'Adult', seatId: 'H7' }]) },
      }),
    );
  });

  it('adds a flat white from the café to the order', async () => {
    const orderWithItems = createOrderWithTickets();
    orderWithItems.items = [createOrderItem()];
    orderWithItems.subtotal = 44.50;
    orderWithItems.tax = 6.68;
    orderWithItems.total = 51.18;
    mock.post.mockResolvedValueOnce(orderWithItems);

    const updated = await orders.addItems('ord_roxy_anora_20260413', {
      items: [{ menuItemId: 'menu_flat_white', quantity: 1 }],
    });

    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].name).toBe('Flat White');
    expect(updated.items[0].category).toBe('Hot Drinks');
    expect(updated.total).toBe(51.18);
  });
});

// ---------------------------------------------------------------------------
// Phase 3 — Apply loyalty and confirm
// ---------------------------------------------------------------------------

describe('Booking flow: loyalty and confirmation', () => {
  it('applies a loyalty membership to earn points', async () => {
    const loyaltyOrder = createOrderWithTickets();
    loyaltyOrder.loyaltyMemberId = 'mem_aroha_tangaroa_007';
    loyaltyOrder.loyaltyPointsEarned = 44;
    mock.post.mockResolvedValueOnce(loyaltyOrder);

    const updated = await orders.applyLoyalty('ord_roxy_anora_20260413', {
      memberId: 'mem_aroha_tangaroa_007',
    });

    expect(updated.loyaltyMemberId).toBe('mem_aroha_tangaroa_007');
    expect(updated.loyaltyPointsEarned).toBe(44);
  });

  it('applies loyalty with point redemption for a discount', async () => {
    const loyaltyOrder = createOrderWithTickets();
    loyaltyOrder.loyaltyMemberId = 'mem_aroha_tangaroa_007';
    loyaltyOrder.loyaltyPointsRedeemed = 500;
    loyaltyOrder.discount = 5.00;
    loyaltyOrder.total = 39.85;
    mock.post.mockResolvedValueOnce(loyaltyOrder);

    const updated = await orders.applyLoyalty('ord_roxy_anora_20260413', {
      memberId: 'mem_aroha_tangaroa_007',
      pointsToRedeem: 500,
    });

    expect(updated.loyaltyPointsRedeemed).toBe(500);
    expect(updated.discount).toBe(5.00);
    expect(updated.total).toBe(39.85);
  });

  it('confirms an order — locks seats and pricing', async () => {
    const confirmed = createConfirmedOrder();
    mock.post.mockResolvedValueOnce(confirmed);

    const result = await orders.confirm('ord_roxy_anora_20260413');

    expect(result.status).toBe('confirmed');
    expect(result.confirmedAt).toBeDefined();
    expect(mock.post).toHaveBeenCalledWith('/ocapi/v1/orders/ord_roxy_anora_20260413/confirm');
  });
});

// ---------------------------------------------------------------------------
// Phase 4 — Complete, cancel, and refund
// ---------------------------------------------------------------------------

describe('Booking flow: lifecycle operations', () => {
  it('completes a confirmed order after the screening', async () => {
    const completed = createConfirmedOrder();
    completed.status = 'completed';
    completed.completedAt = '2026-04-13T22:00:00+12:00';
    mock.post.mockResolvedValueOnce(completed);

    const result = await orders.complete('ord_roxy_anora_20260413');

    expect(result.status).toBe('completed');
    expect(result.completedAt).toBe('2026-04-13T22:00:00+12:00');
  });

  it('cancels a pending order and releases seats', async () => {
    const cancelled = createOrderWithTickets();
    cancelled.status = 'cancelled';
    cancelled.cancelledAt = '2026-04-13T10:15:00+12:00';
    mock.post.mockResolvedValueOnce(cancelled);

    const result = await orders.cancel('ord_roxy_anora_20260413');

    expect(result.status).toBe('cancelled');
    expect(result.cancelledAt).toBeDefined();
  });

  it('refunds a confirmed order', async () => {
    const refunded = createConfirmedOrder();
    refunded.status = 'refunded';
    refunded.refundedAt = '2026-04-13T12:00:00+12:00';
    mock.post.mockResolvedValueOnce(refunded);

    const result = await orders.refund('ord_roxy_anora_20260413');

    expect(result.status).toBe('refunded');
    expect(result.refundedAt).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Phase 5 — Order history
// ---------------------------------------------------------------------------

describe('Booking flow: order history', () => {
  it('retrieves order history for a loyalty member', async () => {
    const historyResponse = {
      data: [createConfirmedOrder(), createDraftOrder({ status: 'completed' as const, completedAt: '2026-03-20T22:00:00+12:00' })],
      total: 2,
      hasMore: false,
      strategy: 'cursor' as const,
    };
    mock.get.mockResolvedValueOnce(historyResponse);

    const history = await orders.history('mem_aroha_tangaroa_007');

    expect(history.data).toHaveLength(2);
    expect(history.total).toBe(2);
    expect(history.hasMore).toBe(false);
  });

  it('filters order history by status and date range', async () => {
    const historyResponse = {
      data: [createConfirmedOrder()],
      total: 1,
      hasMore: false,
      strategy: 'cursor' as const,
    };
    mock.get.mockResolvedValueOnce(historyResponse);

    const history = await orders.history('mem_aroha_tangaroa_007', {
      status: 'confirmed',
      since: '2026-04-01',
      until: '2026-04-13',
      limit: 10,
    });

    expect(history.data).toHaveLength(1);
    expect(mock.get).toHaveBeenCalledWith(
      '/ocapi/v1/members/mem_aroha_tangaroa_007/orders',
      {
        params: expect.objectContaining({
          status: 'confirmed',
          since: '2026-04-01',
          until: '2026-04-13',
          limit: '10',
        }),
      },
    );
  });
});

// ---------------------------------------------------------------------------
// End-to-end booking: full flow in sequence
// ---------------------------------------------------------------------------

describe('Booking flow: full end-to-end journey', () => {
  it('session → create order → add tickets → add F&B → loyalty → confirm', async () => {
    // Step 1: Get the session we want to book
    mock.get.mockResolvedValueOnce(ANORA_SESSION_ROXY);
    const session = await sessions.get('ses_roxy_anora_20260413_1930');
    expect(session.isBookable).toBe(true);

    // Step 2: Check seat availability
    mock.get.mockResolvedValueOnce(ROXY_SCREEN1_SEATS);
    const seatMap = await sessions.availability(session.id);
    const chosenSeats = seatMap.seats.filter(s => s.id === 'H7' || s.id === 'H8');
    expect(chosenSeats.every(s => s.status === 'available')).toBe(true);

    // Step 3: Create a draft order
    mock.post.mockResolvedValueOnce(createDraftOrder());
    const draft = await orders.create({
      sessionId: session.id,
      tickets: chosenSeats.map(s => ({ type: 'Adult', seatId: s.id })),
    });
    expect(draft.status).toBe('draft');

    // Step 4: Add tickets
    const withTickets = createOrderWithTickets();
    mock.post.mockResolvedValueOnce(withTickets);
    const ticketed = await orders.addTickets(draft.id, {
      tickets: chosenSeats.map(s => ({ type: 'Adult', seatId: s.id })),
    });
    expect(ticketed.tickets).toHaveLength(2);

    // Step 5: Add a flat white
    const withItems = { ...withTickets, items: [createOrderItem()], subtotal: 44.50, tax: 6.68, total: 51.18 };
    mock.post.mockResolvedValueOnce(withItems);
    const withFnB = await orders.addItems(draft.id, {
      items: [{ menuItemId: 'menu_flat_white', quantity: 1 }],
    });
    expect(withFnB.items).toHaveLength(1);

    // Step 6: Apply loyalty
    const withLoyalty = { ...withItems, loyaltyMemberId: 'mem_aroha_tangaroa_007', loyaltyPointsEarned: 51 };
    mock.post.mockResolvedValueOnce(withLoyalty);
    const loyal = await orders.applyLoyalty(draft.id, { memberId: 'mem_aroha_tangaroa_007' });
    expect(loyal.loyaltyMemberId).toBe('mem_aroha_tangaroa_007');

    // Step 7: Confirm the order
    mock.post.mockResolvedValueOnce(createConfirmedOrder());
    const confirmed = await orders.confirm(draft.id);
    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.confirmedAt).toBeDefined();

    // Verify: 2 GET calls (session, seats) + 5 POST calls (create, tickets, items, loyalty, confirm)
    expect(mock.get).toHaveBeenCalledTimes(2);
    expect(mock.post).toHaveBeenCalledTimes(5);
  });
});
