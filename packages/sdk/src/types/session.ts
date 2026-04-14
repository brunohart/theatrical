import { z } from 'zod';

/**
 * Zod schema for presentation format — validates format strings from the API.
 */
export const sessionFormatSchema = z.enum([
  '2D',
  '3D',
  'IMAX',
  'IMAX3D',
  '4DX',
  'DOLBY_CINEMA',
  'SCREENX',
  'STANDARD',
]);

/**
 * Zod schema for seat status — validates seat availability state from the API.
 */
export const seatStatusSchema = z.enum([
  'available',
  'taken',
  'reserved',
  'wheelchair',
  'companion',
  'blocked',
]);

/**
 * A cinema session (showtime) — a specific screening of a film
 * at a specific site, screen, date, and time.
 */
export interface Session {
  /** Unique session identifier */
  id: string;

  /** Film being screened */
  filmId: string;

  /** Film title */
  filmTitle: string;

  /** Cinema site ID */
  siteId: string;

  /** Screen/auditorium identifier */
  screenId: string;

  /** Screen name (e.g., "Screen 3", "IMAX") */
  screenName: string;

  /** Session start time (ISO 8601) */
  startTime: string;

  /** Session end time (ISO 8601) */
  endTime: string;

  /** Presentation format */
  format: SessionFormat;

  /** Whether the session is bookable */
  isBookable: boolean;

  /** Whether the session is sold out */
  isSoldOut: boolean;

  /** Available seat count */
  seatsAvailable: number;

  /** Total seat capacity */
  seatsTotal: number;

  /** Minimum ticket price in local currency */
  priceFrom?: number;

  /** Currency code (ISO 4217) */
  currency?: string;

  /** Additional attributes */
  attributes: Record<string, string>;
}

/** Presentation format for a cinema session */
export type SessionFormat = z.infer<typeof sessionFormatSchema>;

/**
 * Zod schema for a cinema session (showtime).
 * Validates the shape and types of session objects returned from the API.
 */
export const sessionSchema = z.object({
  id: z.string(),
  filmId: z.string(),
  filmTitle: z.string(),
  siteId: z.string(),
  screenId: z.string(),
  screenName: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  format: sessionFormatSchema,
  isBookable: z.boolean(),
  isSoldOut: z.boolean(),
  seatsAvailable: z.number().int().nonnegative(),
  seatsTotal: z.number().int().positive(),
  priceFrom: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  attributes: z.record(z.string(), z.string()),
});

/**
 * Zod schema for session list filters.
 * Validates query parameters before they are sent to the API.
 */
export const sessionFilterSchema = z.object({
  siteId: z.string().optional(),
  filmId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  format: sessionFormatSchema.optional(),
  bookableOnly: z.boolean().optional(),
  limit: z.number().int().positive().max(500).optional(),
  offset: z.number().int().nonnegative().optional(),
});

/**
 * Zod schema for a paginated session list response.
 */
export const sessionListResponseSchema = z.object({
  sessions: z.array(sessionSchema),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  nextOffset: z.number().int().nonnegative().optional(),
});

export interface SessionFilter {
  /** Filter by cinema site */
  siteId?: string;

  /** Filter by film */
  filmId?: string;

  /** Filter by date (YYYY-MM-DD) */
  date?: string;

  /** Filter by date range start */
  dateFrom?: string;

  /** Filter by date range end */
  dateTo?: string;

  /** Filter by format */
  format?: SessionFormat;

  /** Only bookable sessions */
  bookableOnly?: boolean;

  /** Maximum results to return */
  limit?: number;

  /** Pagination cursor or offset */
  offset?: number;
}

export interface SessionListResponse {
  /** List of sessions matching the filter */
  sessions: Session[];

  /** Total count of matching sessions */
  total: number;

  /** Whether more results are available */
  hasMore: boolean;

  /** Cursor for next page */
  nextOffset?: number;
}

/** Seat status in an availability map */
export type SeatStatus = z.infer<typeof seatStatusSchema>;

/**
 * Zod schema for an individual seat in the auditorium.
 * Validates seat identifiers, position, and availability state.
 */
export const seatSchema = z.object({
  id: z.string(),
  row: z.string(),
  number: z.number().int().positive(),
  status: seatStatusSchema,
  x: z.number(),
  y: z.number(),
  type: z.string().optional(),
  isAccessible: z.boolean(),
});

/**
 * Zod schema for a seat availability response.
 * Validates the complete auditorium seat map for a session.
 */
export const seatAvailabilitySchema = z.object({
  sessionId: z.string(),
  screenName: z.string(),
  seats: z.array(seatSchema),
  rowCount: z.number().int().positive(),
  screenPosition: z.enum(['top', 'bottom']),
  availableCount: z.number().int().nonnegative(),
  totalCount: z.number().int().positive(),
});

/** Individual seat in the auditorium */
export interface Seat {
  /** Seat identifier */
  id: string;

  /** Row label (e.g., "H") */
  row: string;

  /** Seat number within the row */
  number: number;

  /** Current availability status */
  status: SeatStatus;

  /** X position for rendering */
  x: number;

  /** Y position for rendering */
  y: number;

  /** Seat type/category */
  type?: string;

  /** Whether this is an accessible seat */
  isAccessible: boolean;
}

/** Seat availability response for a session */
export interface SeatAvailability {
  /** Session ID */
  sessionId: string;

  /** Screen name */
  screenName: string;

  /** All seats in the auditorium */
  seats: Seat[];

  /** Number of rows */
  rowCount: number;

  /** Screen orientation hint for rendering */
  screenPosition: 'top' | 'bottom';

  /** Available seat count */
  availableCount: number;

  /** Total seat count */
  totalCount: number;
}
