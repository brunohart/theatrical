import { z } from 'zod';

// ─── Enums & Primitives ────────────────────────────────────

export type Genre = 'action' | 'adventure' | 'animation' | 'comedy' | 'crime' | 'documentary' |
  'drama' | 'family' | 'fantasy' | 'horror' | 'musical' | 'mystery' | 'romance' |
  'sci-fi' | 'thriller' | 'war' | 'western' | string;

/** Screening format a film is available in */
export type FilmFormat = '2D' | '3D' | 'IMAX' | 'IMAX 3D' | '4DX' | 'Dolby Atmos' | 'ScreenX' | string;

/** Language availability for a film */
export type FilmLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'zh' | 'hi' | 'te' | 'mi' | string;

// ─── Interfaces ────────────────────────────────────────────

export interface Rating {
  classification: string;
  description?: string;
}

export interface CastMember {
  name: string;
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

/** A film available for screening — core list representation */
export interface Film {
  id: string;
  title: string;
  synopsis: string;
  genres: Genre[];
  runtime: number;
  rating: Rating;
  releaseDate: string;
  posterUrl?: string;
  trailerUrl?: string;
  cast: CastMember[];
  director: string;
  distributor?: string;
  isNowShowing: boolean;
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

export interface FilmFilter {
  siteId?: string;
  genre?: Genre;
  query?: string;
  nowShowing?: boolean;
  comingSoon?: boolean;
  limit?: number;
  offset?: number;
}

/** Extended search filters for `films.search()` */
export interface FilmSearchFilter extends FilmFilter {
  ratingClassification?: string;
  format?: FilmFormat;
  language?: FilmLanguage;
  releaseDateFrom?: string;
  releaseDateTo?: string;
  minRuntime?: number;
  maxRuntime?: number;
  sortBy?: 'title' | 'releaseDate' | 'runtime' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

// ─── Zod Schemas ───────────────────────────────────────────

export const genreSchema = z.string();

export const filmFormatSchema = z.string();

export const filmLanguageSchema = z.string();

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
