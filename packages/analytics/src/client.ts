import { horizonConfigSchema } from './types';
import type { HorizonConfig, HorizonQuery, HorizonQueryResult } from './types';

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * HTTP client for the Vista Horizon analytics platform.
 *
 * Handles authentication (API key or OAuth client credentials), request
 * construction, and response validation for all Horizon endpoints.
 *
 * @internal — use `HorizonClient` for the public-facing query interface.
 */
export class HorizonHTTPClient {
  private readonly config: Required<HorizonConfig>;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(config: HorizonConfig) {
    horizonConfigSchema.parse(config);
    this.config = {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      apiKey: '',
      clientId: '',
      clientSecret: '',
      ...config,
    };
  }

  private async getAuthHeader(): Promise<string> {
    if (this.config.authMode === 'api-key') {
      return `Bearer ${this.config.apiKey}`;
    }

    if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
      await this.refreshOAuthToken();
    }
    return `Bearer ${this.accessToken}`;
  }

  private async refreshOAuthToken(): Promise<void> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const res = await fetch(`${this.config.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!res.ok) {
      throw new Error(`Horizon OAuth token request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json() as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000 - 30_000;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const auth = await this.getAuthHeader();

    const res = await fetch(`${this.config.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
        'X-Horizon-Tenant': this.config.tenantId,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Horizon API error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }
}
