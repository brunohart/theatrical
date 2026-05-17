"""Tests that resource methods work correctly via the mock adapter."""

import pytest

from theatrical.mock.adapter import MockHttpAdapter
from theatrical.resources.sessions import SessionsResource
from theatrical.resources.sites import SitesResource
from theatrical.resources.films import FilmsResource
from theatrical.resources.orders import OrdersResource
from theatrical.resources.loyalty import LoyaltyResource
from theatrical.resources.subscriptions import SubscriptionsResource
from theatrical.resources.pricing import PricingResource
from theatrical.resources.food_and_beverage import FoodAndBeverageResource
from theatrical.types.order import CreateOrderInput, TicketInput, AddTicketsInput, AddItemsInput, ItemInput, ApplyLoyaltyInput
from theatrical.types.loyalty import RedeemPointsInput
from theatrical.types.subscription import SuspendSubscriptionInput, CancelSubscriptionInput
from theatrical.types.pricing import ApplyCouponsInput
from theatrical.types.menu import AddToOrderInput, FnbOrderLineItem
from theatrical.types.film import FilmFilter, FilmSearchFilter


@pytest.fixture
def mock() -> MockHttpAdapter:
    return MockHttpAdapter()


class TestSessionsResource:
    @pytest.mark.asyncio
    async def test_list(self, mock: MockHttpAdapter) -> None:
        res = SessionsResource(mock)
        response = await res.list()
        assert response.total == 2
        assert len(response.sessions) == 2
        assert response.sessions[0].id == "ses_roxy_holdovers_20260427_1915"
        assert response.sessions[0].film_title == "The Holdovers"
        assert response.has_more is False

    @pytest.mark.asyncio
    async def test_get(self, mock: MockHttpAdapter) -> None:
        res = SessionsResource(mock)
        session = await res.get("ses_roxy_holdovers_20260427_1915")
        assert session.id == "ses_roxy_holdovers_20260427_1915"
        assert session.film_id == "film_holdovers_2023"
        assert session.is_bookable is True
        assert session.seats_available == 74

    @pytest.mark.asyncio
    async def test_availability(self, mock: MockHttpAdapter) -> None:
        res = SessionsResource(mock)
        avail = await res.availability("ses_roxy_holdovers_20260427_1915")
        assert avail.session_id == "ses_roxy_holdovers_20260427_1915"
        assert avail.screen_name == "Screen 3"
        assert avail.available_count == 74
        assert avail.total_count == 120
        assert len(avail.seats) == 120

    @pytest.mark.asyncio
    async def test_list_paginated(self, mock: MockHttpAdapter) -> None:
        res = SessionsResource(mock)
        page = await res.list_paginated()
        assert len(page.data) == 2
        assert page.total == 2
        assert page.has_more is False

    @pytest.mark.asyncio
    async def test_list_all(self, mock: MockHttpAdapter) -> None:
        res = SessionsResource(mock)
        sessions = [s async for s in res.list_all()]
        assert len(sessions) == 2
        assert sessions[0].film_title == "The Holdovers"
        assert sessions[1].film_title == "Poor Things"


class TestSitesResource:
    @pytest.mark.asyncio
    async def test_list(self, mock: MockHttpAdapter) -> None:
        res = SitesResource(mock)
        sites = await res.list()
        assert len(sites) == 1
        assert sites[0].id == "site_roxy_wellington"
        assert sites[0].name == "Roxy Cinema"

    @pytest.mark.asyncio
    async def test_get(self, mock: MockHttpAdapter) -> None:
        res = SitesResource(mock)
        site = await res.get("site_roxy_wellington")
        assert site.id == "site_roxy_wellington"
        assert site.timezone == "Pacific/Auckland"
        assert site.is_active is True

    @pytest.mark.asyncio
    async def test_screens(self, mock: MockHttpAdapter) -> None:
        res = SitesResource(mock)
        screens = await res.screens("site_roxy_wellington")
        assert len(screens) == 3
        assert screens[1].name == "Screen 2 — IMAX"
        assert "IMAX" in screens[1].formats

    @pytest.mark.asyncio
    async def test_nearby(self, mock: MockHttpAdapter) -> None:
        res = SitesResource(mock)
        sites = await res.nearby(-41.2865, 174.7762, 10.0)
        assert len(sites) == 1


class TestFilmsResource:
    @pytest.mark.asyncio
    async def test_now_showing(self, mock: MockHttpAdapter) -> None:
        res = FilmsResource(mock)
        films = await res.now_showing()
        assert len(films) == 2
        assert films[0].title == "The Holdovers"
        assert films[0].is_now_showing is True

    @pytest.mark.asyncio
    async def test_coming_soon(self, mock: MockHttpAdapter) -> None:
        res = FilmsResource(mock)
        films = await res.coming_soon()
        assert len(films) == 1
        assert films[0].title == "Dune: Part Two"
        assert films[0].is_coming_soon is True

    @pytest.mark.asyncio
    async def test_get(self, mock: MockHttpAdapter) -> None:
        res = FilmsResource(mock)
        film = await res.get("film_holdovers_2023")
        assert film.id == "film_holdovers_2023"
        assert film.director == "Alexander Payne"

    @pytest.mark.asyncio
    async def test_get_detail(self, mock: MockHttpAdapter) -> None:
        res = FilmsResource(mock)
        detail = await res.get_detail("film_holdovers_2023")
        assert detail.id == "film_holdovers_2023"
        assert len(detail.crew) == 1
        assert detail.crew[0].name == "Alexander Payne"
        assert len(detail.ratings) == 1
        assert detail.ratings[0].source == "TMDB"

    @pytest.mark.asyncio
    async def test_search(self, mock: MockHttpAdapter) -> None:
        res = FilmsResource(mock)
        films = await res.search(FilmFilter(query="Holdovers"))
        assert len(films) == 1

    @pytest.mark.asyncio
    async def test_advanced_search(self, mock: MockHttpAdapter) -> None:
        res = FilmsResource(mock)
        films = await res.advanced_search(FilmSearchFilter(query="Holdovers"))
        assert len(films) == 1


class TestOrdersResource:
    @pytest.mark.asyncio
    async def test_create(self, mock: MockHttpAdapter) -> None:
        res = OrdersResource(mock)
        order = await res.create(CreateOrderInput(
            session_id="ses_roxy_holdovers_20260427_1915",
            tickets=[TicketInput(type="adult", seat_id="seat_D5")],
        ))
        assert order.status.value == "draft"

    @pytest.mark.asyncio
    async def test_get(self, mock: MockHttpAdapter) -> None:
        res = OrdersResource(mock)
        order = await res.get("ord_mock_001")
        assert order.id == "ord_mock_001"
        assert order.status.value == "confirmed"
        assert len(order.tickets) == 2

    @pytest.mark.asyncio
    async def test_confirm(self, mock: MockHttpAdapter) -> None:
        res = OrdersResource(mock)
        order = await res.confirm("ord_mock_001")
        assert order.id.startswith("ord_mock")

    @pytest.mark.asyncio
    async def test_cancel(self, mock: MockHttpAdapter) -> None:
        res = OrdersResource(mock)
        order = await res.cancel("ord_mock_001")
        assert order.id.startswith("ord_mock")

    @pytest.mark.asyncio
    async def test_refund(self, mock: MockHttpAdapter) -> None:
        res = OrdersResource(mock)
        order = await res.refund("ord_mock_001")
        assert order.id.startswith("ord_mock")

    @pytest.mark.asyncio
    async def test_complete(self, mock: MockHttpAdapter) -> None:
        res = OrdersResource(mock)
        order = await res.complete("ord_mock_001")
        assert order.id.startswith("ord_mock")

    @pytest.mark.asyncio
    async def test_add_tickets(self, mock: MockHttpAdapter) -> None:
        res = OrdersResource(mock)
        order = await res.add_tickets(
            "ord_mock_001",
            AddTicketsInput(tickets=[TicketInput(type="adult", seat_id="seat_D7")]),
        )
        assert order.id.startswith("ord_mock")

    @pytest.mark.asyncio
    async def test_add_items(self, mock: MockHttpAdapter) -> None:
        res = OrdersResource(mock)
        order = await res.add_items(
            "ord_mock_001",
            AddItemsInput(items=[ItemInput(menu_item_id="item_popcorn_large", quantity=1)]),
        )
        assert order.id.startswith("ord_mock")

    @pytest.mark.asyncio
    async def test_apply_loyalty(self, mock: MockHttpAdapter) -> None:
        res = OrdersResource(mock)
        order = await res.apply_loyalty(
            "ord_mock_001",
            ApplyLoyaltyInput(member_id="mem_hemi_walker_5528"),
        )
        assert order.id.startswith("ord_mock")

    @pytest.mark.asyncio
    async def test_history(self, mock: MockHttpAdapter) -> None:
        res = OrdersResource(mock)
        page = await res.history("mem_hemi_walker_5528")
        assert page.total == 1
        assert len(page.data) == 1
        assert page.data[0].status.value == "completed"


class TestLoyaltyResource:
    @pytest.mark.asyncio
    async def test_get_member(self, mock: MockHttpAdapter) -> None:
        res = LoyaltyResource(mock)
        member = await res.get_member("mem_hemi_walker_5528")
        assert member.id == "mem_hemi_walker_5528"
        assert member.first_name == "Hemi"
        assert member.tier.name.value == "Gold"
        assert member.points == 2840

    @pytest.mark.asyncio
    async def test_authenticate(self, mock: MockHttpAdapter) -> None:
        res = LoyaltyResource(mock)
        member = await res.authenticate("hemi.walker@example.co.nz", "password")
        assert member.id == "mem_hemi_walker_5528"

    @pytest.mark.asyncio
    async def test_get_points_balance(self, mock: MockHttpAdapter) -> None:
        res = LoyaltyResource(mock)
        balance = await res.get_points_balance("mem_hemi_walker_5528")
        assert balance["points"] == 2840
        assert balance["lifetimePoints"] == 8640

    @pytest.mark.asyncio
    async def test_get_history(self, mock: MockHttpAdapter) -> None:
        res = LoyaltyResource(mock)
        page = await res.get_history("mem_hemi_walker_5528")
        assert page.total == 2
        assert len(page.data) == 2
        assert page.data[0].type == "earn"

    @pytest.mark.asyncio
    async def test_list_redemption_options(self, mock: MockHttpAdapter) -> None:
        res = LoyaltyResource(mock)
        options = await res.list_redemption_options("mem_hemi_walker_5528")
        assert len(options) == 3
        assert options[0].name == "Free Large Popcorn"
        assert options[0].points_cost == 500

    @pytest.mark.asyncio
    async def test_redeem_points(self, mock: MockHttpAdapter) -> None:
        res = LoyaltyResource(mock)
        tx = await res.redeem_points(
            "mem_hemi_walker_5528",
            RedeemPointsInput(option_id="rdm_free_popcorn"),
        )
        assert tx.type == "redeem"
        assert tx.points == -500


class TestSubscriptionsResource:
    @pytest.mark.asyncio
    async def test_list_plans(self, mock: MockHttpAdapter) -> None:
        res = SubscriptionsResource(mock)
        plans = await res.list_plans()
        assert len(plans) == 2
        assert plans[0].name == "Cinema Unlimited"
        assert plans[0].price == 24.99

    @pytest.mark.asyncio
    async def test_get_member_subscription(self, mock: MockHttpAdapter) -> None:
        res = SubscriptionsResource(mock)
        sub = await res.get_member_subscription("mem_hemi_walker_5528")
        assert sub.id == "sub_hemi_001"
        assert sub.status.value == "active"

    @pytest.mark.asyncio
    async def test_get_usage(self, mock: MockHttpAdapter) -> None:
        res = SubscriptionsResource(mock)
        usage = await res.get_usage("mem_hemi_walker_5528")
        assert usage.bookings_used == 3
        assert usage.member_id == "mem_hemi_walker_5528"

    @pytest.mark.asyncio
    async def test_check_benefit_eligibility(self, mock: MockHttpAdapter) -> None:
        res = SubscriptionsResource(mock)
        elig = await res.check_benefit_eligibility("mem_hemi_walker_5528", "ben_unlimited_bookings")
        assert elig.eligible is True

    @pytest.mark.asyncio
    async def test_suspend(self, mock: MockHttpAdapter) -> None:
        res = SubscriptionsResource(mock)
        sub = await res.suspend(
            "mem_hemi_walker_5528",
            SuspendSubscriptionInput(reason="Holiday"),
        )
        assert sub.status.value == "paused"

    @pytest.mark.asyncio
    async def test_cancel(self, mock: MockHttpAdapter) -> None:
        res = SubscriptionsResource(mock)
        sub = await res.cancel(
            "mem_hemi_walker_5528",
            CancelSubscriptionInput(reason="Too expensive"),
        )
        assert sub.status.value == "cancelled"


class TestPricingResource:
    @pytest.mark.asyncio
    async def test_ticket_types(self, mock: MockHttpAdapter) -> None:
        res = PricingResource(mock)
        types = await res.ticket_types("ses_roxy_holdovers_20260427_1915")
        assert len(types) == 3
        assert types[0].name == "Adult"
        assert types[0].price == 19.50

    @pytest.mark.asyncio
    async def test_calculate(self, mock: MockHttpAdapter) -> None:
        res = PricingResource(mock)
        calc = await res.calculate("ses_roxy_holdovers_20260427_1915", "tt_adult")
        assert calc.total_price == 22.43
        assert calc.currency == "NZD"
        assert calc.breakdown.tax_amount == 2.93

    @pytest.mark.asyncio
    async def test_apply_coupons(self, mock: MockHttpAdapter) -> None:
        res = PricingResource(mock)
        result = await res.apply_coupons(ApplyCouponsInput(
            session_id="ses_roxy_holdovers_20260427_1915",
            ticket_type_id="tt_adult",
            quantity=1,
            coupon_codes=["SUMMER10"],
        ))
        assert len(result.applied) == 1
        assert result.applied[0].amount == 1.95
        assert len(result.rejected) == 0


class TestFoodAndBeverageResource:
    @pytest.mark.asyncio
    async def test_menu(self, mock: MockHttpAdapter) -> None:
        res = FoodAndBeverageResource(mock)
        items = await res.menu("site_roxy_wellington")
        assert len(items) == 3
        assert items[0].name == "Large Popcorn"
        assert items[0].price == 9.50

    @pytest.mark.asyncio
    async def test_categories(self, mock: MockHttpAdapter) -> None:
        res = FoodAndBeverageResource(mock)
        cats = await res.categories("site_roxy_wellington")
        assert len(cats) == 4
        assert cats[0].name == "Popcorn"

    @pytest.mark.asyncio
    async def test_item_detail(self, mock: MockHttpAdapter) -> None:
        res = FoodAndBeverageResource(mock)
        item = await res.item_detail("site_roxy_wellington", "item_popcorn_large")
        assert item.id == "item_popcorn_large"
        assert item.customisations is not None
        assert len(item.customisations) == 1
        assert item.customisations[0].name == "Flavour"

    @pytest.mark.asyncio
    async def test_combos(self, mock: MockHttpAdapter) -> None:
        res = FoodAndBeverageResource(mock)
        combos = await res.combos("site_roxy_wellington")
        assert len(combos) == 1
        assert combos[0].name == "Date Night Combo"
        assert combos[0].savings == 4.00

    @pytest.mark.asyncio
    async def test_add_to_order(self, mock: MockHttpAdapter) -> None:
        res = FoodAndBeverageResource(mock)
        conf = await res.add_to_order(AddToOrderInput(
            order_id="ord_mock_001",
            items=[FnbOrderLineItem(item_id="item_popcorn_large", quantity=1, unit_price=9.50)],
        ))
        assert conf.order_id.startswith("ord_mock")
