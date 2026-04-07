import type { TheatricalHTTPClient } from '../http/client';
import type { Film, FilmFilter } from '../types/film';

/**
 * Films resource — now showing, coming soon, search.
 */
export class FilmsResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  async nowShowing(filters?: { siteId?: string }): Promise<Film[]> {
    return this.http.get<Film[]>('/ocapi/v1/films/now-showing', {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
  }

  async comingSoon(filters?: { siteId?: string }): Promise<Film[]> {
    return this.http.get<Film[]>('/ocapi/v1/films/coming-soon', {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
  }

  async get(filmId: string): Promise<Film> {
    return this.http.get<Film>(`/ocapi/v1/films/${filmId}`);
  }

  async search(filters: FilmFilter): Promise<Film[]> {
    return this.http.get<Film[]>('/ocapi/v1/films', {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
  }
}
