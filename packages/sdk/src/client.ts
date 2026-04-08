import type { TheatricalConfig } from './types/config';
import type { ValidatedTheatricalConfig } from './types/config';
import { validateConfig } from './utils/validate-config';
import { SessionsResource } from './resources/sessions';
import { SitesResource } from './resources/sites';
import { FilmsResource } from './resources/films';
import { OrdersResource } from './resources/orders';
import { LoyaltyResource } from './resources/loyalty';
import { SubscriptionsResource } from './resources/subscriptions';
import { PricingResource } from './resources/pricing';
import { FoodAndBeverageResource } from './resources/food-and-beverage';
import { TheatricalHTTPClient } from './http/client';
import { GASClient } from './auth/gas-client';
import { TokenManager } from './auth/token-manager';

/**
 * API base URLs for each Vista environment
 */
const ENVIRONMENT_URLS: Record<string, string> = {
  sandbox: 'https://api-sandbox.vista.co',
  staging: 'https://api-staging.vista.co',
  production: 'https://api.vista.co',
};

/** @internal Singleton instance used by TheatricalClient.global() */
let _globalInstance: TheatricalClient | undefined;

/**
 * TheatricalClient — the primary entry point for the Theatrical SDK.
 *
 * Provides type-safe access to cinema platform API resources through
 * lazily-initialised resource modules.
 *
 * Configuration is validated at construction time using Zod schemas.
 * Invalid configs throw a `ValidationError` immediately so misconfigurations
 * surface at startup rather than at runtime.
 *
 * @example
 * ```typescript
 * const client = new TheatricalClient({
 *   apiKey: 'your-api-key',
 *   environment: 'sandbox',
 * });
 *
 * const sessions = await client.sessions.list({
 *   siteId: 'roxy-wellington',
 *   date: '2026-04-09',
 * });
 * ```
 *
 * @example Static factory
 * ```typescript
 * const client = TheatricalClient.create({
 *   apiKey: process.env.THEATRICAL_API_KEY!,
 *   environment: 'production',
 * });
 * ```
 *
 * @example Singleton
 * ```typescript
 * TheatricalClient.setGlobal({ apiKey: 'key', environment: 'sandbox' });
 * const client = TheatricalClient.global();
 * ```
 */
export class TheatricalClient {
  private readonly config: ValidatedTheatricalConfig;
  private readonly httpClient: TheatricalHTTPClient;
  private readonly tokenManager: TokenManager;

  // Lazily initialised resource modules
  private _sessions?: SessionsResource;
  private _sites?: SitesResource;
  private _films?: FilmsResource;
  private _orders?: OrdersResource;
  private _loyalty?: LoyaltyResource;
  private _subscriptions?: SubscriptionsResource;
  private _pricing?: PricingResource;
  private _fnb?: FoodAndBeverageResource;

  /**
   * Constructs a TheatricalClient with validated configuration.
   *
   * Throws `ValidationError` immediately if config is invalid.
   *
   * @param config - SDK configuration
   * @throws {ValidationError} if config fails schema validation
   */
  constructor(config: TheatricalConfig) {
    this.config = validateConfig(config);

    const baseUrl = this.config.baseUrl ?? ENVIRONMENT_URLS[this.config.environment];

    const gasClient = new GASClient({
      apiKey: this.config.apiKey,
      authUrl: 'https://auth.moviexchange.com',
    });

    this.tokenManager = new TokenManager(gasClient);

    this.httpClient = new TheatricalHTTPClient({
      baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      tokenManager: this.tokenManager,
      debug: this.config.debug,
    });
  }

  /**
   * Creates a new TheatricalClient instance.
   *
   * Equivalent to `new TheatricalClient(config)` but provided as a static
   * factory for clarity in configuration-heavy setups.
   *
   * @param config - SDK configuration
   * @returns New TheatricalClient instance
   * @throws {ValidationError} if config fails schema validation
   *
   * @example
   * ```typescript
   * const client = TheatricalClient.create({
   *   apiKey: process.env.THEATRICAL_API_KEY!,
   *   environment: 'production',
   *   timeout: 15_000,
   * });
   * ```
   */
  static create(config: TheatricalConfig): TheatricalClient {
    return new TheatricalClient(config);
  }

  /**
   * Returns the global singleton TheatricalClient instance.
   *
   * Throws if no global instance has been configured via `setGlobal()`.
   * Useful for applications that initialise the client once at startup and
   * access it throughout without passing the instance around.
   *
   * @returns The global TheatricalClient instance
   * @throws {Error} if setGlobal() has not been called
   *
   * @example
   * ```typescript
   * // At startup:
   * TheatricalClient.setGlobal({ apiKey: 'key', environment: 'production' });
   *
   * // Anywhere in your app:
   * const client = TheatricalClient.global();
   * const films = await client.films.nowShowing({ siteId: 'roxy-wellington' });
   * ```
   */
  static global(): TheatricalClient {
    if (!_globalInstance) {
      throw new Error(
        'No global TheatricalClient configured. Call TheatricalClient.setGlobal(config) first.'
      );
    }
    return _globalInstance;
  }

  /**
   * Configures the global singleton TheatricalClient instance.
   *
   * Replaces any existing global instance. Subsequent calls to
   * `TheatricalClient.global()` will return this instance.
   *
   * @param config - SDK configuration
   * @throws {ValidationError} if config fails schema validation
   *
   * @example
   * ```typescript
   * TheatricalClient.setGlobal({
   *   apiKey: process.env.THEATRICAL_API_KEY!,
   *   environment: 'production',
   * });
   * ```
   */
  static setGlobal(config: TheatricalConfig): void {
    _globalInstance = new TheatricalClient(config);
  }

  /**
   * Resets the global singleton instance.
   *
   * Primarily intended for testing — allows tests to start with a clean slate.
   *
   * @example
   * ```typescript
   * afterEach(() => {
   *   TheatricalClient.resetGlobal();
   * });
   * ```
   */
  static resetGlobal(): void {
    _globalInstance = undefined;
  }

  /** Sessions — showtimes, availability, seat maps */
  get sessions(): SessionsResource {
    if (!this._sessions) {
      this._sessions = new SessionsResource(this.httpClient);
    }
    return this._sessions;
  }

  /** Sites — cinema locations, screens, configurations */
  get sites(): SitesResource {
    if (!this._sites) {
      this._sites = new SitesResource(this.httpClient);
    }
    return this._sites;
  }

  /** Films — now showing, coming soon, search */
  get films(): FilmsResource {
    if (!this._films) {
      this._films = new FilmsResource(this.httpClient);
    }
    return this._films;
  }

  /** Orders — booking lifecycle: create, confirm, cancel */
  get orders(): OrdersResource {
    if (!this._orders) {
      this._orders = new OrdersResource(this.httpClient);
    }
    return this._orders;
  }

  /** Loyalty — member management, points, tiers */
  get loyalty(): LoyaltyResource {
    if (!this._loyalty) {
      this._loyalty = new LoyaltyResource(this.httpClient);
    }
    return this._loyalty;
  }

  /** Subscriptions — plans, member subscriptions */
  get subscriptions(): SubscriptionsResource {
    if (!this._subscriptions) {
      this._subscriptions = new SubscriptionsResource(this.httpClient);
    }
    return this._subscriptions;
  }

  /** Pricing — ticket types, price calculations, tax handling */
  get pricing(): PricingResource {
    if (!this._pricing) {
      this._pricing = new PricingResource(this.httpClient);
    }
    return this._pricing;
  }

  /** Food & Beverage — menus, ordering, dietary information */
  get fnb(): FoodAndBeverageResource {
    if (!this._fnb) {
      this._fnb = new FoodAndBeverageResource(this.httpClient);
    }
    return this._fnb;
  }
}
