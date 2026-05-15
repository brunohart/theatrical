"""Spy-based tests for PricingResource — URL, param, and response verification."""

from __future__ import annotations

import pytest

from tests.conftest import SpyHttpProtocol
from theatrical.errors.exceptions import NotFoundError, ValidationError
from theatrical.resources.pricing import PricingResource
from theatrical.types.pricing import ApplyCouponsInput, TicketCategory, TicketTypeFilter


def _ticket_type_dict(**overrides: object) -> dict[str, object]:
    base = {
        "id": "tt_adult",
        "name": "Adult",
        "description": "Standard adult ticket",
        "price": 19.50,
        "currency": "NZD",
        "category": "adult",
        "isDefault": True,
        "requiresLoyalty": False,
        "isAvailable": True,
    }
    base.update(overrides)
    return base


def _breakdown_dict(**overrides: object) -> dict[str, object]:
    base = {
        "basePrice": 19.50,
        "discounts": [],
        "surcharges": [],
        "taxAmount": 2.93,
        "totalDiscount": 0,
        "totalSurcharge": 0,
        "pricePerTicket": 22.43,
        "totalPrice": 22.43,
        "quantity": 1,
        "currency": "NZD",
        "taxConfig": {
            "currency": "NZD",
            "rate": 0.15,
            "label": "GST",
            "inclusive": True,
        },
    }
    base.update(overrides)
    return base


def _price_calculation_dict(**overrides: object) -> dict[str, object]:
    base = {
        "sessionId": "ses_001",
        "ticketTypeId": "tt_adult",
        "totalPrice": 22.43,
        "currency": "NZD",
        "taxInclusive": True,
        "breakdown": _breakdown_dict(),
        "validUntil": "2026-05-14T01:00:00Z",
    }
    base.update(overrides)
    return base


def _coupon_result_dict(**overrides: object) -> dict[str, object]:
    base: dict[str, object] = {
        "applied": [{
            "id": "disc_save10",
            "source": "coupon",
            "label": "SAVE10 — 10% off",
            "amount": 1.95,
            "percentage": 10.0,
            "couponCode": "SAVE10",
        }],
        "rejected": [],
        "updatedBreakdown": _breakdown_dict(
            totalDiscount=1.95,
            discounts=[{
                "id": "disc_save10",
                "source": "coupon",
                "label": "SAVE10 — 10% off",
                "amount": 1.95,
                "percentage": 10.0,
                "couponCode": "SAVE10",
            }],
        ),
    }
    base.update(overrides)
    return base


class TestGetTicketTypesAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_ticket_type_dict()])
        res = PricingResource(spy)
        await res.ticket_types("ses_001")
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/sessions/ses_001/ticket-types"

    async def test_passes_category_filter(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_ticket_type_dict()])
        res = PricingResource(spy)
        await res.ticket_types("ses_001", TicketTypeFilter(session_id="ses_001", category=TicketCategory.ADULT))
        assert spy.last_call.params is not None
        assert spy.last_call.params["category"] == "adult"

    async def test_passes_available_only_flag(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_ticket_type_dict()])
        res = PricingResource(spy)
        await res.ticket_types("ses_001", TicketTypeFilter(session_id="ses_001", available_only=True))
        assert spy.last_call.params is not None
        assert spy.last_call.params["available_only"] == "True"

    async def test_sends_no_params_without_filter(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_ticket_type_dict()])
        res = PricingResource(spy)
        await res.ticket_types("ses_001")
        assert spy.last_call.params is None

    async def test_returns_multiple_types(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([
            _ticket_type_dict(id="tt_adult", name="Adult", price=19.50),
            _ticket_type_dict(id="tt_child", name="Child", price=12.00, category="child"),
            _ticket_type_dict(id="tt_senior", name="Senior", price=14.00, category="senior"),
        ])
        res = PricingResource(spy)
        result = await res.ticket_types("ses_001")
        assert len(result) == 3
        assert result[0].name == "Adult"
        assert result[1].price == 12.00
        assert result[2].id == "tt_senior"

    async def test_returns_availability_status(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([
            _ticket_type_dict(isAvailable=True),
            _ticket_type_dict(id="tt_vip", name="VIP", isAvailable=False),
        ])
        res = PricingResource(spy)
        result = await res.ticket_types("ses_001")
        assert result[0].is_available is True
        assert result[1].is_available is False


class TestCalculateAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_price_calculation_dict())
        res = PricingResource(spy)
        await res.calculate("ses_001", "tt_adult", 2)
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/pricing/calculate"

    async def test_passes_query_params(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_price_calculation_dict())
        res = PricingResource(spy)
        await res.calculate("ses_001", "tt_adult", 2)
        assert spy.last_call.params is not None
        assert spy.last_call.params["sessionId"] == "ses_001"
        assert spy.last_call.params["ticketTypeId"] == "tt_adult"
        assert spy.last_call.params["quantity"] == "2"

    async def test_defaults_quantity_to_one(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_price_calculation_dict())
        res = PricingResource(spy)
        await res.calculate("ses_001", "tt_adult")
        assert spy.last_call.params is not None
        assert spy.last_call.params["quantity"] == "1"

    async def test_returns_calculation(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_price_calculation_dict())
        res = PricingResource(spy)
        result = await res.calculate("ses_001", "tt_adult", 2)
        assert result.total_price == 22.43
        assert result.currency == "NZD"


class TestApplyCouponsAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_coupon_result_dict())
        res = PricingResource(spy)
        await res.apply_coupons(ApplyCouponsInput(
            session_id="ses_001", ticket_type_id="tt_adult", quantity=2, coupon_codes=["SAVE10"],
        ))
        assert spy.last_call.method == "POST"
        assert spy.last_call.path == "/ocapi/v1/pricing/apply-coupons"

    async def test_sends_input_body(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_coupon_result_dict())
        res = PricingResource(spy)
        await res.apply_coupons(ApplyCouponsInput(
            session_id="ses_001", ticket_type_id="tt_adult", quantity=1, coupon_codes=["CODE1", "CODE2"],
        ))
        assert spy.last_call.body is not None

    async def test_returns_applied_coupons(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_coupon_result_dict())
        res = PricingResource(spy)
        result = await res.apply_coupons(ApplyCouponsInput(
            session_id="ses_001", ticket_type_id="tt_adult", quantity=1, coupon_codes=["SAVE10"],
        ))
        assert len(result.applied) == 1
        assert result.applied[0].coupon_code == "SAVE10"
        assert result.applied[0].amount == 1.95

    async def test_returns_rejected_coupons(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_coupon_result_dict(
            applied=[], rejected=[{"code": "EXPIRED", "reason": "Coupon has expired"}],
        ))
        res = PricingResource(spy)
        result = await res.apply_coupons(ApplyCouponsInput(
            session_id="ses_001", ticket_type_id="tt_adult", quantity=1, coupon_codes=["EXPIRED"],
        ))
        assert len(result.rejected) == 1
        assert result.rejected[0].code == "EXPIRED"


class TestErrorPropagation:
    async def test_ticket_types_propagates_not_found(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(NotFoundError("Session", "ses_nonexistent"))
        res = PricingResource(spy)
        with pytest.raises(NotFoundError):
            await res.ticket_types("ses_nonexistent")

    async def test_apply_coupons_propagates_validation_error(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(ValidationError("Invalid coupon code"))
        res = PricingResource(spy)
        with pytest.raises(ValidationError):
            await res.apply_coupons(ApplyCouponsInput(
                session_id="ses_001", ticket_type_id="tt_adult", quantity=1, coupon_codes=[""],
            ))
