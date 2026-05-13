"""TheatricalClient — the primary entry point for the Theatrical SDK."""

from __future__ import annotations

from typing import Any, Optional

from theatrical.auth.gas_client import GasClient
from theatrical.auth.token_manager import TokenManager
from theatrical.config import TheatricalConfig, TheatricalEnvironment
from theatrical.http.client import TheatricalHttpClient
from theatrical.http.rate_limiter import RateLimiter
from theatrical.mock.adapter import MockHttpAdapter
from theatrical.resources.films import FilmsResource
from theatrical.resources.food_and_beverage import FoodAndBeverageResource
from theatrical.resources.loyalty import LoyaltyResource
from theatrical.resources.orders import OrdersResource
from theatrical.resources.pricing import PricingResource
from theatrical.resources.sessions import SessionsResource
from theatrical.resources.sites import SitesResource
from theatrical.resources.subscriptions import SubscriptionsResource

_global_instance: Optional[TheatricalClient] = None


class TheatricalClient:
    def __init__(self, config: TheatricalConfig) -> None:
        self._config = config
        self._closed = False

        base_url = config.resolved_base_url

        gas_client = GasClient(api_key=config.api_key)
        self._gas_client: GasClient | None = gas_client

        token_manager = TokenManager(gas_client)
        self._token_manager: TokenManager | None = token_manager

        rate_limiter = RateLimiter()

        self._http_client: TheatricalHttpClient | MockHttpAdapter = TheatricalHttpClient(
            base_url=base_url,
            timeout=config.timeout,
            max_retries=config.max_retries,
            token_manager=token_manager,
            debug=config.debug,
            rate_limiter=rate_limiter,
        )

        self._sessions: Optional[SessionsResource] = None
        self._sites: Optional[SitesResource] = None
        self._films: Optional[FilmsResource] = None
        self._orders: Optional[OrdersResource] = None
        self._loyalty: Optional[LoyaltyResource] = None
        self._subscriptions: Optional[SubscriptionsResource] = None
        self._pricing: Optional[PricingResource] = None
        self._fnb: Optional[FoodAndBeverageResource] = None

    @classmethod
    def create(cls, config: TheatricalConfig) -> TheatricalClient:
        return cls(config)

    @classmethod
    def create_mock(cls, overrides: dict[str, Any] | None = None) -> TheatricalClient:
        mock_config = TheatricalConfig(api_key="mock", environment=TheatricalEnvironment.SANDBOX)
        instance = object.__new__(cls)
        instance._config = mock_config
        instance._closed = False
        instance._gas_client = None
        instance._token_manager = None
        instance._http_client = MockHttpAdapter(overrides)
        instance._sessions = None
        instance._sites = None
        instance._films = None
        instance._orders = None
        instance._loyalty = None
        instance._subscriptions = None
        instance._pricing = None
        instance._fnb = None
        return instance

    @staticmethod
    def global_instance() -> TheatricalClient:
        if _global_instance is None:
            raise RuntimeError(
                "No global TheatricalClient configured. "
                "Call TheatricalClient.set_global(config) first."
            )
        return _global_instance

    @staticmethod
    def set_global(config: TheatricalConfig) -> None:
        global _global_instance
        _global_instance = TheatricalClient(config)

    @staticmethod
    def reset_global() -> None:
        global _global_instance
        _global_instance = None

    def _throw_if_closed(self) -> None:
        if self._closed:
            raise RuntimeError("TheatricalClient has been closed")

    async def close(self) -> None:
        if self._closed:
            return
        self._closed = True
        if isinstance(self._http_client, TheatricalHttpClient):
            await self._http_client.close()
        if self._gas_client is not None:
            await self._gas_client.close()

    async def __aenter__(self) -> TheatricalClient:
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.close()

    @property
    def sessions(self) -> SessionsResource:
        self._throw_if_closed()
        if self._sessions is None:
            self._sessions = SessionsResource(self._http_client)
        return self._sessions

    @property
    def sites(self) -> SitesResource:
        self._throw_if_closed()
        if self._sites is None:
            self._sites = SitesResource(self._http_client)
        return self._sites

    @property
    def films(self) -> FilmsResource:
        self._throw_if_closed()
        if self._films is None:
            self._films = FilmsResource(self._http_client)
        return self._films

    @property
    def orders(self) -> OrdersResource:
        self._throw_if_closed()
        if self._orders is None:
            self._orders = OrdersResource(self._http_client)
        return self._orders

    @property
    def loyalty(self) -> LoyaltyResource:
        self._throw_if_closed()
        if self._loyalty is None:
            self._loyalty = LoyaltyResource(self._http_client)
        return self._loyalty

    @property
    def subscriptions(self) -> SubscriptionsResource:
        self._throw_if_closed()
        if self._subscriptions is None:
            self._subscriptions = SubscriptionsResource(self._http_client)
        return self._subscriptions

    @property
    def pricing(self) -> PricingResource:
        self._throw_if_closed()
        if self._pricing is None:
            self._pricing = PricingResource(self._http_client)
        return self._pricing

    @property
    def fnb(self) -> FoodAndBeverageResource:
        self._throw_if_closed()
        if self._fnb is None:
            self._fnb = FoodAndBeverageResource(self._http_client)
        return self._fnb
