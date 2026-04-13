/**
 * Integration test: Cross-Resource Flow
 *
 * The complete Week 1 user journey — from discovering what's on to
 * walking out of the cinema with a confirmed ticket. Exercises every
 * resource module built in Week 1 (Films, Sites, Sessions, Orders)
 * in a single sequential flow.
 *
 * This is the capstone test that validates the SDK works as a cohesive
 * toolkit, not just isolated modules.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FilmsResource } from '../../packages/sdk/src/resources/films';
import { SessionsResource } from '../../packages/sdk/src/resources/sessions';
import { SitesResource } from '../../packages/sdk/src/resources/sites';
import { OrdersResource } from '../../packages/sdk/src/resources/orders';
import {
  createMockHTTP,
  asHTTPClient,
  ROXY_WELLINGTON,
  ANORA,
  ANORA_DETAIL,
  THE_BRUTALIST,
  ANORA_SESSION_ROXY,
  ROXY_SCREEN1_SEATS,
  createDraftOrder,
  createTicket,
  createOrderItem,
  createOrderWithTickets,
  createConfirmedOrder,
  type MockHTTPClient,
} from './fixtures';

let mock: MockHTTPClient;
let films: FilmsResource;
let sessions: SessionsResource;
let sites: SitesResource;
let orders: OrdersResource;

beforeEach(() => {
  mock = createMockHTTP();
  const http = asHTTPClient(mock);
  films = new FilmsResource(http);
  sessions = new SessionsResource(http);
  sites = new SitesResource(http);
  orders = new OrdersResource(http);
});

describe('Cross-resource: full cinema night journey', () => {
  it('discover → browse → pick seats → book → enjoy → review history', async () => {
    // ─── Step 1: Find a cinema nearby ────────────────────────
    mock.get.mockResolvedValueOnce([ROXY_WELLINGTON]);
    const nearbySites = await sites.nearby(-41.2865, 174.7762, 5);
    expect(nearbySites).toHaveLength(1);
    const cinema = nearbySites[0];
    expect(cinema.name).toBe('Roxy Cinema');
    expect(cinema.config.loyaltyEnabled).toBe(true);

    // ─── Step 2: Browse what's showing at this cinema ────────
    mock.get.mockResolvedValueOnce([ANORA, THE_BRUTALIST]);
    const showing = await films.nowShowing({ siteId: cinema.id });
    expect(showing).toHaveLength(2);

    // ─── Step 3: Pick Anora and read about it ────────────────
    const pick = showing.find(f => f.title === 'Anora')!;
    expect(pick.director).toBe('Sean Baker');
    expect(pick.runtime).toBe(139);

    mock.get.mockResolvedValueOnce(ANORA_DETAIL);
    const detail = await films.getDetail(pick.id);
    expect(detail.ratings.find(r => r.source === 'Rotten Tomatoes')?.score).toBe('95');

    // ─── Step 4: Find tonight's sessions for Anora ───────────
    mock.get.mockResolvedValueOnce({
      sessions: [ANORA_SESSION_ROXY],
      total: 1,
      hasMore: false,
    });
    const showtimes = await sessions.list({
      siteId: cinema.id,
      filmId: pick.id,
      date: '2026-04-13',
    });
    expect(showtimes.sessions).toHaveLength(1);
    const showtime = showtimes.sessions[0];
    expect(showtime.startTime).toContain('19:30');
    expect(showtime.isBookable).toBe(true);

    // ─── Step 5: Check the seat map ──────────────────────────
    mock.get.mockResolvedValueOnce(ROXY_SCREEN1_SEATS);
    const seatMap = await sessions.availability(showtime.id);
    expect(seatMap.availableCount).toBe(142);

    // Pick two adjacent seats in row H
    const targetSeats = seatMap.seats
      .filter(s => s.row === 'H' && s.status === 'available')
      .slice(0, 2);
    expect(targetSeats).toHaveLength(2);
    expect(targetSeats[0].id).toBe('H7');
    expect(targetSeats[1].id).toBe('H8');

    // ─── Step 6: Create an order ─────────────────────────────
    mock.post.mockResolvedValueOnce(createDraftOrder());
    const draft = await orders.create({
      sessionId: showtime.id,
      tickets: targetSeats.map(s => ({ type: 'Adult', seatId: s.id })),
    });
    expect(draft.status).toBe('draft');

    // ─── Step 7: Add tickets with seat selection ─────────────
    const withTickets = createOrderWithTickets();
    mock.post.mockResolvedValueOnce(withTickets);
    const ticketed = await orders.addTickets(draft.id, {
      tickets: targetSeats.map(s => ({ type: 'Adult', seatId: s.id })),
    });
    expect(ticketed.tickets).toHaveLength(2);
    expect(ticketed.subtotal).toBe(39.00);

    // ─── Step 8: Add a flat white from the café ──────────────
    const withFnB = {
      ...withTickets,
      items: [createOrderItem()],
      subtotal: 44.50,
      tax: 6.68,
      total: 51.18,
    };
    mock.post.mockResolvedValueOnce(withFnB);
    const catered = await orders.addItems(draft.id, {
      items: [{ menuItemId: 'menu_flat_white', quantity: 1 }],
    });
    expect(catered.items[0].name).toBe('Flat White');

    // ─── Step 9: Apply loyalty ───────────────────────────────
    const withLoyalty = {
      ...withFnB,
      loyaltyMemberId: 'mem_aroha_tangaroa_007',
      loyaltyPointsEarned: 51,
    };
    mock.post.mockResolvedValueOnce(withLoyalty);
    const loyal = await orders.applyLoyalty(draft.id, {
      memberId: 'mem_aroha_tangaroa_007',
    });
    expect(loyal.loyaltyPointsEarned).toBe(51);

    // ─── Step 10: Confirm the booking ────────────────────────
    mock.post.mockResolvedValueOnce(createConfirmedOrder());
    const confirmed = await orders.confirm(draft.id);
    expect(confirmed.status).toBe('confirmed');

    // ─── Step 11: After the movie — complete the order ───────
    const completed = createConfirmedOrder();
    completed.status = 'completed';
    completed.completedAt = '2026-04-13T22:00:00+12:00';
    mock.post.mockResolvedValueOnce(completed);
    const done = await orders.complete(draft.id);
    expect(done.status).toBe('completed');

    // ─── Step 12: Check order history ────────────────────────
    mock.get.mockResolvedValueOnce({
      data: [done],
      total: 1,
      hasMore: false,
      strategy: 'cursor',
    });
    const history = await orders.history('mem_aroha_tangaroa_007', {
      since: '2026-04-13',
    });
    expect(history.data).toHaveLength(1);
    expect(history.data[0].status).toBe('completed');

    // ─── Verify call counts ──────────────────────────────────
    // GET: nearby + nowShowing + detail + sessions + seats + history = 6
    expect(mock.get).toHaveBeenCalledTimes(6);
    // POST: create + tickets + items + loyalty + confirm + complete = 6
    expect(mock.post).toHaveBeenCalledTimes(6);
  });
});

describe('Cross-resource: cancellation mid-journey', () => {
  it('discovers, starts booking, then cancels before confirmation', async () => {
    // Find cinema and session
    mock.get.mockResolvedValueOnce(ROXY_WELLINGTON);
    const site = await sites.get('site_roxy_wellington');
    expect(site.isActive).toBe(true);

    mock.get.mockResolvedValueOnce({
      sessions: [ANORA_SESSION_ROXY],
      total: 1,
      hasMore: false,
    });
    const showList = await sessions.list({ siteId: site.id, date: '2026-04-13' });

    // Create order
    mock.post.mockResolvedValueOnce(createDraftOrder());
    const draft = await orders.create({
      sessionId: showList.sessions[0].id,
      tickets: [{ type: 'Adult', seatId: 'H7' }],
    });

    // Change of plans — cancel
    const cancelled = createDraftOrder({
      status: 'cancelled',
      cancelledAt: '2026-04-13T10:10:00+12:00',
    });
    mock.post.mockResolvedValueOnce(cancelled);
    const result = await orders.cancel(draft.id);

    expect(result.status).toBe('cancelled');
    expect(result.cancelledAt).toBeDefined();
  });
});

describe('Cross-resource: pagination across sessions', () => {
  it('paginates through multi-page session results for a busy cinema', async () => {
    // Page 1 — first batch of sessions
    const page1Sessions = Array.from({ length: 3 }, (_, i) => ({
      ...ANORA_SESSION_ROXY,
      id: `ses_roxy_anora_page1_${i}`,
      startTime: `2026-04-13T${18 + i}:00:00+12:00`,
    }));

    mock.get.mockResolvedValueOnce({
      sessions: page1Sessions,
      total: 5,
      hasMore: true,
      nextOffset: 3,
    });

    // Page 2 — remaining sessions
    const page2Sessions = Array.from({ length: 2 }, (_, i) => ({
      ...ANORA_SESSION_ROXY,
      id: `ses_roxy_anora_page2_${i}`,
      startTime: `2026-04-13T${21 + i}:00:00+12:00`,
    }));

    mock.get.mockResolvedValueOnce({
      sessions: page2Sessions,
      total: 5,
      hasMore: false,
    });

    // Use listAll() async generator to auto-paginate
    const allSessions = [];
    for await (const session of sessions.listAll({ siteId: 'site_roxy_wellington' }, 3)) {
      allSessions.push(session);
    }

    expect(allSessions).toHaveLength(5);
    expect(allSessions[0].id).toBe('ses_roxy_anora_page1_0');
    expect(allSessions[4].id).toBe('ses_roxy_anora_page2_1');
    expect(mock.get).toHaveBeenCalledTimes(2);
  });
});
