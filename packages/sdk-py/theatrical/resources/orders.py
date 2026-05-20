"""Orders resource — the full booking lifecycle."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import TypeAdapter

from theatrical.types.order import (
    AddItemsInput,
    AddTicketsInput,
    ApplyLoyaltyInput,
    CreateOrderInput,
    Order,
    OrderHistoryFilter,
)
from theatrical.types.pagination import PaginatedResponse

if TYPE_CHECKING:
    from theatrical.http.client import TheatricalHttpProtocol

_order_adapter = TypeAdapter(Order)
_paginated_order_adapter = TypeAdapter(PaginatedResponse[Order])


class OrdersResource:
    def __init__(self, http: TheatricalHttpProtocol) -> None:
        self._http = http

    async def create(self, input: CreateOrderInput) -> Order:
        raw = await self._http.post("/ocapi/v1/orders", body=input.model_dump(exclude_none=True))
        return _order_adapter.validate_python(raw)

    async def get(self, order_id: str) -> Order:
        raw = await self._http.get(f"/ocapi/v1/orders/{order_id}")
        return _order_adapter.validate_python(raw)

    async def add_tickets(self, order_id: str, input: AddTicketsInput) -> Order:
        raw = await self._http.post(
            f"/ocapi/v1/orders/{order_id}/tickets",
            body=input.model_dump(exclude_none=True),
        )
        return _order_adapter.validate_python(raw)

    async def add_items(self, order_id: str, input: AddItemsInput) -> Order:
        raw = await self._http.post(
            f"/ocapi/v1/orders/{order_id}/items",
            body=input.model_dump(exclude_none=True),
        )
        return _order_adapter.validate_python(raw)

    async def confirm(self, order_id: str) -> Order:
        raw = await self._http.post(f"/ocapi/v1/orders/{order_id}/confirm")
        return _order_adapter.validate_python(raw)

    async def cancel(self, order_id: str) -> Order:
        raw = await self._http.post(f"/ocapi/v1/orders/{order_id}/cancel")
        return _order_adapter.validate_python(raw)

    async def apply_loyalty(self, order_id: str, input: ApplyLoyaltyInput) -> Order:
        raw = await self._http.post(
            f"/ocapi/v1/orders/{order_id}/loyalty",
            body=input.model_dump(exclude_none=True),
        )
        return _order_adapter.validate_python(raw)

    async def refund(self, order_id: str) -> Order:
        raw = await self._http.post(f"/ocapi/v1/orders/{order_id}/refund")
        return _order_adapter.validate_python(raw)

    async def complete(self, order_id: str) -> Order:
        raw = await self._http.post(f"/ocapi/v1/orders/{order_id}/complete")
        return _order_adapter.validate_python(raw)

    async def history(
        self, member_id: str, filters: Optional[OrderHistoryFilter] = None
    ) -> PaginatedResponse[Order]:
        params: dict[str, str] | None = None
        if filters:
            params = {}
            d = filters.model_dump(exclude_none=True)
            for key, value in d.items():
                params[key] = str(value) if not isinstance(value, str) else value
        raw = await self._http.get(f"/ocapi/v1/members/{member_id}/orders", params=params)
        return _paginated_order_adapter.validate_python(raw)
