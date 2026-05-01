import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilmsResource } from '../../src/resources/films';
import type { TheatricalHTTPClient } from '../../src/http/client';
import type { Film, FilmDetail } from '../../src/types/film';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockHTTPClient(): {
  resource: FilmsResource;
  mockGet: ReturnType<typeof vi.fn>;
} {
  const mockGet = vi.fn();
  const http = { get: mockGet } as unknown as TheatricalHTTPClient;
  return { resource: new FilmsResource(http), mockGet };
}

// ---------------------------------------------------------------------------
// Fixture factories — realistic NZ cinema data
// ---------------------------------------------------------------------------

/** The Holdovers — Alexander Payne's boarding school dramedy, NZ theatrical release. */
function createHoldoversFilm(overrides: Partial<Film> = {}): Film {
  return {
    id: 'film_holdovers_2024',
    title: 'The Holdovers',
    synopsis: 'A cranky history teacher at a remote New England prep school is forced to remain on campus over Christmas break to babysit a handful of students with nowhere to go.',
    genres: ['comedy', 'drama'],
    runtime: 133,
    rating: { classification: 'M', description: 'Offensive language, sexual references & drug use' },
    releaseDate: '2024-01-25',
    posterUrl: 'https://cdn.vista.co/films/holdovers/poster.jpg',
    trailerUrl: 'https://cdn.vista.co/films/holdovers/trailer.mp4',
    cast: [
      { name: 'Paul Giamatti', role: 'Paul Hunham' },
      { name: 'Da\'Vine Joy Randolph', role: 'Mary Lamb' },
      { name: 'Dominic Sessa', role: 'Angus Tully' },
    ],
    director: 'Alexander Payne',
    distributor: 'Focus Features',
    isNowShowing: true,
    isComingSoon: false,
    ...overrides,
  };
}

/** Boy — Taika Waititi's NZ classic. */
function createBoyFilm(overrides: Partial<Film> = {}): Film {
  return {
    id: 'film_boy_2010',
    title: 'Boy',
    synopsis: 'Year: 1984. Alamein, aka Boy, is an 11-year-old who lives on a farm in Waihau Bay with his nan, his younger brother Rocky, and a tribe of cousins.',
    genres: ['comedy', 'drama'],
    runtime: 87,
    rating: { classification: 'PG', description: 'Low-level offensive language' },
    releaseDate: '2010-03-25',
    posterUrl: 'https://cdn.vista.co/films/boy/poster.jpg',
    cast: [
      { name: 'James Rolleston', role: 'Boy' },
      { name: 'Taika Waititi', role: 'Alamein' },
    ],
    director: 'Taika Waititi',
    distributor: 'Transmission Films',
    isNowShowing: false,
    isComingSoon: false,
    ...overrides,
  };
}

/** Whale Rider — a coming-soon re-release for its anniversary. */
function createWhaleRiderFilm(overrides: Partial<Film> = {}): Film {
  return {
    id: 'film_whale_rider_2026',
    title: 'Whale Rider',
    synopsis: 'A Maori girl fulfils a destiny set by her ancestors when she unexpectedly becomes the leader of her people.',
    genres: ['drama', 'family'],
    runtime: 101,
    rating: { classification: 'PG', description: 'Some mature themes' },
    releaseDate: '2026-06-15',
    cast: [
      { name: 'Keisha Castle-Hughes', role: 'Paikea' },
      { name: 'Rawiri Paratene', role: 'Koro' },
    ],
    director: 'Niki Caro',
    distributor: 'South Pacific Pictures',
    isNowShowing: false,
    isComingSoon: true,
    ...overrides,
  };
}

/** Full detail for The Holdovers — with crew, ratings, formats, languages. */
function createHoldoversDetail(overrides: Partial<FilmDetail> = {}): FilmDetail {
  return {
    ...createHoldoversFilm(),
    crew: [
      { name: 'Alexander Payne', department: 'Directing', job: 'Director' },
      { name: 'David Hemingson', department: 'Writing', job: 'Screenwriter' },
      { name: 'Eigil Bryld', department: 'Camera', job: 'Director of Photography' },
      { name: 'Mark Johnson', department: 'Production', job: 'Producer' },
    ],
    ratings: [
      { source: 'IMDB', score: '7.9', outOf: '10' },
      { source: 'Rotten Tomatoes', score: '96%' },
      { source: 'Metacritic', score: '82', outOf: '100' },
    ],
    formats: ['2D', 'Dolby Atmos'],
    languages: ['en'],
    originalTitle: 'The Holdovers',
    productionCountries: ['US'],
    budget: 20000000,
    boxOffice: 42600000,
    website: 'https://www.focusfeatures.com/the-holdovers',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests — film list and filter
// ---------------------------------------------------------------------------

describe('FilmsResource', () => {
  let resource: FilmsResource;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const mock = createMockHTTPClient();
    resource = mock.resource;
    mockGet = mock.mockGet;
  });

  describe('nowShowing', () => {
    it('return a list of films currently in cinemas', async () => {
      const films = [createHoldoversFilm(), createBoyFilm({ isNowShowing: true })];
      mockGet.mockResolvedValueOnce(films);

      const result = await resource.nowShowing();

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('The Holdovers');
      expect(result[1].title).toBe('Boy');
      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films/now-showing', { params: undefined });
    });

    it('pass site filter to API', async () => {
      mockGet.mockResolvedValueOnce([createHoldoversFilm()]);

      await resource.nowShowing({ siteId: 'site_roxy_wellington' });

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films/now-showing', {
        params: { siteId: 'site_roxy_wellington' },
      });
    });
  });

  describe('comingSoon', () => {
    it('return upcoming films', async () => {
      mockGet.mockResolvedValueOnce([createWhaleRiderFilm()]);

      const result = await resource.comingSoon();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Whale Rider');
      expect(result[0].isComingSoon).toBe(true);
      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films/coming-soon', { params: undefined });
    });

    it('passes site filter to comingSoon endpoint', async () => {
      mockGet.mockResolvedValueOnce([createWhaleRiderFilm()]);

      await resource.comingSoon({ siteId: 'site_embassy_wellington' });

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films/coming-soon', {
        params: { siteId: 'site_embassy_wellington' },
      });
    });
  });

  describe('get', () => {
    it('retrieve a film by ID', async () => {
      mockGet.mockResolvedValueOnce(createHoldoversFilm());

      const result = await resource.get('film_holdovers_2024');

      expect(result.id).toBe('film_holdovers_2024');
      expect(result.director).toBe('Alexander Payne');
      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films/film_holdovers_2024');
    });
  });

  describe('getDetail', () => {
    it('return full film detail with cast, crew, and ratings', async () => {
      mockGet.mockResolvedValueOnce(createHoldoversDetail());

      const result = await resource.getDetail('film_holdovers_2024');

      expect(result.title).toBe('The Holdovers');
      expect(result.crew).toHaveLength(4);
      expect(result.crew[0].job).toBe('Director');
      expect(result.ratings).toHaveLength(3);
      expect(result.ratings[0].source).toBe('IMDB');
      expect(result.formats).toContain('Dolby Atmos');
      expect(result.languages).toContain('en');
      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films/film_holdovers_2024/detail');
    });

    it('include production metadata in detail response', async () => {
      mockGet.mockResolvedValueOnce(createHoldoversDetail());

      const result = await resource.getDetail('film_holdovers_2024');

      expect(result.budget).toBe(20000000);
      expect(result.boxOffice).toBe(42600000);
      expect(result.productionCountries).toContain('US');
      expect(result.website).toBe('https://www.focusfeatures.com/the-holdovers');
    });
  });

  describe('search', () => {
    it('search with basic genre filter', async () => {
      mockGet.mockResolvedValueOnce([createHoldoversFilm(), createBoyFilm()]);

      const result = await resource.search({ genre: 'drama' });

      expect(result).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films', {
        params: { genre: 'drama' },
      });
    });

    it('search with text query', async () => {
      mockGet.mockResolvedValueOnce([createHoldoversFilm()]);

      const result = await resource.search({ query: 'boarding school' });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('The Holdovers');
      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films', {
        params: { query: 'boarding school' },
      });
    });

    it('filter by now showing status', async () => {
      mockGet.mockResolvedValueOnce([createHoldoversFilm()]);

      await resource.search({ nowShowing: true });

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films', {
        params: { nowShowing: true },
      });
    });
  });

  describe('advancedSearch', () => {
    it('pass format filter to API', async () => {
      mockGet.mockResolvedValueOnce([createHoldoversFilm()]);

      await resource.advancedSearch({ format: 'IMAX' });

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films/search', {
        params: expect.objectContaining({ format: 'IMAX' }),
      });
    });

    it('pass language filter to API', async () => {
      mockGet.mockResolvedValueOnce([]);

      await resource.advancedSearch({ language: 'mi' });

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films/search', {
        params: expect.objectContaining({ language: 'mi' }),
      });
    });

    it('pass runtime range filters', async () => {
      mockGet.mockResolvedValueOnce([createBoyFilm()]);

      await resource.advancedSearch({ minRuntime: 60, maxRuntime: 100 });

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films/search', {
        params: expect.objectContaining({ minRuntime: '60', maxRuntime: '100' }),
      });
    });

    it('pass sort parameters', async () => {
      mockGet.mockResolvedValueOnce([]);

      await resource.advancedSearch({ sortBy: 'releaseDate', sortOrder: 'desc' });

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films/search', {
        params: expect.objectContaining({ sortBy: 'releaseDate', sortOrder: 'desc' }),
      });
    });

    it('pass rating classification filter', async () => {
      mockGet.mockResolvedValueOnce([createBoyFilm(), createWhaleRiderFilm()]);

      await resource.advancedSearch({ ratingClassification: 'PG' });

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films/search', {
        params: expect.objectContaining({ ratingClassification: 'PG' }),
      });
    });

    it('pass date range filters', async () => {
      mockGet.mockResolvedValueOnce([createWhaleRiderFilm()]);

      await resource.advancedSearch({
        releaseDateFrom: '2026-01-01',
        releaseDateTo: '2026-12-31',
      });

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films/search', {
        params: expect.objectContaining({
          releaseDateFrom: '2026-01-01',
          releaseDateTo: '2026-12-31',
        }),
      });
    });

    it('combine multiple filters', async () => {
      mockGet.mockResolvedValueOnce([createHoldoversFilm()]);

      await resource.advancedSearch({
        genre: 'drama',
        format: 'Dolby Atmos',
        language: 'en',
        nowShowing: true,
        sortBy: 'popularity',
        sortOrder: 'desc',
        limit: 10,
      });

      expect(mockGet).toHaveBeenCalledWith('/ocapi/v1/films/search', {
        params: {
          genre: 'drama',
          format: 'Dolby Atmos',
          language: 'en',
          nowShowing: 'true',
          sortBy: 'popularity',
          sortOrder: 'desc',
          limit: '10',
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // Zod validation tests
  // -------------------------------------------------------------------------

  describe('Zod validation', () => {
    it('reject a film missing required fields', async () => {
      mockGet.mockResolvedValueOnce([{ id: 'film_broken', title: 'Missing Fields' }]);

      await expect(resource.nowShowing()).rejects.toThrow();
    });

    it('reject a detail response missing crew array', async () => {
      const { crew, ...incomplete } = createHoldoversDetail();
      mockGet.mockResolvedValueOnce(incomplete);

      await expect(resource.getDetail('film_holdovers_2024')).rejects.toThrow();
    });

    it('accept a valid film with optional fields omitted', async () => {
      const minimalFilm = createHoldoversFilm();
      delete minimalFilm.posterUrl;
      delete minimalFilm.trailerUrl;
      delete minimalFilm.distributor;
      mockGet.mockResolvedValueOnce([minimalFilm]);

      const result = await resource.nowShowing();

      expect(result).toHaveLength(1);
      expect(result[0].posterUrl).toBeUndefined();
    });

    it('accept a valid detail with optional production metadata omitted', async () => {
      const detail = createHoldoversDetail();
      delete detail.originalTitle;
      delete detail.productionCountries;
      delete detail.budget;
      delete detail.boxOffice;
      delete detail.website;
      mockGet.mockResolvedValueOnce(detail);

      const result = await resource.getDetail('film_holdovers_2024');

      expect(result.budget).toBeUndefined();
      expect(result.crew).toHaveLength(4);
    });
  });

  // -------------------------------------------------------------------------
  // Error propagation tests
  // -------------------------------------------------------------------------

  describe('error propagation', () => {
    it('propagate HTTP errors from get', async () => {
      mockGet.mockRejectedValueOnce(new Error('Not Found'));

      await expect(resource.get('film_nonexistent')).rejects.toThrow('Not Found');
    });

    it('propagate HTTP errors from nowShowing', async () => {
      mockGet.mockRejectedValueOnce(new Error('Service Unavailable'));

      await expect(resource.nowShowing()).rejects.toThrow('Service Unavailable');
    });

    it('propagate HTTP errors from advancedSearch', async () => {
      mockGet.mockRejectedValueOnce(new Error('Bad Request'));

      await expect(resource.advancedSearch({ genre: 'invalid' })).rejects.toThrow('Bad Request');
    });

    it('propagate HTTP errors from getDetail', async () => {
      mockGet.mockRejectedValueOnce(new Error('Internal Server Error'));

      await expect(resource.getDetail('film_broken')).rejects.toThrow('Internal Server Error');
    });
  });
});
