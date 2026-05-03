import { describe, expect, it, vi, beforeEach } from 'vitest';
import { WebhookDeliveryEngine } from '../../src/webhook/delivery';
import { computeSignature } from '../../src/webhook/signature';
import type { WebhookEndpoint } from '../../src/webhook/types';

function createEndpoint(overrides: Partial<WebhookEndpoint> = {}): WebhookEndpoint {
  return {
    id: 'ep-001',
    url: 'https://hooks.example.com/theatrical',
    secret: 'whsec_rialto_auckland',
    events: ['booking.confirmed', 'session.soldout'],
    enabled: true,
    ...overrides,
  };
}

describe('WebhookDeliveryEngine', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let engine: WebhookDeliveryEngine;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    engine = new WebhookDeliveryEngine({
      maxRetries: 2,
      retryBaseDelayMs: 10,
      timeoutMs: 5000,
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    });
  });

  it('delivers a payload with HMAC signature header', async () => {
    const endpoint = createEndpoint();
    const result = await engine.deliver(endpoint, {
      id: 'evt-001',
      event: 'booking.confirmed',
      timestamp: '2026-05-03T19:00:00Z',
      data: { orderId: 'ord-001' },
    });

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.attempts).toBe(1);
    expect(result.endpointId).toBe('ep-001');

    // Verify signature header was sent
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['X-Theatrical-Event']).toBe('booking.confirmed');
    expect(options.headers['X-Theatrical-Delivery']).toBe('evt-001');
    expect(options.headers['X-Theatrical-Signature']).toMatch(/^sha256=[0-9a-f]{64}$/);

    // Verify the signature matches the body
    const body = options.body;
    const sigHeader = options.headers['X-Theatrical-Signature'];
    const sig = sigHeader.replace('sha256=', '');
    const expected = computeSignature(body, endpoint.secret);
    expect(sig).toBe(expected);
  });

  it('retries on non-2xx responses with exponential backoff', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const result = await engine.deliver(createEndpoint(), {
      id: 'evt-002',
      event: 'session.soldout',
      timestamp: '2026-05-03T19:00:00Z',
      data: {},
    });

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(3);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('returns failure after exhausting retries', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const result = await engine.deliver(createEndpoint(), {
      id: 'evt-003',
      event: 'booking.confirmed',
      timestamp: '2026-05-03T19:00:00Z',
      data: {},
    });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(3); // 1 initial + 2 retries
    expect(result.error).toBe('HTTP 500');
  });

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await engine.deliver(createEndpoint(), {
      id: 'evt-004',
      event: 'booking.confirmed',
      timestamp: '2026-05-03T19:00:00Z',
      data: {},
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('ECONNREFUSED');
  });

  it('delivers to multiple endpoints concurrently via deliverAll', async () => {
    const ep1 = createEndpoint({ id: 'ep-A', events: ['booking.confirmed'] });
    const ep2 = createEndpoint({ id: 'ep-B', events: ['booking.confirmed'] });

    const results = await engine.deliverAll(
      [ep1, ep2],
      'booking.confirmed',
      { orderId: 'ord-042' },
    );

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('filters endpoints by event subscription', async () => {
    const ep1 = createEndpoint({ id: 'ep-booking', events: ['booking.confirmed'] });
    const ep2 = createEndpoint({ id: 'ep-sessions', events: ['session.soldout'] });

    const results = await engine.deliverAll(
      [ep1, ep2],
      'booking.confirmed',
      { orderId: 'ord-042' },
    );

    // Only ep1 subscribes to booking.confirmed
    expect(results).toHaveLength(1);
    expect(results[0].endpointId).toBe('ep-booking');
  });

  it('skips disabled endpoints', async () => {
    const active = createEndpoint({ id: 'ep-active', enabled: true });
    const disabled = createEndpoint({ id: 'ep-disabled', enabled: false });

    const results = await engine.deliverAll(
      [active, disabled],
      'booking.confirmed',
      {},
    );

    expect(results).toHaveLength(1);
    expect(results[0].endpointId).toBe('ep-active');
  });

  it('isolates endpoint failures — one failing does not block others', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('endpoint A down'))
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const epA = createEndpoint({ id: 'ep-A' });
    const epB = createEndpoint({ id: 'ep-B' });

    // Use no-retry engine for deterministic behaviour
    const noRetryEngine = new WebhookDeliveryEngine({
      maxRetries: 0,
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    });

    const results = await noRetryEngine.deliverAll(
      [epA, epB],
      'booking.confirmed',
      {},
    );

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(false);
    expect(results[1].success).toBe(true);
  });
});
