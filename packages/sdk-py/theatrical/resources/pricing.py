"""Pricing resource — ticket types, price calculations, and coupon application."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import TypeAdapter

from theatrical.types.pricing import (
    ApplyCouponsInput,
    CouponApplicationResult,
    PriceCalculation,
    TicketType,
    TicketTypeFilter,
)

if TYPE_CHECKING:
    from theatrical.http.client import TheatricalHttpProtocol

_ticket_type_list_adapter = TypeAdapter(list[TicketType])
_price_calc_adapter = TypeAdapter(PriceCalculation)
_coupon_result_adapter = TypeAdapter(CouponApplicationResult)


class PricingResource:
    def __init__(self, http: TheatricalHttpProtocol) -> None:
        self._http = http

    async def ticket_types(
        self, session_id: str, filters: Optional[TicketTypeFilter] = None
    ) -> list[TicketType]:
        params: dict[str, str] = {}
        if filters:
            d = filters.model_dump(exclude_none=True, exclude={"session_id"})
            for key, value in d.items():
                params[key] = str(value) if not isinstance(value, str) else value
        raw = await self._http.get(
            f"/ocapi/v1/sessions/{session_id}/ticket-types", params=params or None
        )
        return _ticket_type_list_adapter.validate_python(raw)

    async def calculate(
        self,
        session_id: str,
        ticket_type_id: str,
        quantity: int = 1,
    ) -> PriceCalculation:
        raw = await self._http.get(
            "/ocapi/v1/pricing/calculate",
            params={
                "sessionId": session_id,
                "ticketTypeId": ticket_type_id,
                "quantity": str(quantity),
            },
        )
        return _price_calc_adapter.validate_python(raw)

    async def apply_coupons(self, input: ApplyCouponsInput) -> CouponApplicationResult:
        raw = await self._http.post(
            "/ocapi/v1/pricing/apply-coupons",
            body=input.model_dump(exclude_none=True),
        )
        return _coupon_result_adapter.validate_python(raw)
