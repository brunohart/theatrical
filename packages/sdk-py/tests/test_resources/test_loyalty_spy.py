"""Spy-based tests for LoyaltyResource — URL, param, and response verification."""

from __future__ import annotations

import pytest

from tests.conftest import SpyHttpProtocol
from theatrical.errors.exceptions import AuthenticationError, NotFoundError
from theatrical.resources.loyalty import LoyaltyResource
from theatrical.types.loyalty import PointsHistoryFilter, RedeemPointsInput


def _member_dict(**overrides: object) -> dict[str, object]:
    base = {
        "id": "mem_001",
        "email": "hemi@example.co.nz",
        "firstName": "Hemi",
        "lastName": "Walker",
        "tier": {
            "id": "tier_gold",
            "name": "Gold",
            "level": 3,
            "benefits": ["10% off tickets", "Free popcorn monthly"],
            "pointsThreshold": 5000,
        },
        "points": 2840,
        "lifetimePoints": 8640,
        "memberSince": "2024-01-15",
        "active": True,
    }
    base.update(overrides)
    return base


def _transaction_dict(**overrides: object) -> dict[str, object]:
    base = {
        "id": "txn_001",
        "memberId": "mem_001",
        "type": "earn",
        "points": 50,
        "balanceAfter": 2890,
        "description": "Ticket purchase",
        "createdAt": "2026-04-10T20:00:00+12:00",
        "orderId": "ord_001",
    }
    base.update(overrides)
    return base


class TestGetMemberAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_member_dict())
        res = LoyaltyResource(spy)
        await res.get_member("mem_001")
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/loyalty/members/mem_001"

    async def test_returns_member_details(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_member_dict(points=5000))
        res = LoyaltyResource(spy)
        result = await res.get_member("mem_002")
        assert result.first_name == "Hemi"
        assert result.points == 5000


class TestAuthenticateAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_member_dict())
        res = LoyaltyResource(spy)
        await res.authenticate("hemi@example.co.nz", "password123")
        assert spy.last_call.method == "POST"
        assert spy.last_call.path == "/ocapi/v1/loyalty/authenticate"

    async def test_sends_credentials(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_member_dict())
        res = LoyaltyResource(spy)
        await res.authenticate("hemi@example.co.nz", "password123")
        assert spy.last_call.body is not None
        assert spy.last_call.body["email"] == "hemi@example.co.nz"


class TestGetPointsBalanceAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({"points": 1250, "lifetimePoints": 8500})
        res = LoyaltyResource(spy)
        await res.get_points_balance("mem_001")
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/loyalty/members/mem_001/points"

    async def test_returns_balance(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({"points": 1250, "lifetimePoints": 8500})
        res = LoyaltyResource(spy)
        result = await res.get_points_balance("mem_001")
        assert result.points == 1250
        assert result.lifetime_points == 8500


class TestGetHistoryAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({
            "data": [_transaction_dict()], "total": 1, "hasMore": False, "strategy": "offset",
        })
        res = LoyaltyResource(spy)
        await res.get_history("mem_001")
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/loyalty/members/mem_001/history"

    async def test_passes_type_filter(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({
            "data": [_transaction_dict(type="earn")], "total": 1, "hasMore": False, "strategy": "offset",
        })
        res = LoyaltyResource(spy)
        await res.get_history("mem_001", PointsHistoryFilter(type="earn"))
        assert spy.last_call.params is not None
        assert spy.last_call.params["type"] == "earn"

    async def test_passes_date_range(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({
            "data": [], "total": 0, "hasMore": False, "strategy": "offset",
        })
        res = LoyaltyResource(spy)
        await res.get_history("mem_001", PointsHistoryFilter(from_date="2026-01-01", to_date="2026-06-01"))
        assert spy.last_call.params is not None
        assert spy.last_call.params["from_date"] == "2026-01-01"
        assert spy.last_call.params["to_date"] == "2026-06-01"

    async def test_passes_offset_pagination(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({
            "data": [_transaction_dict()], "total": 50, "hasMore": True, "strategy": "offset",
        })
        res = LoyaltyResource(spy)
        await res.get_history("mem_001", PointsHistoryFilter(limit=10, offset=20))
        assert spy.last_call.params is not None
        assert spy.last_call.params["limit"] == "10"
        assert spy.last_call.params["offset"] == "20"

    async def test_sends_no_params_without_filter(self) -> None:
        spy = SpyHttpProtocol().enqueue_response({
            "data": [], "total": 0, "hasMore": False, "strategy": "offset",
        })
        res = LoyaltyResource(spy)
        await res.get_history("mem_001")
        assert spy.last_call.params is None


class TestListRedemptionOptionsAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([{
            "id": "opt_001", "name": "Free Popcorn", "description": "Free large popcorn at any site",
            "pointsCost": 500, "category": "concession", "available": True,
        }])
        res = LoyaltyResource(spy)
        await res.list_redemption_options("mem_001")
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/loyalty/members/mem_001/redemptions"

    async def test_returns_options(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([
            {"id": "opt_001", "name": "Free Popcorn", "description": "Free large popcorn", "pointsCost": 500, "category": "concession", "available": True},
            {"id": "opt_002", "name": "Free Ticket", "description": "Free standard ticket", "pointsCost": 2000, "category": "ticket", "available": True},
        ])
        res = LoyaltyResource(spy)
        result = await res.list_redemption_options("mem_001")
        assert len(result) == 2
        assert result[0].points_cost == 500
        assert result[1].name == "Free Ticket"


class TestRedeemPointsAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_transaction_dict(type="redeem", points=-500))
        res = LoyaltyResource(spy)
        await res.redeem_points("mem_001", RedeemPointsInput(option_id="opt_001"))
        assert spy.last_call.method == "POST"
        assert spy.last_call.path == "/ocapi/v1/loyalty/members/mem_001/redeem"

    async def test_sends_input(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_transaction_dict(type="redeem", points=-500))
        res = LoyaltyResource(spy)
        await res.redeem_points("mem_001", RedeemPointsInput(option_id="opt_001", quantity=2))
        assert spy.last_call.body is not None


class TestErrorPropagation:
    async def test_get_member_propagates_not_found(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(NotFoundError("Member", "mem_nonexistent"))
        res = LoyaltyResource(spy)
        with pytest.raises(NotFoundError):
            await res.get_member("mem_nonexistent")

    async def test_authenticate_propagates_auth_error(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(AuthenticationError("Invalid credentials"))
        res = LoyaltyResource(spy)
        with pytest.raises(AuthenticationError):
            await res.authenticate("bad@example.com", "wrong")
