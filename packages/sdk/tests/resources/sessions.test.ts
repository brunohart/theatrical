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

  it('returns film title and format for each session', async () => {
    const session = createMockSession({ filmTitle: 'Oppenheimer', format: 'IMAX3D' });
    mockGet.mockResolvedValueOnce(createMockSessionListResponse([session]));

    const result = await resource.list({ format: 'IMAX3D' });

    expect(result.sessions[0].filmTitle).toBe('Oppenheimer');
    expect(result.sessions[0].format).toBe('IMAX3D');
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

// ---------------------------------------------------------------------------
// get() — single session retrieval
// ---------------------------------------------------------------------------

describe('SessionsResource.get()', () => {
  let resource: SessionsResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('fetches a session from the correct endpoint path', async () => {
    const session = createMockSession();
    mockGet.mockResolvedValueOnce(session);

    await resource.get('ses_roxy_holdovers_20260410_1915');

    expect(mockGet).toHaveBeenCalledWith(
      '/ocapi/v1/sessions/ses_roxy_holdovers_20260410_1915',
    );
  });

  it('returns a session with the correct shape', async () => {
    const expected = createMockSession({
      filmTitle: 'Anatomy of a Fall',
      format: '2D',
      priceFrom: 21.00,
      currency: 'NZD',
    });
    mockGet.mockResolvedValueOnce(expected);

    const result = await resource.get(expected.id);

    expect(result.filmTitle).toBe('Anatomy of a Fall');
    expect(result.format).toBe('2D');
    expect(result.priceFrom).toBe(21.00);
    expect(result.currency).toBe('NZD');
  });

  it('returns bookability flags from the API response', async () => {
    const soldOut = createMockSession({
      isBookable: false,
      isSoldOut: true,
      seatsAvailable: 0,
    });
    mockGet.mockResolvedValueOnce(soldOut);

    const result = await resource.get(soldOut.id);

    expect(result.isBookable).toBe(false);
    expect(result.isSoldOut).toBe(true);
    expect(result.seatsAvailable).toBe(0);
  });

  it('returns optional attributes map from the session', async () => {
    const session = createMockSession({
      attributes: { subtitles: 'English', audio: 'English', hearing_loop: 'true' },
    });
    mockGet.mockResolvedValueOnce(session);

    const result = await resource.get(session.id);

    expect(result.attributes.subtitles).toBe('English');
    expect(result.attributes.hearing_loop).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// availability() — seat map retrieval
// ---------------------------------------------------------------------------

describe('SessionsResource.availability()', () => {
  let resource: SessionsResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('fetches from the correct seat-plan endpoint path', async () => {
    mockGet.mockResolvedValueOnce(createMockSeatAvailability());

    await resource.availability('ses_roxy_holdovers_20260410_1915');

    expect(mockGet).toHaveBeenCalledWith(
      '/ocapi/v1/sessions/ses_roxy_holdovers_20260410_1915/seat-plan',
    );
  });

  it('returns the complete seat map with correct counts', async () => {
    mockGet.mockResolvedValueOnce(
      createMockSeatAvailability({ availableCount: 74, totalCount: 120 }),
    );

    const result = await resource.availability('ses_roxy_holdovers_20260410_1915');

    expect(result.availableCount).toBe(74);
    expect(result.totalCount).toBe(120);
    expect(result.screenName).toBe('Screen 3');
  });

  it('returns individual seat records with position and status', async () => {
    mockGet.mockResolvedValueOnce(createMockSeatAvailability());

    const result = await resource.availability('ses_roxy_holdovers_20260410_1915');

    const seatH7 = result.seats.find(s => s.id === 'H7');
    expect(seatH7).toBeDefined();
    expect(seatH7?.row).toBe('H');
    expect(seatH7?.number).toBe(7);
    expect(seatH7?.status).toBe('available');
    expect(seatH7?.isAccessible).toBe(false);
  });

  it('identifies accessible (wheelchair) seats correctly', async () => {
    mockGet.mockResolvedValueOnce(createMockSeatAvailability());

    const result = await resource.availability('ses_roxy_holdovers_20260410_1915');

    const wheelchairSeats = result.seats.filter(s => s.status === 'wheelchair');
    expect(wheelchairSeats).toHaveLength(1);
    expect(wheelchairSeats[0].isAccessible).toBe(true);
    expect(wheelchairSeats[0].id).toBe('A1');
  });

  it('distinguishes available from taken seats', async () => {
    mockGet.mockResolvedValueOnce(createMockSeatAvailability());

    const result = await resource.availability('ses_roxy_holdovers_20260410_1915');

    const available = result.seats.filter(s => s.status === 'available');
    const taken = result.seats.filter(s => s.status === 'taken');
    expect(available).toHaveLength(2);
    expect(taken).toHaveLength(1);
  });

  it('returns screen orientation for the auditorium renderer', async () => {
    mockGet.mockResolvedValueOnce(createMockSeatAvailability({ screenPosition: 'top' }));

    const result = await resource.availability('ses_roxy_holdovers_20260410_1915');

    expect(result.screenPosition).toBe('top');
    expect(result.rowCount).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// listAll() — async generator auto-pagination
// ---------------------------------------------------------------------------

describe('SessionsResource.listAll()', () => {
  let resource: SessionsResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('yields all sessions from a single page', async () => {
    const sessions = [
      createMockSession({ id: 'ses_001' }),
      createMockSession({ id: 'ses_002', filmTitle: 'Perfect Days' }),
    ];
    mockGet.mockResolvedValueOnce(
      createMockSessionListResponse(sessions, { total: 2, hasMore: false }),
    );

    const collected: Session[] = [];
    for await (const session of resource.listAll()) {
      collected.push(session);
    }

    expect(collected).toHaveLength(2);
    expect(collected[0].id).toBe('ses_001');
    expect(collected[1].filmTitle).toBe('Perfect Days');
    expect(mockGet).toHaveBeenCalledOnce();
  });

  it('auto-fetches the next page when hasMore is true', async () => {
    const page1 = [createMockSession({ id: 'ses_p1_001' }), createMockSession({ id: 'ses_p1_002' })];
    const page2 = [createMockSession({ id: 'ses_p2_001' })];

    mockGet
      .mockResolvedValueOnce(
        createMockSessionListResponse(page1, { total: 3, hasMore: true, nextOffset: 2 }),
      )
      .mockResolvedValueOnce(
        createMockSessionListResponse(page2, { total: 3, hasMore: false }),
      );

    const collected: Session[] = [];
    for await (const session of resource.listAll()) {
      collected.push(session);
    }

    expect(collected).toHaveLength(3);
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('passes the siteId filter on every page request', async () => {
    const page1 = [createMockSession({ id: 'ses_emb_001' })];
    mockGet.mockResolvedValueOnce(
      createMockSessionListResponse(page1, { hasMore: false }),
    );

    const collected: Session[] = [];
    for await (const session of resource.listAll({ siteId: 'site_embassy_wellington' })) {
      collected.push(session);
    }

    expect(collected).toHaveLength(1);
    expect(mockGet).toHaveBeenCalledWith(
      '/ocapi/v1/sessions',
      expect.objectContaining({ params: expect.objectContaining({ siteId: 'site_embassy_wellington' }) }),
    );
  });

  it('uses the provided pageSize when fetching pages', async () => {
    mockGet.mockResolvedValueOnce(
      createMockSessionListResponse([createMockSession()], { hasMore: false }),
    );

    const collected: Session[] = [];
    for await (const session of resource.listAll({}, 25)) {
      collected.push(session);
    }

    expect(collected).toHaveLength(1);
    expect(mockGet).toHaveBeenCalledWith(
      '/ocapi/v1/sessions',
      expect.objectContaining({ params: expect.objectContaining({ limit: 25, offset: 0 }) }),
    );
  });

  it('handles an empty first page without fetching more', async () => {
    mockGet.mockResolvedValueOnce(
      createMockSessionListResponse([], { total: 0, hasMore: false }),
    );

    const collected: Session[] = [];
    for await (const session of resource.listAll()) {
      collected.push(session);
    }

    expect(collected).toHaveLength(0);
    expect(mockGet).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Zod validation — malformed response rejection
// ---------------------------------------------------------------------------

describe('SessionsResource — Zod schema validation', () => {
  let resource: SessionsResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('rejects a list response missing the sessions array', async () => {
    mockGet.mockResolvedValueOnce({ total: 0, hasMore: false });

    await expect(resource.list()).rejects.toThrow();
  });

  it('rejects a session with an invalid format enum value', async () => {
    const malformed = createMockSession({ format: 'VR' as never });
    mockGet.mockResolvedValueOnce(malformed);

    await expect(resource.get(malformed.id)).rejects.toThrow();
  });

  it('rejects a session where seatsAvailable is negative', async () => {
    const malformed = createMockSession({ seatsAvailable: -5 });
    mockGet.mockResolvedValueOnce(malformed);

    await expect(resource.get(malformed.id)).rejects.toThrow();
  });

  it('rejects an availability response with an invalid seat status', async () => {
    const malformed = createMockSeatAvailability({
      seats: [
        { id: 'Z9', row: 'Z', number: 9, status: 'invisible' as never, x: 0, y: 0, isAccessible: false },
      ],
    });
    mockGet.mockResolvedValueOnce(malformed);

    await expect(resource.availability('ses_roxy_holdovers_20260410_1915')).rejects.toThrow();
  });

  it('rejects a list response where a session has a missing required field', async () => {
    const incomplete = { ...createMockSession() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (incomplete as any).filmTitle;
    mockGet.mockResolvedValueOnce(createMockSessionListResponse([incomplete as Session]));

    await expect(resource.list()).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Error propagation — HTTP errors surface from resource methods
// ---------------------------------------------------------------------------

describe('SessionsResource — error propagation', () => {
  let resource: SessionsResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('propagates a not-found error from list()', async () => {
    const notFound = Object.assign(new Error('Session not found'), { statusCode: 404 });
    mockGet.mockRejectedValueOnce(notFound);

    await expect(resource.list({ siteId: 'site_nonexistent' })).rejects.toMatchObject({
      message: 'Session not found',
    });
  });

  it('propagates a not-found error from get()', async () => {
    const notFound = Object.assign(new Error('Session ses_expired not found'), { statusCode: 404 });
    mockGet.mockRejectedValueOnce(notFound);

    await expect(resource.get('ses_expired')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('propagates a network error from availability()', async () => {
    mockGet.mockRejectedValueOnce(new Error('fetch failed'));

    await expect(resource.availability('ses_roxy_holdovers_20260410_1915')).rejects.toThrow(
      'fetch failed',
    );
  });

  it('propagates a rate-limit error with retryAfter from listAll()', async () => {
    const rateLimitError = Object.assign(new Error('Rate limit exceeded'), {
      statusCode: 429,
      retryAfter: 30,
    });
    mockGet.mockRejectedValueOnce(rateLimitError);

    const gen = resource.listAll({ siteId: 'site_event_queen_street' });
    await expect(gen.next()).rejects.toMatchObject({ retryAfter: 30 });
  });
});

// ---------------------------------------------------------------------------
// listPaginated() — offset and cursor strategies
// ---------------------------------------------------------------------------

describe('SessionsResource.listPaginated()', () => {
  let resource: SessionsResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet } = createMockHTTPClient());
  });

  it('returns offset strategy when no cursor is provided', async () => {
    mockGet.mockResolvedValueOnce(
      createMockSessionListResponse([createMockSession()], { hasMore: false, nextOffset: undefined }),
    );

    const page = await resource.listPaginated({ siteId: 'site_roxy_wellington' }, { limit: 10 });

    expect(page.strategy).toBe('offset');
    expect(page.data).toHaveLength(1);
    expect(page.hasMore).toBe(false);
  });

  it('passes offset as query param in offset mode', async () => {
    mockGet.mockResolvedValueOnce(createMockSessionListResponse());

    await resource.listPaginated(undefined, { limit: 5, offset: 15 });

    expect(mockGet).toHaveBeenCalledWith(
      '/ocapi/v1/sessions',
      expect.objectContaining({ params: expect.objectContaining({ offset: 15, limit: 5 }) }),
    );
  });

  it('returns cursor strategy when a cursor is provided', async () => {
    mockGet.mockResolvedValueOnce(
      createMockSessionListResponse([createMockSession()], {
        hasMore: true,
        nextCursor: 'cur_next_page',
      }),
    );

    const page = await resource.listPaginated(undefined, { cursor: 'cur_page2' });

    expect(page.strategy).toBe('cursor');
    expect(page.nextCursor).toBe('cur_next_page');
    expect(page.hasMore).toBe(true);
  });

  it('passes cursor as query param and not offset when cursor mode', async () => {
    mockGet.mockResolvedValueOnce(createMockSessionListResponse());

    await resource.listPaginated({ filmId: 'film_holdovers_2023' }, { cursor: 'cur_abc123', limit: 20 });

    const [, callOptions] = mockGet.mock.calls[0];
    expect(callOptions.params).toMatchObject({ cursor: 'cur_abc123', limit: 20, filmId: 'film_holdovers_2023' });
    expect(callOptions.params.offset).toBeUndefined();
  });

  it('populates nextCursor from the API response envelope', async () => {
    mockGet.mockResolvedValueOnce(
      createMockSessionListResponse([createMockSession(), createMockSession({ id: 'ses_roxy_2' })], {
        hasMore: true,
        nextCursor: 'cur_page3_xyz',
      }),
    );

    const page = await resource.listPaginated();

    expect(page.nextCursor).toBe('cur_page3_xyz');
    expect(page.data).toHaveLength(2);
  });
});
