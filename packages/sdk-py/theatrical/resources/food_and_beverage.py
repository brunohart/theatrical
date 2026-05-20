"""Food & Beverage resource — menus, ordering, combo deals, and dietary filtering."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import TypeAdapter

from theatrical.types.menu import (
    AddToOrderInput,
    ComboOffer,
    FnbOrderConfirmation,
    MenuCategory,
    MenuFilter,
    MenuItem,
)

if TYPE_CHECKING:
    from theatrical.http.client import TheatricalHttpProtocol

_menu_item_list_adapter = TypeAdapter(list[MenuItem])
_menu_item_adapter = TypeAdapter(MenuItem)
_category_list_adapter = TypeAdapter(list[MenuCategory])
_combo_list_adapter = TypeAdapter(list[ComboOffer])
_fnb_confirmation_adapter = TypeAdapter(FnbOrderConfirmation)


class FoodAndBeverageResource:
    def __init__(self, http: TheatricalHttpProtocol) -> None:
        self._http = http

    async def menu(
        self, site_id: str, filters: Optional[MenuFilter] = None
    ) -> list[MenuItem]:
        params: dict[str, str] = {}
        if filters:
            d = filters.model_dump(exclude_none=True, exclude={"site_id"})
            for key, value in d.items():
                if key == "dietary" and isinstance(value, list):
                    params[key] = ",".join(
                        v.value if hasattr(v, "value") else str(v) for v in value
                    )
                else:
                    params[key] = str(value) if not isinstance(value, str) else value
        raw = await self._http.get(
            f"/ocapi/v1/sites/{site_id}/menu", params=params or None
        )
        return _menu_item_list_adapter.validate_python(raw)

    async def categories(self, site_id: str) -> list[MenuCategory]:
        raw = await self._http.get(f"/ocapi/v1/sites/{site_id}/menu/categories")
        return _category_list_adapter.validate_python(raw)

    async def item_detail(self, site_id: str, item_id: str) -> MenuItem:
        raw = await self._http.get(
            f"/ocapi/v1/sites/{site_id}/menu/items/{item_id}"
        )
        return _menu_item_adapter.validate_python(raw)

    async def combos(self, site_id: str) -> list[ComboOffer]:
        raw = await self._http.get(f"/ocapi/v1/sites/{site_id}/menu/combos")
        return _combo_list_adapter.validate_python(raw)

    async def add_to_order(self, input: AddToOrderInput) -> FnbOrderConfirmation:
        raw = await self._http.post(
            f"/ocapi/v1/orders/{input.order_id}/fnb",
            body=input.model_dump(exclude_none=True),
        )
        return _fnb_confirmation_adapter.validate_python(raw)
