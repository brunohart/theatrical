import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FoodAndBeverageResource } from '../../src/resources/food-and-beverage';
import type { TheatricalHTTPClient } from '../../src/http/client';
import type {
  MenuItem,
  MenuCategory,
  ComboOffer,
  FnbOrderConfirmation,
} from '../../src/types/menu';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockHTTPClient(): {
  resource: FoodAndBeverageResource;
  mockGet: ReturnType<typeof vi.fn>;
  mockPost: ReturnType<typeof vi.fn>;
} {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const http = { get: mockGet, post: mockPost } as unknown as TheatricalHTTPClient;
  return { resource: new FoodAndBeverageResource(http), mockGet, mockPost };
}

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

/** Hoyts Sylvia Park — busy suburban Auckland multiplex with a full candy bar. */
const HOYTS_SYLVIA_PARK = 'site_hoyts_sylvia_park_001';

function createPopcornItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 'item_large_popcorn',
    name: 'Large Popcorn',
    description: 'Extra large tub — enough for two',
    price: 1450,
    currency: 'NZD',
    categoryId: 'cat_popcorn',
    categoryName: 'Popcorn',
    dietary: ['vegetarian', 'gluten-free'],
    isAvailable: true,
    isPreOrderEligible: true,
    calories: 620,
    customisations: [
      {
        id: 'cust_flavour',
        name: 'Flavour',
        required: false,
        options: [
          { id: 'opt_salted', name: 'Salted', priceDelta: 0 },
          { id: 'opt_butter', name: 'Extra Butter', priceDelta: 0 },
          { id: 'opt_caramel', name: 'Caramel', priceDelta: 50 },
        ],
      },
    ],
    ...overrides,
  };
}

function createDrinkItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 'item_large_cola',
    name: 'Large Coca-Cola',
    price: 850,
    currency: 'NZD',
    categoryId: 'cat_drinks',
    categoryName: 'Drinks',
    dietary: ['vegetarian', 'vegan'],
    isAvailable: true,
    isPreOrderEligible: true,
    ...overrides,
  };
}

function createVeganItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 'item_vegan_hotdog',
    name: 'Vegan Hotdog',
    description: 'Plant-based sausage in a sesame bun',
    price: 1200,
    currency: 'NZD',
    categoryId: 'cat_hot_food',
    categoryName: 'Hot Food',
    dietary: ['vegan', 'vegetarian'],
    isAvailable: true,
    isPreOrderEligible: false,
    ...overrides,
  };
}

function createCombo(overrides: Partial<ComboOffer> = {}): ComboOffer {
  return {
    id: 'combo_large_meal',
    name: 'Large Combo Meal',
    description: 'Large Popcorn + Large Drink — save $3.00',
    price: 2000,
    currency: 'NZD',
    itemIds: ['item_large_popcorn', 'item_large_cola'],
    savings: 300,
    isAvailable: true,
    isPreOrderEligible: true,
    ...overrides,
  };
}

function createCategory(overrides: Partial<MenuCategory> = {}): MenuCategory {
  return {
    id: 'cat_popcorn',
    name: 'Popcorn',
    sectionType: 'snacks',
    displayOrder: 1,
    isActive: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('FoodAndBeverageResource', () => {
  let resource: FoodAndBeverageResource;
  let mockGet: ReturnType<typeof vi.fn>;
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ resource, mockGet, mockPost } = createMockHTTPClient());
  });

  // -------------------------------------------------------------------------
  // menu
  // -------------------------------------------------------------------------

  describe('menu', () => {
    it('fetches full menu for a site', async () => {
      const items = [createPopcornItem(), createDrinkItem(), createVeganItem()];
      mockGet.mockResolvedValue(items);

      const result = await resource.menu(HOYTS_SYLVIA_PARK);

      expect(mockGet).toHaveBeenCalledWith(
        `/ocapi/v1/sites/${HOYTS_SYLVIA_PARK}/menu`,
        expect.objectContaining({ params: expect.any(Object) }),
      );
      expect(result).toHaveLength(3);
    });

    it('returns only vegan items when dietary filter applied', async () => {
      const veganItems = [createVeganItem(), createDrinkItem({ dietary: ['vegan'] })];
      mockGet.mockResolvedValue(veganItems);

      const result = await resource.menu(HOYTS_SYLVIA_PARK, { dietary: ['vegan'] });

      expect(mockGet).toHaveBeenCalledWith(
        `/ocapi/v1/sites/${HOYTS_SYLVIA_PARK}/menu`,
        { params: { dietary: 'vegan', availableOnly: undefined, categoryId: undefined, preOrderOnly: undefined } },
      );
      expect(result.every((item) => item.dietary.includes('vegan'))).toBe(true);
    });

    it('filters by multiple dietary requirements', async () => {
      const glutenFreeVeganItems = [createVeganItem({ dietary: ['vegan', 'gluten-free'] })];
      mockGet.mockResolvedValue(glutenFreeVeganItems);

      await resource.menu(HOYTS_SYLVIA_PARK, { dietary: ['vegan', 'gluten-free'] });

      const call = mockGet.mock.calls[0];
      expect(call[1].params.dietary).toBe('vegan,gluten-free');
    });

    it('passes preOrderOnly filter for pre-order flows', async () => {
      mockGet.mockResolvedValue([createPopcornItem()]);

      await resource.menu(HOYTS_SYLVIA_PARK, { preOrderOnly: true });

      expect(mockGet).toHaveBeenCalledWith(
        `/ocapi/v1/sites/${HOYTS_SYLVIA_PARK}/menu`,
        { params: { preOrderOnly: true, dietary: undefined, categoryId: undefined, availableOnly: undefined } },
      );
    });
  });

  // -------------------------------------------------------------------------
  // categories
  // -------------------------------------------------------------------------

  describe('categories', () => {
    it('fetches all menu categories ordered by displayOrder', async () => {
      const categories = [
        createCategory({ id: 'cat_popcorn', name: 'Popcorn', displayOrder: 1 }),
        createCategory({ id: 'cat_drinks', name: 'Drinks', sectionType: 'drinks', displayOrder: 2 }),
        createCategory({ id: 'cat_combos', name: 'Combos', sectionType: 'combos', displayOrder: 3 }),
        createCategory({ id: 'cat_hot_food', name: 'Hot Food', sectionType: 'hot-food', displayOrder: 4 }),
      ];
      mockGet.mockResolvedValue(categories);

      const result = await resource.categories(HOYTS_SYLVIA_PARK);

      expect(mockGet).toHaveBeenCalledWith(`/ocapi/v1/sites/${HOYTS_SYLVIA_PARK}/menu/categories`);
      expect(result).toHaveLength(4);
      expect(result[0].displayOrder).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // itemDetail
  // -------------------------------------------------------------------------

  describe('itemDetail', () => {
    it('fetches full item detail including customisations', async () => {
      const popcorn = createPopcornItem();
      mockGet.mockResolvedValue(popcorn);

      const result = await resource.itemDetail(HOYTS_SYLVIA_PARK, 'item_large_popcorn');

      expect(mockGet).toHaveBeenCalledWith(
        `/ocapi/v1/sites/${HOYTS_SYLVIA_PARK}/menu/items/item_large_popcorn`,
      );
      expect(result.customisations).toHaveLength(1);
      expect(result.customisations![0].options).toHaveLength(3);
    });

    it('returns calorie count when provided', async () => {
      mockGet.mockResolvedValue(createPopcornItem({ calories: 620 }));

      const result = await resource.itemDetail(HOYTS_SYLVIA_PARK, 'item_large_popcorn');

      expect(result.calories).toBe(620);
    });
  });

  // -------------------------------------------------------------------------
  // combos
  // -------------------------------------------------------------------------

  describe('combos', () => {
    it('fetches available combo deals for a site', async () => {
      const combos = [
        createCombo(),
        createCombo({
          id: 'combo_family_pack',
          name: 'Family Pack',
          description: '2x Medium Popcorn + 4x Regular Drinks — save $6.50',
          price: 4800,
          itemIds: ['item_med_popcorn', 'item_med_popcorn', 'item_reg_cola', 'item_reg_cola', 'item_reg_cola', 'item_reg_cola'],
          savings: 650,
        }),
      ];
      mockGet.mockResolvedValue(combos);

      const result = await resource.combos(HOYTS_SYLVIA_PARK);

      expect(mockGet).toHaveBeenCalledWith(`/ocapi/v1/sites/${HOYTS_SYLVIA_PARK}/menu/combos`);
      expect(result).toHaveLength(2);
    });

    it('surfaces combo savings amount for upsell logic', async () => {
      mockGet.mockResolvedValue([createCombo({ savings: 300 })]);

      const result = await resource.combos(HOYTS_SYLVIA_PARK);

      expect(result[0].savings).toBe(300);
      // Individual price would be 1450 + 850 = 2300, combo = 2000, saving = 300
      const [combo] = result;
      expect(combo.price).toBeLessThan(2300);
    });

    it('identifies pre-order-eligible combos', async () => {
      const preOrderCombo = createCombo({ isPreOrderEligible: true });
      const kioskOnlyCombo = createCombo({ id: 'combo_kiosk_only', isPreOrderEligible: false });
      mockGet.mockResolvedValue([preOrderCombo, kioskOnlyCombo]);

      const result = await resource.combos(HOYTS_SYLVIA_PARK);
      const preOrderable = result.filter((c) => c.isPreOrderEligible);

      expect(preOrderable).toHaveLength(1);
      expect(preOrderable[0].id).toBe('combo_large_meal');
    });
  });

  // -------------------------------------------------------------------------
  // addToOrder
  // -------------------------------------------------------------------------

  describe('addToOrder', () => {
    it('adds a single item to an existing order', async () => {
      const confirmation: FnbOrderConfirmation = {
        orderId: 'order_hoyts_sylvia_001',
        addedItems: [{ itemId: 'item_large_popcorn', quantity: 1, unitPrice: 1450 }],
        fnbSubtotal: 1450,
        currency: 'NZD',
      };
      mockPost.mockResolvedValue(confirmation);

      const result = await resource.addToOrder({
        orderId: 'order_hoyts_sylvia_001',
        items: [{ itemId: 'item_large_popcorn', quantity: 1, unitPrice: 1450 }],
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/ocapi/v1/orders/order_hoyts_sylvia_001/fnb',
        {
          body: {
            orderId: 'order_hoyts_sylvia_001',
            items: [{ itemId: 'item_large_popcorn', quantity: 1, unitPrice: 1450 }],
          },
        },
      );
      expect(result.fnbSubtotal).toBe(1450);
    });

    it('adds multiple items with customisations', async () => {
      const confirmation: FnbOrderConfirmation = {
        orderId: 'order_event_wellington_002',
        addedItems: [
          { itemId: 'item_large_popcorn', quantity: 2, customisations: { cust_flavour: 'opt_caramel' }, unitPrice: 1500 },
          { itemId: 'item_large_cola', quantity: 2, unitPrice: 850 },
        ],
        fnbSubtotal: 4700,
        currency: 'NZD',
      };
      mockPost.mockResolvedValue(confirmation);

      const result = await resource.addToOrder({
        orderId: 'order_event_wellington_002',
        items: [
          { itemId: 'item_large_popcorn', quantity: 2, customisations: { cust_flavour: 'opt_caramel' }, unitPrice: 1500 },
          { itemId: 'item_large_cola', quantity: 2, unitPrice: 850 },
        ],
      });

      expect(result.addedItems).toHaveLength(2);
      expect(result.fnbSubtotal).toBe(4700);
    });

    it('passes sessionId for pre-order flows', async () => {
      const confirmation: FnbOrderConfirmation = {
        orderId: 'order_rialto_auckland_003',
        addedItems: [{ itemId: 'item_large_popcorn', quantity: 1, unitPrice: 1450 }],
        fnbSubtotal: 1450,
        currency: 'NZD',
      };
      mockPost.mockResolvedValue(confirmation);

      await resource.addToOrder({
        orderId: 'order_rialto_auckland_003',
        items: [{ itemId: 'item_large_popcorn', quantity: 1, unitPrice: 1450 }],
        sessionId: 'session_rialto_7pm_001',
      });

      const callBody = mockPost.mock.calls[0][1].body;
      expect(callBody.sessionId).toBe('session_rialto_7pm_001');
    });
  });
});
