"""Subscription types."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class SubscriptionInterval(str, Enum):
    MONTHLY = "monthly"
    ANNUAL = "annual"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    PENDING = "pending"


class BenefitCategory(str, Enum):
    BOOKING = "booking"
    CONCESSION = "concession"
    COMPANION = "companion"
    PRIORITY = "priority"
    EXCLUSIVE = "exclusive"


class SubscriptionBenefit(BaseModel):
    id: str
    category: BenefitCategory
    name: str
    description: str
    uses_per_period: Optional[int] = None
    active: bool


class SubscriptionPlan(BaseModel):
    id: str
    name: str
    description: str
    price: float
    currency: str
    interval: SubscriptionInterval
    bookings_included: Optional[int] = None
    benefits: list[SubscriptionBenefit]
    available: bool
    minimum_term_months: Optional[int] = None


class SubscriptionUsage(BaseModel):
    subscription_id: str
    member_id: str
    period_start: str
    period_end: str
    bookings_used: int
    bookings_included: Optional[int] = None
    bookings_remaining: Optional[int] = None
    benefit_usage: dict[str, int] = {}


class MemberSubscription(BaseModel):
    id: str
    plan_id: str
    plan: Optional[SubscriptionPlan] = None
    member_id: str
    status: SubscriptionStatus
    start_date: str
    renewal_date: Optional[str] = None
    cancelled_at: Optional[str] = None
    expires_at: Optional[str] = None
    auto_renew: bool
    usage: Optional[SubscriptionUsage] = None


class SuspendSubscriptionInput(BaseModel):
    resume_date: Optional[str] = None
    reason: Optional[str] = None


class CancelSubscriptionInput(BaseModel):
    immediate: Optional[bool] = None
    reason: Optional[str] = None
