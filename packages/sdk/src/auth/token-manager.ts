import type { GASClient, GASToken } from './gas-client';

/**
 * Manages JWT token lifecycle — caching, refresh, and expiry detection.
 * Ensures API requests always have a valid token without redundant auth calls.
 */
export class TokenManager {
  private readonly gasClient: GASClient;
  private currentToken: GASToken | null = null;
  private refreshPromise: Promise<GASToken> | null = null;

  /** Buffer before expiry to trigger refresh (5 minutes) */
  private readonly expiryBuffer = 5 * 60 * 1000;

  constructor(gasClient: GASClient) {
    this.gasClient = gasClient;
  }

  /**
   * Get a valid access token, refreshing if necessary.
   * Deduplicates concurrent refresh requests.
   */
  async getToken(): Promise<string> {
    if (this.currentToken && !this.isExpired(this.currentToken)) {
      return this.currentToken.accessToken;
    }

    // Deduplicate concurrent refresh calls
    if (!this.refreshPromise) {
      this.refreshPromise = this.refresh();
    }

    try {
      const token = await this.refreshPromise;
      return token.accessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Force a token refresh regardless of current token state
   */
  async refresh(): Promise<GASToken> {
    const token = await this.gasClient.requestToken();
    this.currentToken = token;
    return token;
  }

  /**
   * Check if a token is expired or within the expiry buffer
   */
  private isExpired(token: GASToken): boolean {
    const expiresAt = token.issuedAt + token.expiresIn * 1000;
    return Date.now() >= expiresAt - this.expiryBuffer;
  }

  /**
   * Clear the current token (e.g., on 401 response)
   */
  invalidate(): void {
    this.currentToken = null;
  }
}
