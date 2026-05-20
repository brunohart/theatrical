"""Loyalty resource — member management, points, tiers."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import TypeAdapter

from theatrical.types.loyalty import (
    LoyaltyMember,
    PointsBalance,
    PointsHistoryFilter,
    PointsTransaction,
    RedeemPointsInput,
    RedemptionOption,
)
from theatrical.types.pagination import PaginatedResponse

if TYPE_CHECKING:
    from theatrical.http.client import TheatricalHttpProtocol

_member_adapter = TypeAdapter(LoyaltyMember)
_points_balance_adapter = TypeAdapter(PointsBalance)
_paginated_tx_adapter = TypeAdapter(PaginatedResponse[PointsTransaction])
_redemption_list_adapter = TypeAdapter(list[RedemptionOption])
_tx_adapter = TypeAdapter(PointsTransaction)


class LoyaltyResource:
    def __init__(self, http: TheatricalHttpProtocol) -> None:
        self._http = http

    async def get_member(self, member_id: str) -> LoyaltyMember:
        raw = await self._http.get(f"/ocapi/v1/loyalty/members/{member_id}")
        return _member_adapter.validate_python(raw)

    async def authenticate(self, email: str, password: str) -> LoyaltyMember:
        raw = await self._http.post(
            "/ocapi/v1/loyalty/authenticate",
            body={"email": email, "password": password},
        )
        return _member_adapter.validate_python(raw)

    async def get_points_balance(self, member_id: str) -> PointsBalance:
        raw = await self._http.get(f"/ocapi/v1/loyalty/members/{member_id}/points")
        return _points_balance_adapter.validate_python(raw)

    async def get_history(
        self, member_id: str, filters: Optional[PointsHistoryFilter] = None
    ) -> PaginatedResponse[PointsTransaction]:
        params: dict[str, str] | None = None
        if filters:
            params = {}
            d = filters.model_dump(exclude_none=True)
            for key, value in d.items():
                params[key] = str(value) if not isinstance(value, str) else value
        raw = await self._http.get(
            f"/ocapi/v1/loyalty/members/{member_id}/history", params=params
        )
        return _paginated_tx_adapter.validate_python(raw)

    async def list_redemption_options(self, member_id: str) -> list[RedemptionOption]:
        raw = await self._http.get(
            f"/ocapi/v1/loyalty/members/{member_id}/redemptions"
        )
        return _redemption_list_adapter.validate_python(raw)

    async def redeem_points(
        self, member_id: str, input: RedeemPointsInput
    ) -> PointsTransaction:
        raw = await self._http.post(
            f"/ocapi/v1/loyalty/members/{member_id}/redeem",
            body=input.model_dump(exclude_none=True),
        )
        return _tx_adapter.validate_python(raw)
