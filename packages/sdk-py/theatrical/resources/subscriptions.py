"""Subscriptions resource — plans and member subscriptions."""

from __future__ import annotations

from typing import TYPE_CHECKING

from theatrical.types.subscription import (
    CancelSubscriptionInput,
    MemberSubscription,
    SubscriptionPlan,
    SubscriptionUsage,
    SuspendSubscriptionInput,
)

if TYPE_CHECKING:
    from theatrical.http.client import TheatricalHttpProtocol


class SubscriptionsResource:
    def __init__(self, http: TheatricalHttpProtocol) -> None:
        self._http = http

    async def list_plans(self) -> list[SubscriptionPlan]:
        raise NotImplementedError

    async def get_plan(self, plan_id: str) -> SubscriptionPlan:
        raise NotImplementedError

    async def get_subscription(self, subscription_id: str) -> MemberSubscription:
        raise NotImplementedError

    async def get_usage(self, subscription_id: str) -> SubscriptionUsage:
        raise NotImplementedError

    async def suspend(self, subscription_id: str, input: SuspendSubscriptionInput) -> MemberSubscription:
        raise NotImplementedError

    async def cancel(self, subscription_id: str, input: CancelSubscriptionInput) -> MemberSubscription:
        raise NotImplementedError
