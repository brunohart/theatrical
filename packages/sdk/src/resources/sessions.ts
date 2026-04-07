import type { TheatricalHTTPClient } from '../http/client';
import type { Session, SessionFilter, SessionListResponse, SeatAvailability } from '../types/session';

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
   * @see https://developer.vista.co/digital-platform/sessions/
   */
  async list(filters?: SessionFilter): Promise<SessionListResponse> {
    return this.http.get<SessionListResponse>('/ocapi/v1/sessions', {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
  }

  /**
   * Get a single session by ID.
   */
  async get(sessionId: string): Promise<Session> {
    return this.http.get<Session>(`/ocapi/v1/sessions/${sessionId}`);
  }

  /**
   * Get seat availability for a session.
   * Returns the complete auditorium seat map with status for each seat.
   */
  async availability(sessionId: string): Promise<SeatAvailability> {
    return this.http.get<SeatAvailability>(`/ocapi/v1/sessions/${sessionId}/seat-plan`);
  }
}
