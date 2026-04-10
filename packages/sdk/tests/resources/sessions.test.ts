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
