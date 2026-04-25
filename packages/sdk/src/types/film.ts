import { z } from 'zod';

// ─── Enums & Primitives ────────────────────────────────────

/** Bounded genre enum. Unknown values from Vista's API indicate the schema needs updating. */
export const GENRES = ['action', 'adventure', 'animation', 'comedy', 'crime', 'documentary',
  'drama', 'family', 'fantasy', 'horror', 'musical', 'mystery', 'romance',
  'sci-fi', 'thriller', 'war', 'western'] as const;
export type Genre = typeof GENRES[number];

/** Bounded screening format enum. */
export const FILM_FORMATS = ['2D', '3D', 'IMAX', 'IMAX 3D', '4DX', 'Dolby Atmos', 'ScreenX'] as const;
export type FilmFormat = typeof FILM_FORMATS[number];

/** Bounded language code enum (BCP-47 subset for NZ market). */
export const FILM_LANGUAGES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'hi', 'te', 'mi'] as const;
export type FilmLanguage = typeof FILM_LANGUAGES[number];

// ─── Interfaces ────────────────────────────────────────────

/**
 * Age classification rating (e.g., NZ: G, PG, M, R13, R16, R18;
 * US: G, PG, PG-13, R, NC-17).
 */
export interface Rating {
  /** Rating classification code (e.g., 'M', 'PG-13', 'R16') */
  classification: string;
  /** Human-readable content advisory (e.g., 'Violence, offensive language') */
  description?: string;
}

/** An actor appearing in the film */
export interface CastMember {
  /** Full name of the actor */
  name: string;
  /** Character name or role description */
  role?: string;
}

/** A crew member (director, writer, cinematographer, etc.) */
export interface CrewMember {
  name: string;
  department: string;
  job: string;
}

/** A rating from a specific source (IMDB, Rotten Tomatoes, Metacritic, etc.) */
export interface FilmRating {
  source: string;
  score: string;
  outOf?: string;
}

/**
 * A film available for screening — core list representation.
 *
 * This is the shape returned by list endpoints (`nowShowing`, `comingSoon`, `search`).
 * For full detail including crew, ratings, and formats, use `FilmDetail` via `getDetail()`.
 */
export interface Film {
  /** Unique film identifier (UUID) */
  id: string;
  /** Display title in the local market */
  title: string;
  /** Marketing synopsis / plot summary */
  synopsis: string;
  /** Genre classifications */
  genres: Genre[];
  /** Runtime in minutes */
  runtime: number;
  /** Age classification rating */
  rating: Rating;
  /** Theatrical release date (ISO 8601 date string) */
  releaseDate: string;
  /** URL to the film's poster image */
  posterUrl?: string;
  /** URL to the official trailer */
  trailerUrl?: string;
  /** Principal cast members */
  cast: CastMember[];
  /** Primary director name */
  director: string;
  /** Distribution company */
  distributor?: string;
  /** Whether the film is currently screening */
  isNowShowing: boolean;
  /** Whether the film is announced but not yet released */
  isComingSoon: boolean;
}

/**
 * Full film detail — returned by `films.getDetail(id)`.
 *
 * Extends the base Film with crew, multiple rating sources,
 * available formats, language options, and production metadata.
 */
export interface FilmDetail extends Film {
  crew: CrewMember[];
  ratings: FilmRating[];
  formats: FilmFormat[];
  languages: FilmLanguage[];
  originalTitle?: string;
  productionCountries?: string[];
  budget?: number;
  boxOffice?: number;
  website?: string;
}

/** Basic filter options for film list and search endpoints */
export interface FilmFilter {
  /** Restrict results to a specific cinema site */
  siteId?: string;
  /** Filter by genre classification */
  genre?: Genre;
  /** Free-text search across title and synopsis */
  query?: string;
  /** Only return films currently screening */
  nowShowing?: boolean;
  /** Only return upcoming / announced films */
  comingSoon?: boolean;
  /** Maximum number of results to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Extended search filters for `films.advancedSearch()`.
 *
 * Adds format, language, rating, runtime range, date range, and sorting
 * on top of the base FilmFilter fields.
 */
export interface FilmSearchFilter extends FilmFilter {
  /** Filter by age rating classification (e.g., 'PG', 'M', 'R16') */
  ratingClassification?: string;
  /** Filter by screening format (e.g., 'IMAX', '3D', 'Dolby Atmos') */
  format?: FilmFormat;
  /** Filter by audio/subtitle language (ISO 639-1 code) */
  language?: FilmLanguage;
  /** Films released on or after this date (ISO 8601) */
  releaseDateFrom?: string;
  /** Films released on or before this date (ISO 8601) */
  releaseDateTo?: string;
  /** Minimum runtime in minutes */
  minRuntime?: number;
  /** Maximum runtime in minutes */
  maxRuntime?: number;
  /** Sort field */
  sortBy?: 'title' | 'releaseDate' | 'runtime' | 'popularity';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

// ─── Zod Schemas ───────────────────────────────────────────

export const genreSchema = z.enum(GENRES);

export const filmFormatSchema = z.enum(FILM_FORMATS);

export const filmLanguageSchema = z.enum(FILM_LANGUAGES);

export const ratingSchema = z.object({
  classification: z.string(),
  description: z.string().optional(),
});

export const castMemberSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
});

export const crewMemberSchema = z.object({
  name: z.string(),
  department: z.string(),
  job: z.string(),
});

export const filmRatingSchema = z.object({
  source: z.string(),
  score: z.string(),
  outOf: z.string().optional(),
});

export const filmSchema = z.object({
  id: z.string(),
  title: z.string(),
  synopsis: z.string(),
  genres: z.array(genreSchema),
  runtime: z.number().nonnegative(),
  rating: ratingSchema,
  releaseDate: z.string(),
  posterUrl: z.string().optional(),
  trailerUrl: z.string().optional(),
  cast: z.array(castMemberSchema),
  director: z.string(),
  distributor: z.string().optional(),
  isNowShowing: z.boolean(),
  isComingSoon: z.boolean(),
});

export const filmDetailSchema = filmSchema.extend({
  crew: z.array(crewMemberSchema),
  ratings: z.array(filmRatingSchema),
  formats: z.array(filmFormatSchema),
  languages: z.array(filmLanguageSchema),
  originalTitle: z.string().optional(),
  productionCountries: z.array(z.string()).optional(),
  budget: z.number().optional(),
  boxOffice: z.number().optional(),
  website: z.string().optional(),
});

export const filmSearchFilterSchema = z.object({
  siteId: z.string().optional(),
  genre: genreSchema.optional(),
  query: z.string().optional(),
  nowShowing: z.boolean().optional(),
  comingSoon: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  ratingClassification: z.string().optional(),
  format: filmFormatSchema.optional(),
  language: filmLanguageSchema.optional(),
  releaseDateFrom: z.string().optional(),
  releaseDateTo: z.string().optional(),
  minRuntime: z.number().nonnegative().optional(),
  maxRuntime: z.number().nonnegative().optional(),
  sortBy: z.enum(['title', 'releaseDate', 'runtime', 'popularity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
