import type { TheatricalHTTPClient } from '../http/client';
import type { Session, SessionFilter, SessionListResponse, SeatAvailability } from '../types/session';
import { sessionSchema, sessionListResponseSchema, seatAvailabilitySchema } from '../types/session';

/**
 * Sessions resource — showtimes, availability, and seat maps.
 *
 * @example
 * ```typescript
 * const sessions = await client.sessions.list({
 *   siteId: 'roxy-wellington',
 *   date: '2026-04-08',
 * });
 *
 * const seats = await client.sessions.availability(sessions[0].id);
 * ```
 */
export class SessionsResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  /**
   * List sessions (showtimes) with optional filters.
   * Response is validated at runtime using Zod — malformed API responses throw a parse error.
   * @see https://developer.vista.co/digital-platform/sessions/
   */
  async list(filters?: SessionFilter): Promise<SessionListResponse> {
    const raw = await this.http.get<unknown>('/ocapi/v1/sessions', {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
    return sessionListResponseSchema.parse(raw);
  }

  /**
   * Get a single session by ID.
   * Response is validated at runtime using Zod.
   */
  async get(sessionId: string): Promise<Session> {
    const raw = await this.http.get<unknown>(`/ocapi/v1/sessions/${sessionId}`);
    return sessionSchema.parse(raw);
  }

  /**
   * Get seat availability for a session.
   * Returns the complete auditorium seat map with status for each seat.
   * Response is validated at runtime using Zod.
   */
  async availability(sessionId: string): Promise<SeatAvailability> {
    const raw = await this.http.get<unknown>(`/ocapi/v1/sessions/${sessionId}/seat-plan`);
    return seatAvailabilitySchema.parse(raw);
  }
}
