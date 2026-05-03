/**
 * Full-stack integration tests: SDK → Events → Webhook
 *
 * Validates that the three package layers work together:
 * 1. SDK resources produce typed data
 * 2. Events watchers detect state changes in that data
 * 3. Webhook delivery engine dispatches signed notifications
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  createDraftOrder,
  createConfirmedOrder,
  ANORA,
  THE_BRUTALIST,
  ANORA_SESSION_ROXY,
} from './fixtures';
import { BookingWatcher } from '../../packages/events/src/watchers/booking-watcher';
import { SessionWatcher } from '../../packages/events/src/watchers/session-watcher';
import { FilmWatcher } from '../../packages/events/src/watchers/film-watcher';
import { WebhookDeliveryEngine } from '../../packages/events/src/webhook/delivery';
import { computeSignature } from '../../packages/events/src/webhook/signature';
import type { WebhookEndpoint } from '../../packages/events/src/webhook/types';

describe('Full-stack integration: SDK → Events → Webhook', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('booking confirmation triggers watcher event and webhook delivery', async () => {
    // Step 1: SDK layer — order transitions from draft to confirmed
    const draftOrder = createDraftOrder({ id: 'ord-integration-001', status: 'pending' });
    const confirmedOrder = createConfirmedOrder();
    confirmedOrder.id = 'ord-integration-001';

    // Step 2: Events layer — BookingWatcher detects the transition
    const fetchOrders = vi.fn()
      .mockResolvedValueOnce([draftOrder])
      .mockResolvedValueOnce([confirmedOrder]);

    const watcher = new BookingWatcher({ fetch: fetchOrders, intervalMs: 1000 });

    // Step 3: Webhook layer — delivery engine sends signed notification
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const engine = new WebhookDeliveryEngine({
      maxRetries: 0,
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    });

    const endpoint: WebhookEndpoint = {
      id: 'ep-integration',
      url: 'https://hooks.example.com/cinema',
      secret: 'whsec_integration_test',
      events: ['booking.confirmed'],
      enabled: true,
    };

    // Wire it together: watcher event → webhook delivery
    watcher.on('booking.confirmed', async ({ order }) => {
      await engine.deliverAll([endpoint], 'booking.confirmed', {
        orderId: order.id,
        status: order.status,
      });
    });

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);    // first poll
    await vi.advanceTimersByTimeAsync(1000); // second poll — triggers confirmed
    watcher.stop();

    // Verify the webhook was called with correct data
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://hooks.example.com/cinema');

    const body = JSON.parse(opts.body);
    expect(body.event).toBe('booking.confirmed');
    expect(body.data.orderId).toBe('ord-integration-001');
    expect(body.data.status).toBe('confirmed');

    // Verify HMAC signature is valid
    const sigHeader = opts.headers['X-Theatrical-Signature'];
    const sig = sigHeader.replace('sha256=', '');
    const expected = computeSignature(opts.body, endpoint.secret);
    expect(sig).toBe(expected);
  });

  it('film catalogue change triggers watcher and filters to subscribed endpoints', async () => {
    const fetchFilms = vi.fn()
      .mockResolvedValueOnce([ANORA])
      .mockResolvedValueOnce([ANORA, THE_BRUTALIST]);

    const watcher = new FilmWatcher({ fetch: fetchFilms, intervalMs: 1000 });
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const engine = new WebhookDeliveryEngine({
      maxRetries: 0,
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    });

    const filmEndpoint: WebhookEndpoint = {
      id: 'ep-films',
      url: 'https://hooks.example.com/films',
      secret: 'whsec_films',
      events: ['film.added'],
      enabled: true,
    };

    const bookingEndpoint: WebhookEndpoint = {
      id: 'ep-bookings',
      url: 'https://hooks.example.com/bookings',
      secret: 'whsec_bookings',
      events: ['booking.confirmed'],
      enabled: true,
    };

    watcher.on('film.added', async ({ film }) => {
      await engine.deliverAll([filmEndpoint, bookingEndpoint], 'film.added', {
        filmId: film.id,
        title: film.title,
      });
    });

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    // Allow async event handler to settle
    await vi.advanceTimersByTimeAsync(50);
    watcher.stop();

    // film.added fires twice: ANORA on first poll, THE_BRUTALIST on second
    // Each delivery targets the film endpoint only (booking endpoint doesn't subscribe)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [url1] = mockFetch.mock.calls[0];
    const [url2] = mockFetch.mock.calls[1];
    expect(url1).toBe('https://hooks.example.com/films');
    expect(url2).toBe('https://hooks.example.com/films');
  });

  it('session sold-out triggers real-time notification chain', async () => {
    const availableSession = { ...ANORA_SESSION_ROXY, isSoldOut: false, seatsAvailable: 5 };
    const soldOutSession = { ...ANORA_SESSION_ROXY, isSoldOut: true, seatsAvailable: 0 };

    const fetchSessions = vi.fn()
      .mockResolvedValueOnce([availableSession])
      .mockResolvedValueOnce([soldOutSession]);

    const watcher = new SessionWatcher({ fetch: fetchSessions, intervalMs: 1000 });
    const events: string[] = [];

    watcher.on('session.soldout', ({ session }) => {
      events.push(`soldout:${session.id}`);
    });
    watcher.on('session.updated', ({ session }) => {
      events.push(`updated:${session.id}`);
    });

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    watcher.stop();

    // Both events should fire — update first (all changes), then soldout (specific transition)
    expect(events).toContain('updated:ses_roxy_anora_20260413_1930');
    expect(events).toContain('soldout:ses_roxy_anora_20260413_1930');
  });

  it('webhook retry recovers from transient failures across the full chain', async () => {
    const draftOrder = createDraftOrder({ id: 'ord-retry', status: 'pending' });
    const confirmed = { ...draftOrder, status: 'confirmed' as const };
    const fetchOrders = vi.fn()
      .mockResolvedValueOnce([draftOrder])
      .mockResolvedValueOnce([confirmed]);

    const watcher = new BookingWatcher({ fetch: fetchOrders, intervalMs: 1000 });

    // Webhook fails twice, succeeds on third try
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const engine = new WebhookDeliveryEngine({
      maxRetries: 2,
      retryBaseDelayMs: 10,
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    });

    const endpoint: WebhookEndpoint = {
      id: 'ep-retry',
      url: 'https://hooks.example.com/retry',
      secret: 'whsec_retry',
      events: ['booking.confirmed'],
      enabled: true,
    };

    const results: Array<{ success: boolean; attempts: number }> = [];

    watcher.on('booking.confirmed', async () => {
      const deliveryResults = await engine.deliverAll([endpoint], 'booking.confirmed', {});
      results.push(...deliveryResults.map(r => ({ success: r.success, attempts: r.attempts })));
    });

    watcher.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);

    // Allow time for retry delays
    await vi.advanceTimersByTimeAsync(100);
    watcher.stop();

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].attempts).toBe(3);
  });
});
