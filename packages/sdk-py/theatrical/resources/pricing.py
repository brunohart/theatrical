"""Pricing resource — ticket types, price calculations, tax handling."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from theatrical.types.pricing import (
    ApplyCouponsInput,
    CouponApplicationResult,
    PriceCalculation,
    TicketType,
    TicketTypeFilter,
)

if TYPE_CHECKING:
    import httpx


class PricingResource:
    def __init__(self, http: httpx.AsyncClient) -> None:
        self._http = http

    async def ticket_types(self, filters: Optional[TicketTypeFilter] = None) -> list[TicketType]:
        raise NotImplementedError

    async def calculate(
        self,
        session_id: str,
        ticket_type_id: str,
        quantity: int = 1,
        membership_id: Optional[str] = None,
    ) -> PriceCalculation:
        raise NotImplementedError

    async def apply_coupons(self, input: ApplyCouponsInput) -> CouponApplicationResult:
        raise NotImplementedError
