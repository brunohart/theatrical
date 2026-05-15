"""Spy-based tests for FoodAndBeverageResource — URL, param, and response verification."""

from __future__ import annotations

import pytest

from tests.conftest import SpyHttpProtocol
from theatrical.errors.exceptions import NotFoundError, ValidationError
from theatrical.resources.food_and_beverage import FoodAndBeverageResource
from theatrical.types.menu import AddToOrderInput, DietaryFlag, FnbOrderLineItem, MenuFilter


def _menu_item_dict(**overrides: object) -> dict[str, object]:
    base = {
        "id": "item_popcorn_large",
        "name": "Large Popcorn",
        "price": 9.50,
        "currency": "NZD",
        "categoryId": "cat_popcorn",
        "categoryName": "Popcorn",
        "description": "Freshly popped buttered popcorn",
        "dietary": ["gluten-free"],
        "isAvailable": True,
        "isPreOrderEligible": True,
        "calories": 480,
    }
    base.update(overrides)
    return base


class TestGetMenuAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_menu_item_dict()])
        res = FoodAndBeverageResource(spy)
        await res.menu("site_roxy")
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/sites/site_roxy/menu"

    async def test_sends_no_params_without_filter(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_menu_item_dict()])
        res = FoodAndBeverageResource(spy)
        await res.menu("site_roxy")
        assert spy.last_call.params is None

    async def test_passes_category_filter(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_menu_item_dict()])
        res = FoodAndBeverageResource(spy)
        await res.menu("site_roxy", MenuFilter(site_id="site_roxy", category_id="cat_drinks"))
        assert spy.last_call.params is not None
        assert spy.last_call.params["category_id"] == "cat_drinks"

    async def test_passes_dietary_filters(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_menu_item_dict()])
        res = FoodAndBeverageResource(spy)
        await res.menu("site_roxy", MenuFilter(site_id="site_roxy", dietary=[DietaryFlag.VEGAN, DietaryFlag.GLUTEN_FREE]))
        assert spy.last_call.params is not None
        assert spy.last_call.params["dietary"] == "vegan,gluten-free"

    async def test_passes_pre_order_only_flag(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_menu_item_dict()])
        res = FoodAndBeverageResource(spy)
        await res.menu("site_roxy", MenuFilter(site_id="site_roxy", pre_order_only=True))
        assert spy.last_call.params is not None
        assert spy.last_call.params["pre_order_only"] == "True"

    async def test_returns_multiple_items(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([
            _menu_item_dict(id="item_popcorn", name="Large Popcorn", price=9.50),
            _menu_item_dict(id="item_nachos", name="Nachos", price=12.00, categoryId="cat_hot_food"),
            _menu_item_dict(id="item_cola", name="Cola", price=5.50, categoryId="cat_drinks"),
        ])
        res = FoodAndBeverageResource(spy)
        result = await res.menu("site_roxy")
        assert len(result) == 3
        assert result[0].name == "Large Popcorn"
        assert result[1].price == 12.00
        assert result[2].category_id == "cat_drinks"

    async def test_returns_dietary_flags(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_menu_item_dict(dietary=["vegetarian", "gluten-free"])])
        res = FoodAndBeverageResource(spy)
        result = await res.menu("site_roxy")
        assert result[0].dietary is not None
        assert any(d.value == "vegetarian" for d in result[0].dietary)
        assert any(d.value == "gluten-free" for d in result[0].dietary)


class TestGetCategoriesAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([
            {"id": "cat_snacks", "name": "Snacks", "sectionType": "snacks", "displayOrder": 1, "isActive": True},
        ])
        res = FoodAndBeverageResource(spy)
        await res.categories("site_roxy")
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/sites/site_roxy/menu/categories"

    async def test_returns_categories_with_order(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([
            {"id": "cat_snacks", "name": "Snacks", "sectionType": "snacks", "displayOrder": 1, "isActive": True},
            {"id": "cat_drinks", "name": "Drinks", "sectionType": "drinks", "displayOrder": 2, "isActive": True},
            {"id": "cat_combos", "name": "Combos", "sectionType": "combos", "displayOrder": 3, "isActive": True},
        ])
        res = FoodAndBeverageResource(spy)
        result = await res.categories("site_roxy")
        assert len(result) == 3
        assert result[0].name == "Snacks"
        assert result[1].display_order == 2


class TestGetItemDetailAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_menu_item_dict())
        res = FoodAndBeverageResource(spy)
        await res.item_detail("site_roxy", "item_popcorn_large")
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/sites/site_roxy/menu/items/item_popcorn_large"

    async def test_returns_item_with_customisations(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_menu_item_dict(
            customisations=[
                {
                    "id": "cust_flavour", "name": "Flavour", "required": False,
                    "options": [
                        {"id": "opt_butter", "name": "Butter", "priceDelta": 0.0},
                        {"id": "opt_caramel", "name": "Caramel", "priceDelta": 1.50},
                        {"id": "opt_salt", "name": "Salt & Vinegar", "priceDelta": 0.50},
                    ],
                },
                {
                    "id": "cust_size", "name": "Size", "required": True,
                    "options": [
                        {"id": "opt_regular", "name": "Regular", "priceDelta": 0.0},
                        {"id": "opt_large", "name": "Large", "priceDelta": 2.00},
                    ],
                },
            ],
        ))
        res = FoodAndBeverageResource(spy)
        result = await res.item_detail("site_roxy", "item_popcorn")
        assert result.customisations is not None
        assert len(result.customisations) == 2
        assert result.customisations[0].name == "Flavour"
        assert len(result.customisations[0].options) == 3


class TestGetCombosAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([{
            "id": "combo_001", "name": "Date Night", "price": 28.00, "currency": "NZD",
            "description": "2x Large Popcorn + 2x Large Drink",
            "itemIds": ["item_popcorn", "item_popcorn", "item_cola", "item_cola"],
            "savings": 4.00, "isAvailable": True, "isPreOrderEligible": True,
        }])
        res = FoodAndBeverageResource(spy)
        await res.combos("site_roxy")
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/sites/site_roxy/menu/combos"

    async def test_returns_combo_details(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([{
            "id": "combo_001", "name": "Date Night", "price": 28.00, "currency": "NZD",
            "description": "2x Large Popcorn + 2x Large Drink",
            "itemIds": ["item_popcorn", "item_popcorn", "item_cola", "item_cola"],
            "savings": 4.00, "isAvailable": True, "isPreOrderEligible": True,
        }])
        res = FoodAndBeverageResource(spy)
        result = await res.combos("site_roxy")
        assert len(result) == 1
        assert result[0].name == "Date Night"
        assert result[0].price == 28.00
        assert result[0].savings == 4.00
        assert len(result[0].item_ids) == 4


class TestAddToOrderAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({
            "orderId": "ord_001", "fnbSubtotal": 17.00, "currency": "NZD",
            "addedItems": [{"itemId": "item_popcorn", "quantity": 2, "unitPrice": 8.50}],
        })
        res = FoodAndBeverageResource(spy)
        await res.add_to_order(AddToOrderInput(
            order_id="ord_001",
            items=[FnbOrderLineItem(item_id="item_popcorn", quantity=2, unit_price=8.50)],
        ))
        assert spy.last_call.method == "POST"
        assert spy.last_call.path == "/ocapi/v1/orders/ord_001/fnb"

    async def test_sends_input_body(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({
            "orderId": "ord_001", "fnbSubtotal": 8.50, "currency": "NZD",
            "addedItems": [{"itemId": "item_popcorn", "quantity": 1, "unitPrice": 8.50}],
        })
        res = FoodAndBeverageResource(spy)
        await res.add_to_order(AddToOrderInput(
            order_id="ord_001",
            items=[FnbOrderLineItem(item_id="item_popcorn", quantity=1, unit_price=8.50)],
        ))
        assert spy.last_call.body is not None

    async def test_returns_confirmation(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({
            "orderId": "ord_001", "fnbSubtotal": 17.00, "currency": "NZD",
            "addedItems": [{"itemId": "item_popcorn", "quantity": 2, "unitPrice": 8.50}],
        })
        res = FoodAndBeverageResource(spy)
        result = await res.add_to_order(AddToOrderInput(
            order_id="ord_001",
            items=[FnbOrderLineItem(item_id="item_popcorn", quantity=2, unit_price=8.50)],
        ))
        assert result.order_id == "ord_001"
        assert result.fnb_subtotal == 17.00


class TestErrorPropagation:
    async def test_menu_propagates_not_found(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(NotFoundError("Site", "site_nonexistent"))
        res = FoodAndBeverageResource(spy)
        with pytest.raises(NotFoundError):
            await res.menu("site_nonexistent")

    async def test_add_to_order_propagates_validation_error(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(ValidationError("Order not found"))
        res = FoodAndBeverageResource(spy)
        with pytest.raises(ValidationError):
            await res.add_to_order(AddToOrderInput(
                order_id="ord_nonexistent",
                items=[FnbOrderLineItem(item_id="item_001", quantity=1, unit_price=5.00)],
            ))
