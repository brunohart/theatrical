import type { TheatricalConfig, TheatricalEnvironment } from './types/config';
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
const ENVIRONMENT_URLS: Record<TheatricalEnvironment, string> = {
  sandbox: 'https://api-sandbox.vista.co',
  staging: 'https://api-staging.vista.co',
  production: 'https://api.vista.co',
};

/**
 * TheatricalClient — the primary entry point for the Theatrical SDK.
 *
 * Provides type-safe access to cinema platform API resources through
 * lazily-initialised resource modules.
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
 *   date: '2026-04-08',
 * });
 * ```
 */
export class TheatricalClient {
  private readonly config: Required<TheatricalConfig>;
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

  constructor(config: TheatricalConfig) {
    this.config = {
      apiKey: config.apiKey,
      environment: config.environment ?? 'sandbox',
      baseUrl: config.baseUrl ?? ENVIRONMENT_URLS[config.environment ?? 'sandbox'],
      timeout: config.timeout ?? 30_000,
      maxRetries: config.maxRetries ?? 3,
      debug: config.debug ?? false,
    };

    const gasClient = new GASClient({
      apiKey: this.config.apiKey,
      authUrl: 'https://auth.moviexchange.com',
    });

    this.tokenManager = new TokenManager(gasClient);

    this.httpClient = new TheatricalHTTPClient({
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      tokenManager: this.tokenManager,
      debug: this.config.debug,
    });
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
