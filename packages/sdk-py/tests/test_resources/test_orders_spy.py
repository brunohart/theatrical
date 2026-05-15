"""Spy-based tests for OrdersResource — URL, param, and response verification."""

from __future__ import annotations

import pytest

from tests.conftest import SpyHttpProtocol
from theatrical.errors.exceptions import NotFoundError, ValidationError
from theatrical.resources.orders import OrdersResource
from theatrical.types.order import (
    AddItemsInput,
    AddTicketsInput,
    ApplyLoyaltyInput,
    CreateOrderInput,
    ItemInput,
    OrderHistoryFilter,
    OrderStatus,
    TicketInput,
)


def _order_dict(**overrides: object) -> dict[str, object]:
    base = {
        "id": "ord_001",
        "sessionId": "ses_roxy_holdovers_20260410_1915",
        "status": "draft",
        "tickets": [
            {"id": "tkt_001", "type": "adult", "seatId": "H7", "seatLabel": "H7", "price": 19.50},
            {"id": "tkt_002", "type": "adult", "seatId": "H8", "seatLabel": "H8", "price": 19.50},
        ],
        "items": [],
        "subtotal": 39.00,
        "tax": 5.22,
        "discount": 0,
        "total": 39.00,
        "currency": "NZD",
        "createdAt": "2026-04-10T18:00:00+12:00",
    }
    base.update(overrides)
    return base


def _paginated_orders(**overrides: object) -> dict[str, object]:
    base = {
        "data": [_order_dict(status="completed")],
        "total": 1,
        "hasMore": False,
        "strategy": "cursor",
    }
    base.update(overrides)
    return base


class TestCreateAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict())
        res = OrdersResource(spy)
        await res.create(CreateOrderInput(
            session_id="ses_001", tickets=[TicketInput(type="adult", seat_id="H7")],
        ))
        assert spy.last_call.method == "POST"
        assert spy.last_call.path == "/ocapi/v1/orders"

    async def test_sends_request_body(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict())
        res = OrdersResource(spy)
        await res.create(CreateOrderInput(
            session_id="ses_001",
            tickets=[TicketInput(type="adult", seat_id="H7")],
            loyalty_member_id="mem_001",
        ))
        assert spy.last_call.body is not None

    async def test_returns_draft_order(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict(status="draft"))
        res = OrdersResource(spy)
        result = await res.create(CreateOrderInput(
            session_id="ses_001", tickets=[TicketInput(type="adult", seat_id="H7")],
        ))
        assert result.status.value == "draft"
        assert len(result.tickets) == 2


class TestGetAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict())
        res = OrdersResource(spy)
        await res.get("ord_001")
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/orders/ord_001"

    async def test_returns_order_totals(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict(total=44.22))
        res = OrdersResource(spy)
        result = await res.get("ord_001")
        assert result.subtotal == 39.00
        assert result.tax == 5.22
        assert result.total == 44.22
        assert result.currency == "NZD"


class TestAddTicketsAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict())
        res = OrdersResource(spy)
        await res.add_tickets("ord_001", AddTicketsInput(
            tickets=[TicketInput(type="child", seat_id="H9")],
        ))
        assert spy.last_call.method == "POST"
        assert spy.last_call.path == "/ocapi/v1/orders/ord_001/tickets"


class TestAddItemsAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict())
        res = OrdersResource(spy)
        await res.add_items("ord_001", AddItemsInput(
            items=[ItemInput(menu_item_id="item_popcorn", quantity=2)],
        ))
        assert spy.last_call.method == "POST"
        assert spy.last_call.path == "/ocapi/v1/orders/ord_001/items"


class TestConfirmAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict(status="confirmed"))
        res = OrdersResource(spy)
        await res.confirm("ord_001")
        assert spy.last_call.method == "POST"
        assert spy.last_call.path == "/ocapi/v1/orders/ord_001/confirm"

    async def test_returns_confirmed_status(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict(status="confirmed"))
        res = OrdersResource(spy)
        result = await res.confirm("ord_001")
        assert result.status.value == "confirmed"


class TestCancelAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict(status="cancelled"))
        res = OrdersResource(spy)
        await res.cancel("ord_001")
        assert spy.last_call.method == "POST"
        assert spy.last_call.path == "/ocapi/v1/orders/ord_001/cancel"

    async def test_returns_cancelled_status(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict(status="cancelled"))
        res = OrdersResource(spy)
        result = await res.cancel("ord_001")
        assert result.status.value == "cancelled"


class TestApplyLoyaltyAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict())
        res = OrdersResource(spy)
        await res.apply_loyalty("ord_001", ApplyLoyaltyInput(member_id="mem_001", points_to_redeem=500))
        assert spy.last_call.method == "POST"
        assert spy.last_call.path == "/ocapi/v1/orders/ord_001/loyalty"

    async def test_sends_input_body(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict())
        res = OrdersResource(spy)
        await res.apply_loyalty("ord_001", ApplyLoyaltyInput(member_id="mem_001", points_to_redeem=500))
        assert spy.last_call.body is not None


class TestRefundAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict(status="refunded"))
        res = OrdersResource(spy)
        await res.refund("ord_001")
        assert spy.last_call.method == "POST"
        assert spy.last_call.path == "/ocapi/v1/orders/ord_001/refund"

    async def test_returns_refunded_status(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict(status="refunded"))
        res = OrdersResource(spy)
        result = await res.refund("ord_001")
        assert result.status.value == "refunded"


class TestCompleteAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict(status="completed"))
        res = OrdersResource(spy)
        await res.complete("ord_001")
        assert spy.last_call.method == "POST"
        assert spy.last_call.path == "/ocapi/v1/orders/ord_001/complete"

    async def test_returns_completed_status(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_order_dict(status="completed"))
        res = OrdersResource(spy)
        result = await res.complete("ord_001")
        assert result.status.value == "completed"


class TestHistoryAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_paginated_orders())
        res = OrdersResource(spy)
        await res.history("mem_001")
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/members/mem_001/orders"

    async def test_passes_status_filter(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_paginated_orders())
        res = OrdersResource(spy)
        await res.history("mem_001", OrderHistoryFilter(status=OrderStatus.COMPLETED))
        assert spy.last_call.params is not None
        assert spy.last_call.params["status"] == "completed"

    async def test_passes_date_range_filter(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_paginated_orders(data=[], total=0))
        res = OrdersResource(spy)
        await res.history("mem_001", OrderHistoryFilter(since="2026-01-01", until="2026-04-10"))
        assert spy.last_call.params is not None
        assert spy.last_call.params["since"] == "2026-01-01"
        assert spy.last_call.params["until"] == "2026-04-10"

    async def test_passes_cursor_pagination(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_paginated_orders())
        res = OrdersResource(spy)
        await res.history("mem_001", OrderHistoryFilter(limit=5, cursor="cur_page1"))
        assert spy.last_call.params is not None
        assert spy.last_call.params["limit"] == "5"
        assert spy.last_call.params["cursor"] == "cur_page1"

    async def test_sends_no_params_without_filter(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_paginated_orders())
        res = OrdersResource(spy)
        await res.history("mem_001")
        assert spy.last_call.params is None


class TestErrorPropagation:
    async def test_create_propagates_validation_error(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(ValidationError("Invalid session ID"))
        res = OrdersResource(spy)
        with pytest.raises(ValidationError):
            await res.create(CreateOrderInput(
                session_id="", tickets=[TicketInput(type="adult", seat_id="H7")],
            ))

    async def test_get_propagates_not_found(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(NotFoundError("Order", "ord_nonexistent"))
        res = OrdersResource(spy)
        with pytest.raises(NotFoundError):
            await res.get("ord_nonexistent")

    async def test_confirm_propagates_validation_error(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(ValidationError("Cannot confirm empty order"))
        res = OrdersResource(spy)
        with pytest.raises(ValidationError, match="[Cc]onfirm"):
            await res.confirm("ord_empty")
