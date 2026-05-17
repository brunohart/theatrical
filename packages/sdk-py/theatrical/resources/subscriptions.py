"""Subscriptions resource — cinema pass plans and member subscription lifecycle."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import TypeAdapter

from theatrical.types.subscription import (
    BenefitEligibility,
    CancelSubscriptionInput,
    MemberSubscription,
    SubscriptionPlan,
    SubscriptionUsage,
    SuspendSubscriptionInput,
)

if TYPE_CHECKING:
    from theatrical.http.client import TheatricalHttpProtocol

_plan_list_adapter = TypeAdapter(list[SubscriptionPlan])
_subscription_adapter = TypeAdapter(MemberSubscription)
_usage_adapter = TypeAdapter(SubscriptionUsage)
_eligibility_adapter = TypeAdapter(BenefitEligibility)


class SubscriptionsResource:
    def __init__(self, http: TheatricalHttpProtocol) -> None:
        self._http = http

    async def list_plans(
        self,
        site_id: Optional[str] = None,
        include_unavailable: Optional[bool] = None,
    ) -> list[SubscriptionPlan]:
        params: dict[str, str] = {}
        if site_id is not None:
            params["siteId"] = site_id
        if include_unavailable is not None:
            params["includeUnavailable"] = str(include_unavailable).lower()
        raw = await self._http.get("/ocapi/v1/subscriptions/plans", params=params or None)
        return _plan_list_adapter.validate_python(raw)

    async def get_member_subscription(self, member_id: str) -> MemberSubscription:
        raw = await self._http.get(f"/ocapi/v1/subscriptions/members/{member_id}")
        return _subscription_adapter.validate_python(raw)

    async def get_usage(self, member_id: str) -> SubscriptionUsage:
        raw = await self._http.get(
            f"/ocapi/v1/subscriptions/members/{member_id}/usage"
        )
        return _usage_adapter.validate_python(raw)

    async def check_benefit_eligibility(
        self, member_id: str, benefit_id: str
    ) -> BenefitEligibility:
        raw = await self._http.get(
            f"/ocapi/v1/subscriptions/members/{member_id}/benefits/{benefit_id}/eligibility"
        )
        return _eligibility_adapter.validate_python(raw)

    async def suspend(
        self, member_id: str, input: Optional[SuspendSubscriptionInput] = None
    ) -> MemberSubscription:
        raw = await self._http.post(
            f"/ocapi/v1/subscriptions/members/{member_id}/suspend",
            body=input.model_dump(exclude_none=True) if input else {},
        )
        return _subscription_adapter.validate_python(raw)

    async def cancel(
        self, member_id: str, input: Optional[CancelSubscriptionInput] = None
    ) -> MemberSubscription:
        raw = await self._http.post(
            f"/ocapi/v1/subscriptions/members/{member_id}/cancel",
            body=input.model_dump(exclude_none=True) if input else {},
        )
        return _subscription_adapter.validate_python(raw)
