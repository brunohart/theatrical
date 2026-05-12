"""Tests for TheatricalClient."""

import pytest

from theatrical.client import TheatricalClient
from theatrical.config import TheatricalConfig, TheatricalEnvironment
from theatrical.resources.sessions import SessionsResource
from theatrical.resources.sites import SitesResource
from theatrical.resources.films import FilmsResource
from theatrical.resources.orders import OrdersResource
from theatrical.resources.loyalty import LoyaltyResource
from theatrical.resources.subscriptions import SubscriptionsResource
from theatrical.resources.pricing import PricingResource
from theatrical.resources.food_and_beverage import FoodAndBeverageResource


@pytest.fixture(autouse=True)
def reset_global() -> None:
    TheatricalClient.reset_global()


class TestCreate:
    def test_with_valid_config_returns_client_with_all_resources(self) -> None:
        config = TheatricalConfig(api_key="test-key", environment=TheatricalEnvironment.SANDBOX)
        client = TheatricalClient.create(config)

        assert client is not None
        assert isinstance(client.sessions, SessionsResource)
        assert isinstance(client.sites, SitesResource)
        assert isinstance(client.films, FilmsResource)
        assert isinstance(client.orders, OrdersResource)
        assert isinstance(client.loyalty, LoyaltyResource)
        assert isinstance(client.subscriptions, SubscriptionsResource)
        assert isinstance(client.pricing, PricingResource)
        assert isinstance(client.fnb, FoodAndBeverageResource)


class TestCreateMock:
    def test_returns_client(self) -> None:
        client = TheatricalClient.create_mock()
        assert client is not None
        assert isinstance(client.sessions, SessionsResource)


class TestGlobal:
    def test_without_set_global_raises(self) -> None:
        with pytest.raises(RuntimeError, match="No global TheatricalClient"):
            TheatricalClient.global_instance()

    def test_set_global_then_global_returns_same_instance(self) -> None:
        config = TheatricalConfig(api_key="global-key", environment=TheatricalEnvironment.PRODUCTION)
        TheatricalClient.set_global(config)

        a = TheatricalClient.global_instance()
        b = TheatricalClient.global_instance()
        assert a is b

    def test_reset_global_clears_instance(self) -> None:
        config = TheatricalConfig(api_key="key")
        TheatricalClient.set_global(config)
        TheatricalClient.reset_global()

        with pytest.raises(RuntimeError):
            TheatricalClient.global_instance()


class TestLazyResourceInit:
    def test_returns_same_instance_on_multiple_accesses(self) -> None:
        config = TheatricalConfig(api_key="test-key")
        client = TheatricalClient.create(config)

        sessions1 = client.sessions
        sessions2 = client.sessions
        assert sessions1 is sessions2

    def test_all_resources_are_lazy(self) -> None:
        config = TheatricalConfig(api_key="test-key")
        client = TheatricalClient.create(config)

        assert client.sessions is client.sessions
        assert client.sites is client.sites
        assert client.films is client.films
        assert client.orders is client.orders
        assert client.loyalty is client.loyalty
        assert client.subscriptions is client.subscriptions
        assert client.pricing is client.pricing
        assert client.fnb is client.fnb


class TestAsyncContextManager:
    @pytest.mark.asyncio
    async def test_aenter_and_aexit(self) -> None:
        config = TheatricalConfig(api_key="test-key")
        async with TheatricalClient(config) as client:
            assert client is not None
            assert isinstance(client.sessions, SessionsResource)
