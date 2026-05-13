"""Orders resource — booking lifecycle: create, confirm, cancel."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from theatrical.types.order import (
    AddItemsInput,
    AddTicketsInput,
    ApplyLoyaltyInput,
    Order,
    OrderHistoryFilter,
)

if TYPE_CHECKING:
    from theatrical.http.client import TheatricalHttpProtocol


class OrdersResource:
    def __init__(self, http: TheatricalHttpProtocol) -> None:
        self._http = http

    async def create(self, session_id: str) -> Order:
        raise NotImplementedError

    async def get(self, order_id: str) -> Order:
        raise NotImplementedError

    async def add_tickets(self, order_id: str, input: AddTicketsInput) -> Order:
        raise NotImplementedError

    async def add_items(self, order_id: str, input: AddItemsInput) -> Order:
        raise NotImplementedError

    async def apply_loyalty(self, order_id: str, input: ApplyLoyaltyInput) -> Order:
        raise NotImplementedError

    async def confirm(self, order_id: str) -> Order:
        raise NotImplementedError

    async def cancel(self, order_id: str) -> Order:
        raise NotImplementedError

    async def history(self, filters: Optional[OrderHistoryFilter] = None) -> list[Order]:
        raise NotImplementedError
