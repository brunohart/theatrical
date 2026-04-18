// ---------------------------------------------------------------------------
// Food & Beverage types for the Theatrical SDK
// ---------------------------------------------------------------------------

/**
 * Dietary classification flags.
 *
 * Multiple flags can apply simultaneously (e.g. vegan items are also vegetarian).
 */
export type DietaryFlag = 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'nut-free' | 'halal' | 'kosher';

/** Broad menu section groupings used for candy-bar display ordering. */
export type MenuSectionType = 'hot-food' | 'cold-food' | 'drinks' | 'combos' | 'snacks' | 'ice-cream' | 'alcohol';

// ---------------------------------------------------------------------------
// Menu categories
// ---------------------------------------------------------------------------

export interface MenuCategory {
  id: string;
  name: string;
  sectionType: MenuSectionType;
  /** Display rank — lower numbers appear first in UI. */
  displayOrder: number;
  /** Whether this category is currently visible on the menu. */
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  /** Price in minor currency units (e.g. cents). */
  price: number;
  currency: string;
  /** Parent category. */
  categoryId: string;
  /** Human-readable category name for convenience. */
  categoryName?: string;
  imageUrl?: string;
  /** Dietary classifications. Empty array means no special designation. */
  dietary: DietaryFlag[];
  isAvailable: boolean;
  /** When true, item can be added to an active pre-order. */
  isPreOrderEligible: boolean;
  /** ID of a combo offer this item belongs to, if any. */
  comboDealId?: string;
  /** Calories as listed on menu (optional — site-dependent). */
  calories?: number;
  /** Customisation options (e.g. "Size", "Flavour"). */
  customisations?: ItemCustomisation[];
}

export interface ItemCustomisation {
  id: string;
  name: string;
  required: boolean;
  options: Array<{
    id: string;
    name: string;
    /** Price delta in minor units — positive means extra charge, negative means discount. */
    priceDelta: number;
  }>;
}

// ---------------------------------------------------------------------------
// Combo offers
// ---------------------------------------------------------------------------

/**
 * A bundled combo deal — e.g. "Large Popcorn + Large Drink = $18.50"
 *
 * Combos are priced as a unit; the `savings` field shows value vs buying
 * items individually, suitable for upsell copy.
 */
export interface ComboOffer {
  id: string;
  name: string;
  description?: string;
  /** Total combo price in minor units. */
  price: number;
  currency: string;
  /** IDs of MenuItem that make up this combo. */
  itemIds: string[];
  /** Saving in minor units vs buying all items individually at full price. */
  savings: number;
  isAvailable: boolean;
  /** Whether this combo can be added via pre-order. */
  isPreOrderEligible: boolean;
  imageUrl?: string;
}

// ---------------------------------------------------------------------------
// F&B order types
// ---------------------------------------------------------------------------

export interface FnbOrderLineItem {
  itemId: string;
  quantity: number;
  /** Selected customisation option IDs, keyed by customisation ID. */
  customisations?: Record<string, string>;
  /** Unit price at time of ordering (minor units). */
  unitPrice: number;
}

export interface AddToOrderInput {
  /** Vista order ID to attach F&B items to. */
  orderId: string;
  items: FnbOrderLineItem[];
  /** Pre-order session ID — required when `isPreOrderEligible` items are included. */
  sessionId?: string;
}

export interface FnbOrderConfirmation {
  orderId: string;
  addedItems: FnbOrderLineItem[];
  /** Updated F&B subtotal in minor units. */
  fnbSubtotal: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Menu filter
// ---------------------------------------------------------------------------

export interface MenuFilter {
  siteId: string;
  categoryId?: string;
  dietary?: DietaryFlag[];
  /** Return only items with isAvailable = true. Defaults to true. */
  availableOnly?: boolean;
  /** Filter for pre-order-eligible items only. */
  preOrderOnly?: boolean;
}
