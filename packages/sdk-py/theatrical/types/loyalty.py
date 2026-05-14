"""Loyalty types."""

from __future__ import annotations

from enum import Enum
from typing import Literal, Optional

from theatrical.types.base import ApiModel


class LoyaltyTierName(str, Enum):
    BRONZE = "Bronze"
    SILVER = "Silver"
    GOLD = "Gold"
    PLATINUM = "Platinum"


class LoyaltyTier(ApiModel):
    id: str
    name: LoyaltyTierName
    level: int
    benefits: list[str]
    points_threshold: int


class LoyaltyMember(ApiModel):
    id: str
    email: str
    first_name: str
    last_name: str
    tier: LoyaltyTier
    points: int
    lifetime_points: int
    member_since: str
    subscription_id: Optional[str] = None
    last_activity_date: Optional[str] = None
    active: bool


class PointsTransaction(ApiModel):
    id: str
    member_id: str
    type: Literal["earn", "redeem", "adjust", "expire"]
    points: int
    balance_after: int
    description: str
    created_at: str
    order_id: Optional[str] = None
    site_id: Optional[str] = None


class RedemptionOption(ApiModel):
    id: str
    name: str
    description: str
    points_cost: int
    category: Literal["ticket", "concession", "upgrade", "merchandise"]
    available: bool
    expires_at: Optional[str] = None


class RedeemPointsInput(ApiModel):
    option_id: str
    order_id: Optional[str] = None
    quantity: Optional[int] = None


class PointsHistoryFilter(ApiModel):
    type: Optional[Literal["earn", "redeem", "adjust", "expire"]] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    limit: Optional[int] = None
    offset: Optional[int] = None
