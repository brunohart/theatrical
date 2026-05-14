"""Session (showtime) types."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from theatrical.types.base import ApiModel


class SessionFormat(str, Enum):
    TWO_D = "2D"
    THREE_D = "3D"
    IMAX = "IMAX"
    IMAX3D = "IMAX3D"
    FOUR_DX = "4DX"
    DOLBY_CINEMA = "DOLBY_CINEMA"
    SCREENX = "SCREENX"
    STANDARD = "STANDARD"


class SeatStatus(str, Enum):
    AVAILABLE = "available"
    TAKEN = "taken"
    RESERVED = "reserved"
    WHEELCHAIR = "wheelchair"
    COMPANION = "companion"
    BLOCKED = "blocked"


class Session(ApiModel):
    id: str
    film_id: str
    film_title: str
    site_id: str
    screen_id: str
    screen_name: str
    start_time: str
    end_time: str
    format: SessionFormat
    is_bookable: bool
    is_sold_out: bool
    seats_available: int
    seats_total: int
    price_from: Optional[float] = None
    currency: Optional[str] = None
    attributes: dict[str, str] = {}


class SessionFilter(ApiModel):
    site_id: Optional[str] = None
    film_id: Optional[str] = None
    date: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    format: Optional[SessionFormat] = None
    bookable_only: Optional[bool] = None
    limit: Optional[int] = None
    offset: Optional[int] = None
    cursor: Optional[str] = None


class SessionListResponse(ApiModel):
    sessions: list[Session]
    total: int
    has_more: bool
    next_offset: Optional[int] = None
    next_cursor: Optional[str] = None


class Seat(ApiModel):
    id: str
    row: str
    number: int
    status: SeatStatus
    x: float
    y: float
    type: Optional[str] = None
    is_accessible: bool


class SeatAvailability(ApiModel):
    session_id: str
    screen_name: str
    seats: list[Seat]
    row_count: int
    screen_position: str
    available_count: int
    total_count: int
