import type { TheatricalHTTPClient } from '../http/client';
import type { MenuItem, MenuCategory } from '../types/menu';

/**
 * Food & Beverage resource — menus, ordering, dietary information.
 */
export class FoodAndBeverageResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  async menu(siteId: string): Promise<MenuItem[]> {
    return this.http.get<MenuItem[]>(`/ocapi/v1/sites/${siteId}/menu`);
  }

  async categories(siteId: string): Promise<MenuCategory[]> {
    return this.http.get<MenuCategory[]>(`/ocapi/v1/sites/${siteId}/menu/categories`);
  }
}
