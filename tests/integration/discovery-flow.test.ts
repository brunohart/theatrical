/**
 * Integration test: Discovery Flow
 *
 * Simulates the user journey of discovering what to watch:
 *   search films → pick a film → find sessions at a site → check availability → verify seats
 *
 * Mocks the HTTP layer but exercises the full SDK resource modules
 * (FilmsResource, SessionsResource, SitesResource) the way real
 * application code would use them.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FilmsResource } from '../../packages/sdk/src/resources/films';
import { SessionsResource } from '../../packages/sdk/src/resources/sessions';
import { SitesResource } from '../../packages/sdk/src/resources/sites';
import {
  createMockHTTP,
  asHTTPClient,
  ROXY_WELLINGTON,
  EMBASSY_WELLINGTON,
  ANORA,
  ANORA_DETAIL,
  THE_BRUTALIST,
  ANORA_SESSION_ROXY,
  BRUTALIST_SESSION_EMBASSY,
  ROXY_SCREEN1_SEATS,
  type MockHTTPClient,
} from './fixtures';

// ---------------------------------------------------------------------------
// Wiring — one mock HTTP client shared across all resources
// ---------------------------------------------------------------------------

let mock: MockHTTPClient;
let films: FilmsResource;
let sessions: SessionsResource;
let sites: SitesResource;

beforeEach(() => {
  mock = createMockHTTP();
  const http = asHTTPClient(mock);
  films = new FilmsResource(http);
  sessions = new SessionsResource(http);
  sites = new SitesResource(http);
});

// ---------------------------------------------------------------------------
// Phase 1 — Search films
// ---------------------------------------------------------------------------

describe('Discovery flow: search films', () => {
  it('finds films currently showing via nowShowing()', async () => {
    mock.get.mockResolvedValueOnce([ANORA, THE_BRUTALIST]);

    const results = await films.nowShowing({ siteId: 'site_roxy_wellington' });

    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('Anora');
    expect(results[1].title).toBe('The Brutalist');
    expect(mock.get).toHaveBeenCalledWith('/ocapi/v1/films/now-showing', {
      params: { siteId: 'site_roxy_wellington' },
    });
  });

  it('searches films by genre and query string', async () => {
    mock.get.mockResolvedValueOnce([ANORA]);

    const results = await films.search({
      genre: 'drama',
      query: 'Anora',
      nowShowing: true,
    });

    expect(results).toHaveLength(1);
    expect(results[0].director).toBe('Sean Baker');
    expect(results[0].runtime).toBe(139);
  });

  it('retrieves full film detail with cast, crew, and ratings', async () => {
    mock.get.mockResolvedValueOnce(ANORA_DETAIL);

    const detail = await films.getDetail('film_anora_2024');

    expect(detail.title).toBe('Anora');
    expect(detail.crew).toHaveLength(3);
    expect(detail.crew[0].job).toBe('Director');
    expect(detail.ratings).toHaveLength(3);
    expect(detail.ratings.find(r => r.source === 'Rotten Tomatoes')?.score).toBe('95');
    expect(detail.formats).toContain('2D');
    expect(mock.get).toHaveBeenCalledWith('/ocapi/v1/films/film_anora_2024/detail');
  });

  it('uses advanced search with format and runtime filters', async () => {
    mock.get.mockResolvedValueOnce([THE_BRUTALIST]);

    const results = await films.advancedSearch({
      format: '2D',
      minRuntime: 180,
      sortBy: 'runtime',
      sortOrder: 'desc',
    });

    expect(results).toHaveLength(1);
    expect(results[0].runtime).toBe(215);
  });
});

// ---------------------------------------------------------------------------
// Phase 2 — Find sessions at a site
// ---------------------------------------------------------------------------

describe('Discovery flow: find sessions at a site', () => {
  it('lists sessions at Roxy Wellington for a specific date', async () => {
    mock.get.mockResolvedValueOnce({
      sessions: [ANORA_SESSION_ROXY],
      total: 1,
      hasMore: false,
    });

    const response = await sessions.list({
      siteId: 'site_roxy_wellington',
      date: '2026-04-13',
    });

    expect(response.sessions).toHaveLength(1);
    expect(response.sessions[0].filmTitle).toBe('Anora');
    expect(response.sessions[0].screenName).toBe('Screen 1');
    expect(response.sessions[0].format).toBe('2D');
    expect(mock.get).toHaveBeenCalledWith('/ocapi/v1/sessions', {
      params: expect.objectContaining({
        siteId: 'site_roxy_wellington',
        date: '2026-04-13',
      }),
    });
  });

  it('filters sessions by film ID to find all screenings of a film', async () => {
    const embassySession = { ...ANORA_SESSION_ROXY, siteId: 'site_embassy_wellington', id: 'ses_embassy_anora' };
    mock.get.mockResolvedValueOnce({
      sessions: [ANORA_SESSION_ROXY, embassySession],
      total: 2,
      hasMore: false,
    });

    const response = await sessions.list({ filmId: 'film_anora_2024' });

    expect(response.sessions).toHaveLength(2);
    expect(response.sessions.map(s => s.siteId)).toContain('site_roxy_wellington');
    expect(response.sessions.map(s => s.siteId)).toContain('site_embassy_wellington');
  });

  it('gets a single session by ID', async () => {
    mock.get.mockResolvedValueOnce(ANORA_SESSION_ROXY);

    const session = await sessions.get('ses_roxy_anora_20260413_1930');

    expect(session.id).toBe('ses_roxy_anora_20260413_1930');
    expect(session.isBookable).toBe(true);
    expect(session.seatsAvailable).toBe(142);
    expect(session.priceFrom).toBe(19.50);
  });
});

// ---------------------------------------------------------------------------
// Phase 3 — Check seat availability
// ---------------------------------------------------------------------------

describe('Discovery flow: check seat availability', () => {
  it('retrieves the seat map for a session', async () => {
    mock.get.mockResolvedValueOnce(ROXY_SCREEN1_SEATS);

    const availability = await sessions.availability('ses_roxy_anora_20260413_1930');

    expect(availability.screenName).toBe('Screen 1');
    expect(availability.availableCount).toBe(142);
    expect(availability.totalCount).toBe(250);
    expect(availability.rowCount).toBe(12);
  });

  it('identifies available seats in the preferred rows', async () => {
    mock.get.mockResolvedValueOnce(ROXY_SCREEN1_SEATS);

    const availability = await sessions.availability('ses_roxy_anora_20260413_1930');

    const rowH = availability.seats.filter(s => s.row === 'H');
    const availableInH = rowH.filter(s => s.status === 'available');

    expect(rowH).toHaveLength(4);
    expect(availableInH).toHaveLength(3);
    expect(availableInH.map(s => s.id)).toEqual(['H7', 'H8', 'H9']);
  });

  it('finds accessible seats in the auditorium', async () => {
    mock.get.mockResolvedValueOnce(ROXY_SCREEN1_SEATS);

    const availability = await sessions.availability('ses_roxy_anora_20260413_1930');

    const accessibleSeats = availability.seats.filter(s => s.isAccessible);

    expect(accessibleSeats).toHaveLength(2);
    expect(accessibleSeats.map(s => s.status)).toEqual(
      expect.arrayContaining(['wheelchair', 'companion']),
    );
  });

  it('detects seats that are blocked or reserved', async () => {
    mock.get.mockResolvedValueOnce(ROXY_SCREEN1_SEATS);

    const availability = await sessions.availability('ses_roxy_anora_20260413_1930');

    const unavailable = availability.seats.filter(
      s => s.status === 'blocked' || s.status === 'reserved',
    );

    expect(unavailable).toHaveLength(2);
    expect(unavailable.map(s => s.id)).toEqual(expect.arrayContaining(['K5', 'L12']));
  });
});

// ---------------------------------------------------------------------------
// Phase 4 — Site discovery (geographic)
// ---------------------------------------------------------------------------

describe('Discovery flow: find nearby cinemas', () => {
  it('discovers cinemas near central Wellington', async () => {
    mock.get.mockResolvedValueOnce([ROXY_WELLINGTON, EMBASSY_WELLINGTON]);

    const nearby = await sites.nearby(-41.2865, 174.7762, 10);

    expect(nearby).toHaveLength(2);
    expect(nearby[0].name).toBe('Roxy Cinema');
    expect(nearby[1].name).toBe('Embassy Theatre');
    expect(mock.get).toHaveBeenCalledWith('/ocapi/v1/sites', {
      params: { latitude: -41.2865, longitude: 174.7762, radius: 10 },
    });
  });

  it('retrieves screen configurations for a site', async () => {
    mock.get.mockResolvedValueOnce(ROXY_WELLINGTON.screens);

    const screens = await sites.screens('site_roxy_wellington');

    expect(screens).toHaveLength(3);
    const mainScreen = screens.find(s => s.name === 'Screen 1');
    expect(mainScreen?.seatCount).toBe(250);
    expect(mainScreen?.formats).toContain('3D');
  });

  it('checks site amenities and booking configuration', async () => {
    mock.get.mockResolvedValueOnce(ROXY_WELLINGTON);

    const site = await sites.get('site_roxy_wellington');

    expect(site.config.loyaltyEnabled).toBe(true);
    expect(site.config.fnbEnabled).toBe(true);
    expect(site.config.maxTicketsPerOrder).toBe(10);
    expect(site.amenities).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'bar' })]),
    );
  });
});

// ---------------------------------------------------------------------------
// End-to-end discovery: full flow in sequence
// ---------------------------------------------------------------------------

describe('Discovery flow: full end-to-end journey', () => {
  it('searches films → picks film → finds sessions → checks seats', async () => {
    // Step 1: Search for drama films
    mock.get.mockResolvedValueOnce([ANORA, THE_BRUTALIST]);
    const searchResults = await films.nowShowing({ siteId: 'site_roxy_wellington' });
    expect(searchResults).toHaveLength(2);

    // Step 2: Pick Anora and get full detail
    const chosenFilm = searchResults.find(f => f.title === 'Anora')!;
    expect(chosenFilm).toBeDefined();

    mock.get.mockResolvedValueOnce(ANORA_DETAIL);
    const detail = await films.getDetail(chosenFilm.id);
    expect(detail.ratings[0].score).toBe('7.7');

    // Step 3: Find sessions at Roxy for this film
    mock.get.mockResolvedValueOnce({
      sessions: [ANORA_SESSION_ROXY],
      total: 1,
      hasMore: false,
    });
    const sessionResults = await sessions.list({
      siteId: 'site_roxy_wellington',
      filmId: chosenFilm.id,
      date: '2026-04-13',
    });
    expect(sessionResults.sessions).toHaveLength(1);
    expect(sessionResults.sessions[0].isBookable).toBe(true);

    // Step 4: Check seat availability
    mock.get.mockResolvedValueOnce(ROXY_SCREEN1_SEATS);
    const seatMap = await sessions.availability(sessionResults.sessions[0].id);
    const available = seatMap.seats.filter(s => s.status === 'available');
    expect(available.length).toBeGreaterThan(0);

    // Step 5: Verify two adjacent seats are available in row H
    const adjacentPair = available.filter(s => s.row === 'H' && (s.number === 7 || s.number === 8));
    expect(adjacentPair).toHaveLength(2);
  });
});
