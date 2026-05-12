"""Tests that resource stubs are wired up and raise NotImplementedError."""

import pytest
import httpx

from theatrical.resources.sessions import SessionsResource
from theatrical.resources.sites import SitesResource
from theatrical.resources.films import FilmsResource
from theatrical.resources.orders import OrdersResource
from theatrical.resources.loyalty import LoyaltyResource
from theatrical.resources.subscriptions import SubscriptionsResource
from theatrical.resources.pricing import PricingResource
from theatrical.resources.food_and_beverage import FoodAndBeverageResource


@pytest.fixture
def http() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url="https://localhost")


class TestSessionsResource:
    @pytest.mark.asyncio
    async def test_list_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await SessionsResource(http).list()

    @pytest.mark.asyncio
    async def test_get_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await SessionsResource(http).get("ses-001")

    @pytest.mark.asyncio
    async def test_availability_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await SessionsResource(http).availability("ses-001")


class TestSitesResource:
    @pytest.mark.asyncio
    async def test_list_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await SitesResource(http).list()

    @pytest.mark.asyncio
    async def test_get_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await SitesResource(http).get("site-001")


class TestFilmsResource:
    @pytest.mark.asyncio
    async def test_now_showing_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await FilmsResource(http).now_showing()

    @pytest.mark.asyncio
    async def test_coming_soon_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await FilmsResource(http).coming_soon()

    @pytest.mark.asyncio
    async def test_get_detail_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await FilmsResource(http).get_detail("film-001")


class TestOrdersResource:
    @pytest.mark.asyncio
    async def test_create_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await OrdersResource(http).create("ses-001")

    @pytest.mark.asyncio
    async def test_get_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await OrdersResource(http).get("ord-001")

    @pytest.mark.asyncio
    async def test_confirm_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await OrdersResource(http).confirm("ord-001")

    @pytest.mark.asyncio
    async def test_cancel_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await OrdersResource(http).cancel("ord-001")


class TestLoyaltyResource:
    @pytest.mark.asyncio
    async def test_get_member_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await LoyaltyResource(http).get_member("mem-001")

    @pytest.mark.asyncio
    async def test_redemption_options_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await LoyaltyResource(http).redemption_options("mem-001")


class TestSubscriptionsResource:
    @pytest.mark.asyncio
    async def test_list_plans_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await SubscriptionsResource(http).list_plans()

    @pytest.mark.asyncio
    async def test_get_plan_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await SubscriptionsResource(http).get_plan("plan-001")


class TestPricingResource:
    @pytest.mark.asyncio
    async def test_ticket_types_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await PricingResource(http).ticket_types()

    @pytest.mark.asyncio
    async def test_calculate_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await PricingResource(http).calculate("ses-001", "tt-001")


class TestFoodAndBeverageResource:
    @pytest.mark.asyncio
    async def test_categories_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await FoodAndBeverageResource(http).categories("site-001")

    @pytest.mark.asyncio
    async def test_items_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await FoodAndBeverageResource(http).items()

    @pytest.mark.asyncio
    async def test_combos_raises(self, http: httpx.AsyncClient) -> None:
        with pytest.raises(NotImplementedError):
            await FoodAndBeverageResource(http).combos("site-001")
