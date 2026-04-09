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
