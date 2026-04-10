import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionsResource } from '../../src/resources/sessions';
import type { TheatricalHTTPClient } from '../../src/http/client';
import type { Session, SeatAvailability, SessionListResponse } from '../../src/types/session';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/** Create a minimal mock HTTP client that wraps a vi.fn() get() method. */
function createMockHTTPClient(): {
  resource: SessionsResource;
  mockGet: ReturnType<typeof vi.fn>;
} {
  const mockGet = vi.fn();
  const http = { get: mockGet } as unknown as TheatricalHTTPClient;
  return { resource: new SessionsResource(http), mockGet };
}

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

/** Realistic cinema session — The Holdovers at Roxy Cinema Wellington. */
function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'ses_roxy_holdovers_20260410_1915',
    filmId: 'film_holdovers_2023',
    filmTitle: 'The Holdovers',
    siteId: 'site_roxy_wellington',
    screenId: 'scr_roxy_3',
    screenName: 'Screen 3',
    startTime: '2026-04-10T19:15:00+12:00',
    endTime: '2026-04-10T21:42:00+12:00',
    format: '2D',
    isBookable: true,
    isSoldOut: false,
    seatsAvailable: 74,
    seatsTotal: 120,
    priceFrom: 19.50,
    currency: 'NZD',
    attributes: { subtitles: 'English', audio: 'English' },
    ...overrides,
  };
}

/** Realistic session list response wrapping a single Roxy session. */
function createMockSessionListResponse(
  sessions: Session[] = [createMockSession()],
  overrides: Partial<Omit<SessionListResponse, 'sessions'>> = {},
): SessionListResponse {
  return {
    sessions,
    total: sessions.length,
    hasMore: false,
    nextOffset: undefined,
    ...overrides,
  };
}

/** Realistic seat availability response for Roxy Screen 3. */
function createMockSeatAvailability(
  overrides: Partial<SeatAvailability> = {},
): SeatAvailability {
  return {
    sessionId: 'ses_roxy_holdovers_20260410_1915',
    screenName: 'Screen 3',
    rowCount: 10,
    screenPosition: 'top',
    availableCount: 74,
    totalCount: 120,
    seats: [
      { id: 'H7', row: 'H', number: 7, status: 'available', x: 7, y: 8, isAccessible: false },
      { id: 'H8', row: 'H', number: 8, status: 'available', x: 8, y: 8, isAccessible: false },
      { id: 'A1', row: 'A', number: 1, status: 'wheelchair', x: 1, y: 1, isAccessible: true },
      { id: 'B3', row: 'B', number: 3, status: 'taken', x: 3, y: 2, isAccessible: false },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Smoke test — resource instantiation
// ---------------------------------------------------------------------------

describe('SessionsResource', () => {
  it('instantiates with an HTTP client', () => {
    const { resource } = createMockHTTPClient();
    expect(resource).toBeInstanceOf(SessionsResource);
  });
});

// ---------------------------------------------------------------------------
// list() — basic fetching and filtering
// ---------------------------------------------------------------------------

describe('SessionsResource.list()', () => {
  let resource: SessionsResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('fetches sessions from the correct OCAPI endpoint', async () => {
    mockGet.mockResolvedValueOnce(createMockSessionListResponse());

    await resource.list();

    expect(mockGet).toHaveBeenCalledOnce();
    expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/sessions', expect.any(Object));
  });

  it('passes siteId filter as query parameter', async () => {
    mockGet.mockResolvedValueOnce(createMockSessionListResponse());

    await resource.list({ siteId: 'site_roxy_wellington' });

    expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/sessions', {
      params: { siteId: 'site_roxy_wellington' },
    });
  });

  it('passes date and format filters together', async () => {
    mockGet.mockResolvedValueOnce(createMockSessionListResponse());

    await resource.list({ date: '2026-04-10', format: 'IMAX' });

    expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/sessions', {
      params: { date: '2026-04-10', format: 'IMAX' },
    });
  });

  it('passes bookableOnly flag when set', async () => {
    mockGet.mockResolvedValueOnce(createMockSessionListResponse());

    await resource.list({ bookableOnly: true });

    expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/sessions', {
      params: { bookableOnly: true },
    });
  });

  it('returns an empty session list when API returns no results', async () => {
    mockGet.mockResolvedValueOnce(
      createMockSessionListResponse([], { total: 0, hasMore: false }),
    );

    const result = await resource.list({ siteId: 'site_roxy_wellington', date: '2099-01-01' });

    expect(result.sessions).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('returns multiple sessions from different sites', async () => {
    const sessions = [
      createMockSession({ id: 'ses_001', siteId: 'site_roxy_wellington' }),
      createMockSession({
        id: 'ses_002',
        siteId: 'site_embassy_wellington',
        filmTitle: 'Dune: Part Two',
        format: 'IMAX',
      }),
    ];
    mockGet.mockResolvedValueOnce(createMockSessionListResponse(sessions, { total: 2 }));

    const result = await resource.list();

    expect(result.sessions).toHaveLength(2);
    expect(result.sessions[0].siteId).toBe('site_roxy_wellington');
    expect(result.sessions[1].format).toBe('IMAX');
  });
});
