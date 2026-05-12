"""TheatricalClient — the primary entry point for the Theatrical SDK."""

from __future__ import annotations

from typing import Optional

import httpx

from theatrical.config import TheatricalConfig, TheatricalEnvironment
from theatrical.resources.sessions import SessionsResource
from theatrical.resources.sites import SitesResource
from theatrical.resources.films import FilmsResource
from theatrical.resources.orders import OrdersResource
from theatrical.resources.loyalty import LoyaltyResource
from theatrical.resources.subscriptions import SubscriptionsResource
from theatrical.resources.pricing import PricingResource
from theatrical.resources.food_and_beverage import FoodAndBeverageResource

_global_instance: Optional[TheatricalClient] = None


class TheatricalClient:
    def __init__(self, config: TheatricalConfig) -> None:
        self._config = config
        self._http = httpx.AsyncClient(
            base_url=config.resolved_base_url,
            timeout=config.timeout,
            headers={"Authorization": f"Bearer {config.api_key}"},
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
    def create_mock(cls) -> TheatricalClient:
        mock_config = TheatricalConfig(api_key="mock", environment=TheatricalEnvironment.SANDBOX)
        instance = cls.__new__(cls)
        instance._config = mock_config
        instance._http = httpx.AsyncClient(base_url=mock_config.resolved_base_url)
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

    async def close(self) -> None:
        await self._http.aclose()

    async def __aenter__(self) -> TheatricalClient:
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.close()

    @property
    def sessions(self) -> SessionsResource:
        if self._sessions is None:
            self._sessions = SessionsResource(self._http)
        return self._sessions

    @property
    def sites(self) -> SitesResource:
        if self._sites is None:
            self._sites = SitesResource(self._http)
        return self._sites

    @property
    def films(self) -> FilmsResource:
        if self._films is None:
            self._films = FilmsResource(self._http)
        return self._films

    @property
    def orders(self) -> OrdersResource:
        if self._orders is None:
            self._orders = OrdersResource(self._http)
        return self._orders

    @property
    def loyalty(self) -> LoyaltyResource:
        if self._loyalty is None:
            self._loyalty = LoyaltyResource(self._http)
        return self._loyalty

    @property
    def subscriptions(self) -> SubscriptionsResource:
        if self._subscriptions is None:
            self._subscriptions = SubscriptionsResource(self._http)
        return self._subscriptions

    @property
    def pricing(self) -> PricingResource:
        if self._pricing is None:
            self._pricing = PricingResource(self._http)
        return self._pricing

    @property
    def fnb(self) -> FoodAndBeverageResource:
        if self._fnb is None:
            self._fnb = FoodAndBeverageResource(self._http)
        return self._fnb
