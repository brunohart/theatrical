"""Loyalty resource — member management, points, tiers."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from theatrical.types.loyalty import (
    LoyaltyMember,
    PointsHistoryFilter,
    PointsTransaction,
    RedeemPointsInput,
    RedemptionOption,
)

if TYPE_CHECKING:
    from theatrical.http.client import TheatricalHttpProtocol


class LoyaltyResource:
    def __init__(self, http: TheatricalHttpProtocol) -> None:
        self._http = http

    async def get_member(self, member_id: str) -> LoyaltyMember:
        raise NotImplementedError

    async def points_history(
        self, member_id: str, filters: Optional[PointsHistoryFilter] = None
    ) -> list[PointsTransaction]:
        raise NotImplementedError

    async def redemption_options(self, member_id: str) -> list[RedemptionOption]:
        raise NotImplementedError

    async def redeem(self, member_id: str, input: RedeemPointsInput) -> PointsTransaction:
        raise NotImplementedError
