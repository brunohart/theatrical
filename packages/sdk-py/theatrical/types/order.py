"""Order types."""

from __future__ import annotations

from enum import Enum
from typing import Literal, Optional

from theatrical.types.base import ApiModel


class OrderStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    HELD = "held"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Ticket(ApiModel):
    id: str
    type: str
    seat_id: str
    seat_label: str
    price: float
    discount: Optional[float] = None


class OrderItem(ApiModel):
    id: str
    name: str
    category: str
    quantity: int
    unit_price: float
    total_price: float


class Order(ApiModel):
    id: str
    session_id: str
    status: OrderStatus
    tickets: list[Ticket]
    items: list[OrderItem]
    subtotal: float
    tax: float
    discount: float
    total: float
    currency: str
    loyalty_member_id: Optional[str] = None
    loyalty_points_earned: Optional[int] = None
    loyalty_points_redeemed: Optional[int] = None
    created_at: str
    updated_at: Optional[str] = None
    held_at: Optional[str] = None
    held_until: Optional[str] = None
    confirmed_at: Optional[str] = None
    completed_at: Optional[str] = None
    cancelled_at: Optional[str] = None
    refunded_at: Optional[str] = None


class OrderTransition(ApiModel):
    from_status: OrderStatus
    to_status: OrderStatus
    action: Literal["hold", "release", "confirm", "complete", "cancel", "refund"]


ORDER_TRANSITIONS: list[OrderTransition] = [
    OrderTransition(from_status=OrderStatus.DRAFT, to_status=OrderStatus.HELD, action="hold"),
    OrderTransition(from_status=OrderStatus.HELD, to_status=OrderStatus.PENDING, action="release"),
    OrderTransition(from_status=OrderStatus.PENDING, to_status=OrderStatus.CONFIRMED, action="confirm"),
    OrderTransition(from_status=OrderStatus.CONFIRMED, to_status=OrderStatus.COMPLETED, action="complete"),
    OrderTransition(from_status=OrderStatus.PENDING, to_status=OrderStatus.CANCELLED, action="cancel"),
    OrderTransition(from_status=OrderStatus.HELD, to_status=OrderStatus.CANCELLED, action="cancel"),
    OrderTransition(from_status=OrderStatus.CONFIRMED, to_status=OrderStatus.CANCELLED, action="cancel"),
    OrderTransition(from_status=OrderStatus.CONFIRMED, to_status=OrderStatus.REFUNDED, action="refund"),
    OrderTransition(from_status=OrderStatus.COMPLETED, to_status=OrderStatus.REFUNDED, action="refund"),
]


class TicketInput(ApiModel):
    type: str
    seat_id: str


class AddTicketsInput(ApiModel):
    tickets: list[TicketInput]


class ItemInput(ApiModel):
    menu_item_id: str
    quantity: int


class AddItemsInput(ApiModel):
    items: list[ItemInput]


class ApplyLoyaltyInput(ApiModel):
    member_id: str
    points_to_redeem: Optional[int] = None


class CreateOrderInput(ApiModel):
    session_id: str
    tickets: list[TicketInput]
    items: Optional[list[ItemInput]] = None
    loyalty_member_id: Optional[str] = None


class OrderHistoryFilter(ApiModel):
    status: Optional[OrderStatus] = None
    since: Optional[str] = None
    until: Optional[str] = None
    limit: Optional[int] = None
    cursor: Optional[str] = None
