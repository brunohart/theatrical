import type { TheatricalHTTPClient } from '../http/client';
import type { Film, FilmDetail, FilmFilter, FilmSearchFilter } from '../types/film';
import { filmSchema, filmDetailSchema } from '../types/film';
import { z } from 'zod';

/**
 * Films resource — now showing, coming soon, search, and detailed film information.
 *
 * Provides access to the Vista OCAPI film catalogue. Supports browsing
 * current and upcoming releases, searching with rich filters (genre, format,
 * language, rating, runtime), and retrieving full film detail including
 * cast, crew, and ratings from multiple sources.
 */
export class FilmsResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  /**
   * Parse and validate a raw film response from the API.
   * Throws a ZodError if the response doesn't match the expected shape.
   */
  private parseFilm(data: unknown): Film {
    return filmSchema.parse(data) as Film;
  }

  /**
   * Parse and validate an array of films from the API.
   */
  private parseFilms(data: unknown): Film[] {
    return z.array(filmSchema).parse(data) as Film[];
  }

  /**
   * Parse and validate a full film detail response.
   */
  private parseFilmDetail(data: unknown): FilmDetail {
    return filmDetailSchema.parse(data) as FilmDetail;
  }

  /**
   * List films currently showing at a given site (or across all sites).
   *
   * @param filters - Optional site filter
   * @returns Array of films currently in cinemas
   */
  async nowShowing(filters?: { siteId?: string }): Promise<Film[]> {
    const data = await this.http.get<unknown>('/ocapi/v1/films/now-showing', {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
    return this.parseFilms(data);
  }

  /**
   * List films coming soon — announced but not yet in cinemas.
   *
   * @param filters - Optional site filter
   * @returns Array of upcoming films
   */
  async comingSoon(filters?: { siteId?: string }): Promise<Film[]> {
    const data = await this.http.get<unknown>('/ocapi/v1/films/coming-soon', {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
    return this.parseFilms(data);
  }

  /**
   * Retrieve a film by its unique identifier.
   *
   * @param filmId - The UUID of the film
   * @returns The base film record
   */
  async get(filmId: string): Promise<Film> {
    const data = await this.http.get<unknown>(`/ocapi/v1/films/${filmId}`);
    return this.parseFilm(data);
  }

  /**
   * Retrieve full film detail including cast, crew, ratings, formats, and languages.
   *
   * This returns the extended `FilmDetail` type with nested crew arrays,
   * multiple rating sources (IMDB, Rotten Tomatoes, Metacritic), available
   * screening formats, and language options.
   *
   * @param filmId - The UUID of the film
   * @returns Full film detail with cast, crew, and ratings
   */
  async getDetail(filmId: string): Promise<FilmDetail> {
    const data = await this.http.get<unknown>(`/ocapi/v1/films/${filmId}/detail`);
    return this.parseFilmDetail(data);
  }

  /**
   * Search films with basic filters.
   *
   * @param filters - Genre, query string, site, and showing status filters
   * @returns Array of matching films
   */
  async search(filters: FilmFilter): Promise<Film[]> {
    const data = await this.http.get<unknown>('/ocapi/v1/films', {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
    return this.parseFilms(data);
  }

  /**
   * Advanced film search with extended filters.
   *
   * Supports filtering by format (IMAX, 3D, Dolby Atmos), language,
   * rating classification, runtime range, release date range, and sorting.
   *
   * @param filters - Extended search filters including format, language, runtime range, sorting
   * @returns Array of matching films
   */
  async advancedSearch(filters: FilmSearchFilter): Promise<Film[]> {
    const params: Record<string, string> = {};

    if (filters.siteId) params.siteId = filters.siteId;
    if (filters.genre) params.genre = filters.genre;
    if (filters.query) params.query = filters.query;
    if (filters.nowShowing !== undefined) params.nowShowing = String(filters.nowShowing);
    if (filters.comingSoon !== undefined) params.comingSoon = String(filters.comingSoon);
    if (filters.limit !== undefined) params.limit = String(filters.limit);
    if (filters.offset !== undefined) params.offset = String(filters.offset);
    if (filters.ratingClassification) params.ratingClassification = filters.ratingClassification;
    if (filters.format) params.format = filters.format;
    if (filters.language) params.language = filters.language;
    if (filters.releaseDateFrom) params.releaseDateFrom = filters.releaseDateFrom;
    if (filters.releaseDateTo) params.releaseDateTo = filters.releaseDateTo;
    if (filters.minRuntime !== undefined) params.minRuntime = String(filters.minRuntime);
    if (filters.maxRuntime !== undefined) params.maxRuntime = String(filters.maxRuntime);
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    const data = await this.http.get<unknown>('/ocapi/v1/films/search', { params });
    return this.parseFilms(data);
  }
}
