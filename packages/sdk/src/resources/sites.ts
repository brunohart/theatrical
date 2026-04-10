import type { TheatricalHTTPClient } from '../http/client';
import { siteSchema, siteListResponseSchema, screenSchema } from '../types/site';
import type { Site, Screen } from '../types/site';

/**
 * Sites resource — cinema locations, screens, and geographic discovery.
 *
 * @example
 * ```typescript
 * const sites = await client.sites.list();
 * const active = sites.filter(s => s.isActive);
 * ```
 *
 * @example Geographic discovery
 * ```typescript
 * // Find cinemas within 10 km of central Wellington
 * const nearby = await client.sites.nearby(-41.2865, 174.7762, 10);
 * ```
 */
export class SitesResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  /**
   * List all cinema sites, with optional search query or geographic filter.
   * Response is validated at runtime using Zod.
   *
   * @param filters - Optional filters: `query` (text search), `latitude`/`longitude`/`radius`
   * @returns Array of cinema sites
   *
   * @example
   * ```typescript
   * const sites = await client.sites.list({ query: 'Embassy' });
   * ```
   */
  async list(filters?: {
    query?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<Site[]> {
    const raw = await this.http.get<unknown>('/ocapi/v1/sites', {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
    return siteListResponseSchema.parse(raw);
  }

  /**
   * Get a single cinema site by ID.
   * Response is validated at runtime using Zod.
   *
   * @param siteId - Vista site identifier
   * @returns The site record
   *
   * @example
   * ```typescript
   * const roxy = await client.sites.get('site_roxy_wellington');
   * console.log(roxy.screens.length); // number of auditoriums
   * ```
   */
  async get(siteId: string): Promise<Site> {
    const raw = await this.http.get<unknown>(`/ocapi/v1/sites/${siteId}`);
    return siteSchema.parse(raw);
  }

  /**
   * Get the screen (auditorium) configurations for a site.
   * Returns each screen's capacity, supported formats, and accessibility status.
   * Response is validated at runtime using Zod.
   *
   * @param siteId - Vista site identifier
   * @returns Array of screen configurations
   *
   * @example
   * ```typescript
   * const screens = await client.sites.screens('site_embassy_wellington');
   * const imax = screens.find(s => s.formats.includes('IMAX'));
   * ```
   */
  async screens(siteId: string): Promise<Screen[]> {
    const raw = await this.http.get<unknown>(`/ocapi/v1/sites/${siteId}/screens`);
    return screenSchema.array().parse(raw);
  }

  /**
   * Find cinema sites within a geographic radius.
   *
   * Returns sites sorted by distance from the given coordinates.
   * Uses Vista's OCAPI geographic search which accepts decimal lat/lng
   * and a radius in kilometres.
   *
   * @param latitude - Decimal latitude of the search centre (−90 to 90)
   * @param longitude - Decimal longitude of the search centre (−180 to 180)
   * @param radiusKm - Search radius in kilometres
   * @returns Sites within the radius, sorted nearest-first
   *
   * @example
   * ```typescript
   * // Find cinemas within 5 km of Roxy Cinema Wellington
   * const nearby = await client.sites.nearby(-41.3007, 174.7766, 5);
   * console.log(nearby.map(s => s.name));
   * ```
   *
   * @example Discover cinemas near central Auckland
   * ```typescript
   * const auckland = await client.sites.nearby(-36.8509, 174.7645, 10);
   * ```
   */
  async nearby(latitude: number, longitude: number, radiusKm: number): Promise<Site[]> {
    const raw = await this.http.get<unknown>('/ocapi/v1/sites', {
      params: { latitude, longitude, radius: radiusKm },
    });
    return siteListResponseSchema.parse(raw);
  }
}
