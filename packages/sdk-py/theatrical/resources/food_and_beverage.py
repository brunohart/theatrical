"""Food & Beverage resource — menus, ordering, dietary info."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from theatrical.types.menu import (
    AddToOrderInput,
    ComboOffer,
    FnbOrderConfirmation,
    MenuCategory,
    MenuFilter,
    MenuItem,
)

if TYPE_CHECKING:
    import httpx


class FoodAndBeverageResource:
    def __init__(self, http: httpx.AsyncClient) -> None:
        self._http = http

    async def categories(self, site_id: str) -> list[MenuCategory]:
        raise NotImplementedError

    async def items(self, filters: Optional[MenuFilter] = None) -> list[MenuItem]:
        raise NotImplementedError

    async def combos(self, site_id: str) -> list[ComboOffer]:
        raise NotImplementedError

    async def add_to_order(self, input: AddToOrderInput) -> FnbOrderConfirmation:
        raise NotImplementedError
