/**
 * Client for Vista's Global Authentication Service (GAS)
 * Handles JWT token acquisition from auth.moviexchange.com
 */
export interface GASConfig {
  apiKey: string;
  authUrl: string;
}

export interface GASToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  issuedAt: number;
}

export class GASClient {
  private readonly config: GASConfig;

  constructor(config: GASConfig) {
    this.config = config;
  }

  /**
   * Request a new JWT token from the Global Authentication Service
   */
  async requestToken(): Promise<GASToken> {
    const response = await fetch(`${this.config.authUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        api_key: this.config.apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`GAS authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      accessToken: data.access_token as string,
      tokenType: (data.token_type as string) ?? 'Bearer',
      expiresIn: (data.expires_in as number) ?? 3600,
      issuedAt: Date.now(),
    };
  }
}
