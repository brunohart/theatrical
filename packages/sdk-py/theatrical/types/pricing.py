"""Pricing types."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class SessionPricingFormat(str, Enum):
    STANDARD = "standard"
    IMAX = "imax"
    FOUR_DX = "4dx"
    SCREENX = "screenx"
    DOLBY = "dolby"
    VMAX = "vmax"
    GOLD_CLASS = "gold-class"


class DayPart(str, Enum):
    MATINEE = "matinee"
    AFTERNOON = "afternoon"
    PEAK = "peak"
    LATE = "late"


class TicketCategory(str, Enum):
    ADULT = "adult"
    CHILD = "child"
    SENIOR = "senior"
    STUDENT = "student"
    FAMILY = "family"
    CONCESSION = "concession"
    LOYALTY_MEMBER = "loyalty-member"


class TicketType(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: float
    currency: str
    category: TicketCategory
    is_default: bool
    requires_loyalty: bool
    minimum_age: Optional[int] = None
    maximum_age: Optional[int] = None
    is_available: bool


class TicketTypeFilter(BaseModel):
    session_id: str
    category: Optional[TicketCategory] = None
    available_only: Optional[bool] = None


class TaxConfig(BaseModel):
    currency: str
    rate: float
    label: str
    inclusive: bool


class DiscountSource(str, Enum):
    LOYALTY_TIER = "loyalty-tier"
    COUPON = "coupon"
    PROMO = "promo"
    MEMBER = "member"
    EMPLOYEE = "employee"
    GROUP = "group"


class Discount(BaseModel):
    id: str
    source: DiscountSource
    label: str
    amount: float
    percentage: Optional[float] = None
    coupon_code: Optional[str] = None


class SurchargeReason(str, Enum):
    FORMAT = "format"
    SEAT_TYPE = "seat-type"
    BOOKING_FEE = "booking-fee"
    SERVICE_FEE = "service-fee"
    PEAK_SURCHARGE = "peak-surcharge"


class Surcharge(BaseModel):
    id: str
    reason: SurchargeReason
    label: str
    amount: float


class PriceBreakdown(BaseModel):
    base_price: float
    discounts: list[Discount]
    surcharges: list[Surcharge]
    tax_amount: float
    total_discount: float
    total_surcharge: float
    price_per_ticket: float
    total_price: float
    quantity: int
    currency: str
    tax_config: TaxConfig


class PriceCalculation(BaseModel):
    session_id: str
    ticket_type_id: str
    total_price: float
    currency: str
    tax_inclusive: bool
    breakdown: PriceBreakdown
    valid_until: str


class ApplyCouponsInput(BaseModel):
    session_id: str
    ticket_type_id: str
    quantity: int
    coupon_codes: list[str]
    membership_id: Optional[str] = None


class RejectedCoupon(BaseModel):
    code: str
    reason: str


class CouponApplicationResult(BaseModel):
    applied: list[Discount]
    rejected: list[RejectedCoupon]
    updated_breakdown: PriceBreakdown
