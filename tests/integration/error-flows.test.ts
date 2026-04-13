/**
 * Integration test: Error Flows
 *
 * Validates that errors propagate correctly through the SDK's resource
 * layer when the HTTP client encounters failures. Tests cover:
 * - Zod validation errors on malformed API responses
 * - Network-level errors bubbling up through resource methods
 * - Error recovery patterns (e.g., retrying after a transient failure)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FilmsResource } from '../../packages/sdk/src/resources/films';
import { SessionsResource } from '../../packages/sdk/src/resources/sessions';
import { SitesResource } from '../../packages/sdk/src/resources/sites';
import { OrdersResource } from '../../packages/sdk/src/resources/orders';
import {
  createMockHTTP,
  asHTTPClient,
  ANORA,
  ANORA_SESSION_ROXY,
  ROXY_WELLINGTON,
  createDraftOrder,
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

// ---------------------------------------------------------------------------
// Zod validation: malformed responses
// ---------------------------------------------------------------------------

describe('Error flows: Zod validation rejects malformed responses', () => {
  it('rejects a session missing required fields', async () => {
    mock.get.mockResolvedValueOnce({
      sessions: [{ id: 'bad', filmTitle: 'Missing Fields' }],
      total: 1,
      hasMore: false,
    });

    await expect(sessions.list()).rejects.toThrow();
  });

  it('rejects a film with invalid runtime type', async () => {
    const malformedFilm = { ...ANORA, runtime: 'two hours' };
    mock.get.mockResolvedValueOnce([malformedFilm]);

    await expect(films.nowShowing()).rejects.toThrow();
  });

  it('rejects a site with out-of-range latitude', async () => {
    const malformedSite = {
      ...ROXY_WELLINGTON,
      location: { latitude: 999, longitude: 174.7766 },
    };
    mock.get.mockResolvedValueOnce(malformedSite);

    await expect(sites.get('site_roxy_wellington')).rejects.toThrow();
  });

  it('rejects a seat availability response with invalid seat status', async () => {
    mock.get.mockResolvedValueOnce({
      sessionId: 'ses_test',
      screenName: 'Screen 1',
      rowCount: 1,
      screenPosition: 'top',
      availableCount: 1,
      totalCount: 1,
      seats: [
        { id: 'A1', row: 'A', number: 1, status: 'invalid_status', x: 1, y: 1, isAccessible: false },
      ],
    });

    await expect(sessions.availability('ses_test')).rejects.toThrow();
  });

  it('rejects an order with invalid status value', async () => {
    const malformedOrder = createDraftOrder({ status: 'shipped' as any });
    mock.get.mockResolvedValueOnce(malformedOrder);

    await expect(orders.get('ord_test')).rejects.toThrow();
  });

  it('rejects a film detail response missing crew array', async () => {
    const malformed = { ...ANORA };
    mock.get.mockResolvedValueOnce(malformed);

    // getDetail expects FilmDetail which requires crew, ratings, formats, languages
    await expect(films.getDetail('film_anora_2024')).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Network-level errors
// ---------------------------------------------------------------------------

describe('Error flows: network errors propagate through resources', () => {
  it('propagates HTTP client errors from films.nowShowing()', async () => {
    mock.get.mockRejectedValueOnce(new Error('Network timeout'));

    await expect(films.nowShowing()).rejects.toThrow('Network timeout');
  });

  it('propagates HTTP client errors from sessions.list()', async () => {
    mock.get.mockRejectedValueOnce(new Error('Connection refused'));

    await expect(sessions.list()).rejects.toThrow('Connection refused');
  });

  it('propagates HTTP client errors from sites.nearby()', async () => {
    mock.get.mockRejectedValueOnce(new Error('DNS resolution failed'));

    await expect(sites.nearby(-41.2865, 174.7762, 10)).rejects.toThrow('DNS resolution failed');
  });

  it('propagates HTTP client errors from orders.create()', async () => {
    mock.post.mockRejectedValueOnce(new Error('Request aborted'));

    await expect(
      orders.create({ sessionId: 'ses_test', tickets: [{ type: 'Adult', seatId: 'A1' }] }),
    ).rejects.toThrow('Request aborted');
  });

  it('propagates HTTP client errors from orders.confirm()', async () => {
    mock.post.mockRejectedValueOnce(new Error('Gateway timeout'));

    await expect(orders.confirm('ord_test')).rejects.toThrow('Gateway timeout');
  });
});

// ---------------------------------------------------------------------------
// Recovery patterns
// ---------------------------------------------------------------------------

describe('Error flows: recovery after transient failures', () => {
  it('succeeds on retry after first call fails for sessions', async () => {
    mock.get
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce({
        sessions: [ANORA_SESSION_ROXY],
        total: 1,
        hasMore: false,
      });

    // First attempt fails
    await expect(sessions.list()).rejects.toThrow('Temporary failure');

    // Second attempt succeeds
    const result = await sessions.list({ siteId: 'site_roxy_wellington' });
    expect(result.sessions).toHaveLength(1);
  });

  it('succeeds on retry after first call fails for orders', async () => {
    mock.post
      .mockRejectedValueOnce(new Error('Service unavailable'))
      .mockResolvedValueOnce(createDraftOrder());

    // First attempt fails
    await expect(
      orders.create({ sessionId: 'ses_test', tickets: [{ type: 'Adult', seatId: 'A1' }] }),
    ).rejects.toThrow('Service unavailable');

    // Second attempt succeeds
    const order = await orders.create({
      sessionId: 'ses_roxy_anora_20260413_1930',
      tickets: [{ type: 'Adult', seatId: 'H7' }],
    });
    expect(order.status).toBe('draft');
  });
});
