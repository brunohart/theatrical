export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category: MenuCategory;
  imageUrl?: string;
  dietary: DietaryFlag[];
  isAvailable: boolean;
  comboDealId?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
}

export type DietaryFlag = 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'nut-free' | 'halal';
