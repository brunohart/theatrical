import { DEFAULT_MOCK_RESPONSES } from './fixtures';
import { NotFoundError } from '../errors';

/**
 * A lightweight mock HTTP adapter for offline development and testing.
 *
 * Replaces `TheatricalHTTPClient` inside a mock `TheatricalClient`.
 * Matches URL paths against a fixture map and returns pre-defined responses.
 *
 * @see TheatricalClient.createMock()
 */
export class MockHTTPAdapter {
  private readonly responses: Record<string, unknown>;

  constructor(overrides?: Record<string, unknown>) {
    this.responses = { ...DEFAULT_MOCK_RESPONSES, ...overrides };
  }

  /** Normalise a concrete path to a pattern key by replacing segments that look like IDs. */
  private matchPattern(path: string): string {
    // Strip query string
    const cleanPath = path.split('?')[0];
    // Replace ID-like segments (contain digits, dashes, underscores but not all alpha-slug)
    return cleanPath.replace(/\/([a-z_]+-[a-z_\d-]+|\d+)(?=\/|$)/gi, '/:id');
  }

  private lookup(path: string): unknown {
    // Try exact match first
    if (this.responses[path] !== undefined) return this.responses[path];
    // Try pattern match
    const pattern = this.matchPattern(path);
    if (this.responses[pattern] !== undefined) return this.responses[pattern];
    return undefined;
  }

  async get<T>(path: string): Promise<T> {
    const data = this.lookup(path);
    if (data === undefined) {
      throw new NotFoundError(`Mock: no fixture for GET ${path}`, path.split('/').pop() ?? path);
    }
    return data as T;
  }

  async post<T>(path: string, options?: { body?: unknown }): Promise<T> {
    // Order creation always gets a synthetic, schema-valid order built from
    // the request body — checked before fixtures so created orders echo the
    // caller's sessionId and tickets.
    if (path.split('?')[0].endsWith('/orders')) {
      return this.buildMockOrder(options?.body) as T;
    }
    const data = this.lookup(path);
    if (data !== undefined) return data as T;
    return {} as T;
  }

  /** Build an order response that satisfies `orderSchema` from a create-order request body. */
  private buildMockOrder(body: unknown): Record<string, unknown> {
    const input = (body && typeof body === 'object' ? body : {}) as {
      sessionId?: string;
      tickets?: Array<{ type?: string; seatId?: string }>;
      loyaltyMemberId?: string;
    };
    const prices: Record<string, number> = { adult: 18.5, child: 12.5, senior: 14.5, concession: 14 };
    const tickets = (input.tickets ?? []).map((t, i) => {
      const type = t.type ?? 'adult';
      const seatId = t.seatId ?? `seat_${i + 1}`;
      return {
        id: `tkt_mock_${i + 1}`,
        type,
        seatId,
        seatLabel: seatId.replace(/^seat_/i, '').toUpperCase(),
        price: prices[type] ?? prices.adult,
      };
    });
    const subtotal = tickets.reduce((sum, t) => sum + t.price, 0);
    const tax = Math.round(subtotal * 0.15 * 100) / 100; // NZ GST
    const now = new Date().toISOString();
    return {
      id: `ord_mock_${Date.now()}`,
      sessionId: input.sessionId ?? 'ses_mock_001',
      status: 'draft',
      tickets,
      items: [],
      subtotal,
      tax,
      discount: 0,
      total: Math.round((subtotal + tax) * 100) / 100,
      currency: 'NZD',
      ...(input.loyaltyMemberId ? { loyaltyMemberId: input.loyaltyMemberId } : {}),
      createdAt: now,
      updatedAt: now,
    };
  }

  async put<T>(path: string, options?: { body?: unknown }): Promise<T> {
    const data = this.lookup(path);
    if (data !== undefined) return data as T;
    return { ...((options?.body && typeof options.body === 'object') ? options.body : {}) } as T;
  }

  async delete<T>(path: string): Promise<T> {
    return {} as T;
  }
}
