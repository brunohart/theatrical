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
    const data = this.lookup(path);
    if (data !== undefined) return data as T;
    // For order creation and similar POST endpoints, return a synthetic response
    if (path.includes('/orders')) {
      return {
        id: `ord_mock_${Date.now()}`,
        status: 'draft',
        tickets: [],
        items: [],
        pricing: { subtotal: 0, tax: 0, discounts: 0, total: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...((options?.body && typeof options.body === 'object') ? options.body : {}),
      } as T;
    }
    return {} as T;
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
