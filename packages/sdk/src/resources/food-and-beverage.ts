import type { TheatricalHTTPClient } from '../http/client';
import type {
  MenuItem,
  MenuCategory,
  ComboOffer,
  AddToOrderInput,
  FnbOrderConfirmation,
  MenuFilter,
} from '../types/menu';

/**
 * Food & Beverage resource — menus, ordering, combo deals, and dietary filtering.
 *
 * Covers the Vista OCAPI candy-bar endpoints used to surface F&B options
 * on digital kiosks, mobile apps, and web booking flows.
 */
export class FoodAndBeverageResource {
  constructor(private readonly http: TheatricalHTTPClient) {}

  /**
   * List menu items for a site, with optional filtering.
   *
   * Results include dietary tags and customisation options. Use `filter.dietary`
   * to surface only vegan / gluten-free items. Use `filter.preOrderOnly` when
   * building a pre-order flow tied to a session.
   *
   * @param siteId - The Vista site ID.
   * @param filter - Optional filter (dietary, category, availability).
   */
  async menu(siteId: string, filter?: Omit<MenuFilter, 'siteId'>): Promise<MenuItem[]> {
    return this.http.get<MenuItem[]>(`/ocapi/v1/sites/${siteId}/menu`, {
      params: { ...filter, dietary: filter?.dietary?.join(',') },
    });
  }

  /**
   * List available menu categories for a site.
   *
   * Categories define the candy-bar section groupings (popcorn, drinks,
   * combos, snacks). Ordered by `displayOrder` ascending.
   *
   * @param siteId - The Vista site ID.
   */
  async categories(siteId: string): Promise<MenuCategory[]> {
    return this.http.get<MenuCategory[]>(`/ocapi/v1/sites/${siteId}/menu/categories`);
  }

  /**
   * Fetch full detail for a single menu item.
   *
   * Includes customisation options (size, flavour) not always returned in
   * the full menu list. Use this before presenting an add-to-order form.
   *
   * @param siteId - The Vista site ID.
   * @param itemId - The menu item ID.
   */
  async itemDetail(siteId: string, itemId: string): Promise<MenuItem> {
    return this.http.get<MenuItem>(`/ocapi/v1/sites/${siteId}/menu/items/${itemId}`);
  }

  /**
   * List combo deals available at a site.
   *
   * Combos are pre-configured bundles (e.g. "Large Popcorn + Large Drink").
   * The `savings` field on each {@link ComboOffer} indicates the discount
   * vs buying items individually — useful for upsell copy.
   *
   * @param siteId - The Vista site ID.
   */
  async combos(siteId: string): Promise<ComboOffer[]> {
    return this.http.get<ComboOffer[]>(`/ocapi/v1/sites/${siteId}/menu/combos`);
  }

  /**
   * Add F&B items to an existing Vista order.
   *
   * Attaches concession items to a booking in progress. When adding
   * pre-order items tied to a specific session, pass `input.sessionId`
   * to enable collection-slot logic on the Vista side.
   *
   * Returns a confirmation with updated F&B subtotal for display.
   *
   * @param input - Order ID, items to add, optional session ID.
   */
  async addToOrder(input: AddToOrderInput): Promise<FnbOrderConfirmation> {
    return this.http.post<FnbOrderConfirmation>(
      `/ocapi/v1/orders/${input.orderId}/fnb`,
      { body: input },
    );
  }
}
