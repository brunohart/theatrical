"""Spy-based tests for SubscriptionsResource — URL, param, and response verification."""

from __future__ import annotations

import pytest

from tests.conftest import SpyHttpProtocol
from theatrical.errors.exceptions import NotFoundError
from theatrical.resources.subscriptions import SubscriptionsResource
from theatrical.types.subscription import CancelSubscriptionInput, SuspendSubscriptionInput


def _benefit_dict(**overrides: object) -> dict[str, object]:
    base = {
        "id": "ben_unlimited_bookings",
        "category": "booking",
        "name": "Unlimited Standard Bookings",
        "description": "Book any standard screening",
        "active": True,
    }
    base.update(overrides)
    return base


def _plan_dict(**overrides: object) -> dict[str, object]:
    base = {
        "id": "plan_unlimited",
        "name": "Unlimited",
        "description": "Unlimited movies every month",
        "price": 29.99,
        "currency": "NZD",
        "interval": "monthly",
        "benefits": [_benefit_dict()],
        "available": True,
    }
    base.update(overrides)
    return base


def _member_subscription_dict(**overrides: object) -> dict[str, object]:
    base = {
        "id": "sub_001",
        "planId": "plan_unlimited",
        "memberId": "mem_001",
        "status": "active",
        "startDate": "2026-01-01",
        "renewalDate": "2026-05-01",
        "autoRenew": True,
    }
    base.update(overrides)
    return base


class TestListPlansAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_plan_dict()])
        res = SubscriptionsResource(spy)
        await res.list_plans()
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/subscriptions/plans"

    async def test_passes_site_id(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_plan_dict()])
        res = SubscriptionsResource(spy)
        await res.list_plans(site_id="site_roxy")
        assert spy.last_call.params is not None
        assert spy.last_call.params["siteId"] == "site_roxy"

    async def test_passes_include_unavailable(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_plan_dict(), _plan_dict(id="plan_legacy", available=False)])
        res = SubscriptionsResource(spy)
        await res.list_plans(include_unavailable=True)
        assert spy.last_call.params is not None
        assert spy.last_call.params["includeUnavailable"] == "true"

    async def test_sends_no_params_by_default(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_plan_dict()])
        res = SubscriptionsResource(spy)
        await res.list_plans()
        assert spy.last_call.params is None

    async def test_returns_plan_details(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([
            _plan_dict(name="Basic", price=14.99),
            _plan_dict(name="Unlimited", price=29.99),
        ])
        res = SubscriptionsResource(spy)
        result = await res.list_plans()
        assert len(result) == 2
        assert result[0].name == "Basic"
        assert result[0].price == 14.99
        assert result[1].price == 29.99

    async def test_returns_benefits(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_plan_dict()])
        res = SubscriptionsResource(spy)
        result = await res.list_plans()
        assert len(result[0].benefits) == 1
        assert result[0].benefits[0].name == "Unlimited Standard Bookings"


class TestGetMemberSubscriptionAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_member_subscription_dict())
        res = SubscriptionsResource(spy)
        await res.get_member_subscription("mem_001")
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/subscriptions/members/mem_001"

    async def test_returns_subscription(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_member_subscription_dict(status="active"))
        res = SubscriptionsResource(spy)
        result = await res.get_member_subscription("mem_001")
        assert result.member_id == "mem_001"
        assert result.status.value == "active"
        assert result.plan_id == "plan_unlimited"


class TestGetUsageAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({
            "subscriptionId": "sub_001", "memberId": "mem_001",
            "periodStart": "2026-04-01", "periodEnd": "2026-04-30",
            "bookingsUsed": 3,
        })
        res = SubscriptionsResource(spy)
        await res.get_usage("mem_001")
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/subscriptions/members/mem_001/usage"

    async def test_returns_usage_details(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({
            "subscriptionId": "sub_001", "memberId": "mem_001",
            "periodStart": "2026-04-01", "periodEnd": "2026-04-30",
            "bookingsUsed": 3, "bookingsRemaining": 7,
            "benefitUsage": {"ben_unlimited": 3, "ben_fnb": 2},
        })
        res = SubscriptionsResource(spy)
        result = await res.get_usage("mem_001")
        assert result.bookings_used == 3
        assert result.bookings_remaining == 7
        assert len(result.benefit_usage) == 2
        assert result.benefit_usage["ben_unlimited"] == 3


class TestCheckBenefitEligibilityAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({"eligible": True, "usesRemaining": 5})
        res = SubscriptionsResource(spy)
        await res.check_benefit_eligibility("mem_001", "unlimited_2d")
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/subscriptions/members/mem_001/benefits/unlimited_2d/eligibility"

    async def test_returns_eligible(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({"eligible": True, "usesRemaining": 5})
        res = SubscriptionsResource(spy)
        result = await res.check_benefit_eligibility("mem_001", "unlimited_2d")
        assert result.eligible is True
        assert result.uses_remaining == 5

    async def test_returns_ineligible_with_reason(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({
            "eligible": False, "usesRemaining": 0, "reason": "Monthly limit reached",
        })
        res = SubscriptionsResource(spy)
        result = await res.check_benefit_eligibility("mem_001", "imax")
        assert result.eligible is False
        assert result.uses_remaining == 0
        assert result.reason == "Monthly limit reached"


class TestSuspendAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_member_subscription_dict(status="paused"))
        res = SubscriptionsResource(spy)
        await res.suspend("mem_001")
        assert spy.last_call.method == "POST"
        assert spy.last_call.path == "/ocapi/v1/subscriptions/members/mem_001/suspend"

    async def test_sends_input(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_member_subscription_dict(status="paused"))
        res = SubscriptionsResource(spy)
        await res.suspend("mem_001", SuspendSubscriptionInput(reason="Travelling"))
        assert spy.last_call.body is not None

    async def test_returns_suspended_status(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_member_subscription_dict(status="paused"))
        res = SubscriptionsResource(spy)
        result = await res.suspend("mem_001")
        assert result.status.value == "paused"


class TestCancelAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_member_subscription_dict(status="cancelled"))
        res = SubscriptionsResource(spy)
        await res.cancel("mem_001")
        assert spy.last_call.method == "POST"
        assert spy.last_call.path == "/ocapi/v1/subscriptions/members/mem_001/cancel"

    async def test_sends_input(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_member_subscription_dict(status="cancelled"))
        res = SubscriptionsResource(spy)
        await res.cancel("mem_001", CancelSubscriptionInput(reason="Too expensive"))
        assert spy.last_call.body is not None

    async def test_returns_cancelled_status(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_member_subscription_dict(status="cancelled"))
        res = SubscriptionsResource(spy)
        result = await res.cancel("mem_001")
        assert result.status.value == "cancelled"


class TestErrorPropagation:
    async def test_get_member_subscription_propagates_not_found(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(NotFoundError("Subscription", "mem_nonexistent"))
        res = SubscriptionsResource(spy)
        with pytest.raises(NotFoundError):
            await res.get_member_subscription("mem_nonexistent")
