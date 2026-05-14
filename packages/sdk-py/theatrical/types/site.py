"""Site (cinema location) types."""

from __future__ import annotations

from typing import Optional

from theatrical.types.base import ApiModel


class GeoLocation(ApiModel):
    latitude: float
    longitude: float


class Address(ApiModel):
    line1: str
    line2: Optional[str] = None
    city: str
    state: Optional[str] = None
    postal_code: str
    country: str


class Screen(ApiModel):
    id: str
    name: str
    seat_count: int
    formats: list[str]
    is_accessible: bool


class Amenity(ApiModel):
    id: str
    label: str
    icon: Optional[str] = None


class SiteConfig(ApiModel):
    booking_lead_time: int
    max_tickets_per_order: int
    loyalty_enabled: bool
    fnb_enabled: bool


class Site(ApiModel):
    id: str
    name: str
    address: Address
    location: GeoLocation
    screens: list[Screen]
    config: SiteConfig
    timezone: str
    currency: str
    is_active: bool
    amenities: Optional[list[Amenity]] = None
