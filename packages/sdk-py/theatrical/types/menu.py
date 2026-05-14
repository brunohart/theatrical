"""Food & Beverage / menu types."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from theatrical.types.base import ApiModel


class DietaryFlag(str, Enum):
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    GLUTEN_FREE = "gluten-free"
    DAIRY_FREE = "dairy-free"
    NUT_FREE = "nut-free"
    HALAL = "halal"
    KOSHER = "kosher"


class MenuSectionType(str, Enum):
    HOT_FOOD = "hot-food"
    COLD_FOOD = "cold-food"
    DRINKS = "drinks"
    COMBOS = "combos"
    SNACKS = "snacks"
    ICE_CREAM = "ice-cream"
    ALCOHOL = "alcohol"


class MenuCategory(ApiModel):
    id: str
    name: str
    section_type: MenuSectionType
    display_order: int
    is_active: bool


class CustomisationOption(ApiModel):
    id: str
    name: str
    price_delta: float


class ItemCustomisation(ApiModel):
    id: str
    name: str
    required: bool
    options: list[CustomisationOption]


class MenuItem(ApiModel):
    id: str
    name: str
    description: Optional[str] = None
    price: float
    currency: str
    category_id: str
    category_name: Optional[str] = None
    image_url: Optional[str] = None
    dietary: list[DietaryFlag] = []
    is_available: bool
    is_pre_order_eligible: bool
    combo_deal_id: Optional[str] = None
    calories: Optional[int] = None
    customisations: Optional[list[ItemCustomisation]] = None


class ComboOffer(ApiModel):
    id: str
    name: str
    description: Optional[str] = None
    price: float
    currency: str
    item_ids: list[str]
    savings: float
    is_available: bool
    is_pre_order_eligible: bool
    image_url: Optional[str] = None


class FnbOrderLineItem(ApiModel):
    item_id: str
    quantity: int
    customisations: Optional[dict[str, str]] = None
    unit_price: float


class AddToOrderInput(ApiModel):
    order_id: str
    items: list[FnbOrderLineItem]
    session_id: Optional[str] = None


class FnbOrderConfirmation(ApiModel):
    order_id: str
    added_items: list[FnbOrderLineItem]
    fnb_subtotal: float
    currency: str


class MenuFilter(ApiModel):
    site_id: str
    category_id: Optional[str] = None
    dietary: Optional[list[DietaryFlag]] = None
    available_only: Optional[bool] = None
    pre_order_only: Optional[bool] = None
