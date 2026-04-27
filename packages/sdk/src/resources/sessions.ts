import type { TheatricalHTTPClient } from '../http/client';
import type { Session, SessionFilter, SessionListResponse, SeatAvailability } from '../types/session';
import { sessionSchema, sessionListResponseSchema, seatAvailabilitySchema } from '../types/session';
import type { PaginatedResponse, PaginationParams } from '../types/pagination';

/** Default page size for auto-paginated iteration */
const DEFAULT_PAGE_SIZE = 50;

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
 *
 * @example Auto-paginate all sessions
 * ```typescript
 * for await (const session of client.sessions.listAll({ siteId: 'roxy-wellington' })) {
 *   console.log(session.filmTitle, session.startTime);
 * }
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
   * List sessions with explicit pagination control.
   *
   * Returns a normalised `PaginatedResponse<Session>` envelope that includes
   * the pagination strategy and cursor/offset for the next page.
   *
   * @param filters - Session filters (site, film, date range, etc.)
   * @param pagination - Page size and cursor/offset position
   * @returns A single page of sessions with pagination metadata
   *
   * @example
   * ```typescript
   * const page = await client.sessions.listPaginated(
   *   { siteId: 'roxy-wellington' },
   *   { limit: 25 },
   * );
   * console.log(page.data.length, page.hasMore);
   * ```
   */
  async listPaginated(
    filters?: SessionFilter,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Session>> {
    const limit = pagination?.limit ?? DEFAULT_PAGE_SIZE;

    const useCursor = pagination?.cursor !== undefined;

    const response = await this.list({
      ...filters,
      limit,
      ...(useCursor
        ? { cursor: pagination!.cursor }
        : { offset: pagination?.offset ?? 0 }),
    });

    return {
      data: response.sessions,
      total: response.total,
      hasMore: response.hasMore,
      nextCursor: response.nextCursor,
      nextOffset: response.nextOffset,
      strategy: useCursor ? 'cursor' : 'offset',
    };
  }

  /**
   * Async generator that automatically paginates through all matching sessions.
   *
   * Yields individual `Session` objects, fetching the next page transparently
   * when the current page is exhausted. Uses offset-based pagination internally
   * since Vista's session endpoints support numeric offsets.
   *
   * @param filters - Session filters (site, film, date range, etc.)
   * @param pageSize - Number of sessions to fetch per page (default: 50, max: 500)
   *
   * @example
   * ```typescript
   * const allSessions: Session[] = [];
   * for await (const session of client.sessions.listAll({ siteId: 'roxy-wellington' })) {
   *   allSessions.push(session);
   * }
   * ```
   *
   * @example Collect with early termination
   * ```typescript
   * for await (const session of client.sessions.listAll({ date: '2026-04-10' })) {
   *   if (session.isSoldOut) continue;
   *   console.log(`${session.filmTitle} — ${session.screenName} @ ${session.startTime}`);
   *   if (!session.isBookable) break; // stop on first unbookable
   * }
   * ```
   */
  async *listAll(
    filters?: SessionFilter,
    pageSize: number = DEFAULT_PAGE_SIZE,
  ): AsyncGenerator<Session, void, undefined> {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await this.list({
        ...filters,
        limit: pageSize,
        offset,
      });

      for (const session of response.sessions) {
        yield session;
      }

      hasMore = response.hasMore;
      offset = response.nextOffset ?? offset + response.sessions.length;
    }
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
