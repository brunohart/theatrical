import type { TheatricalHTTPClient } from '../http/client';
import type { Site, Screen } from '../types/site';

/**
 * Sites resource — cinema locations, screens, and configurations.
 */
export class SitesResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  async list(filters?: { query?: string; latitude?: number; longitude?: number; radius?: number }): Promise<Site[]> {
    return this.http.get<Site[]>('/ocapi/v1/sites', {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
  }

  async get(siteId: string): Promise<Site> {
    return this.http.get<Site>(`/ocapi/v1/sites/${siteId}`);
  }

  async screens(siteId: string): Promise<Screen[]> {
    return this.http.get<Screen[]>(`/ocapi/v1/sites/${siteId}/screens`);
  }
}
