"""Mock HTTP adapter returning fixture data without network calls."""

from __future__ import annotations

import re
import time
from typing import Any

from theatrical.errors.exceptions import NotFoundError
from theatrical.mock.fixtures import DEFAULT_FIXTURES


class MockHttpAdapter:
    def __init__(self, overrides: dict[str, Any] | None = None) -> None:
        self._responses: dict[str, Any] = dict(DEFAULT_FIXTURES)
        if overrides is not None:
            self._responses.update(overrides)

        self._patterns: list[tuple[re.Pattern[str], Any]] = []
        for key, value in self._responses.items():
            if ":id" in key:
                pattern_str = "^" + re.escape(key).replace(":id", "[^/]+") + "$"
                self._patterns.append((re.compile(pattern_str), value))

    async def get(self, path: str, params: dict[str, str] | None = None) -> Any:
        data = self._lookup(path)
        if data is None:
            segments = [s for s in path.split("/") if s]
            resource_id = segments[-1] if segments else path
            resource = segments[-2].rstrip("s").capitalize() if len(segments) >= 2 else "Resource"
            raise NotFoundError(resource, resource_id)
        return data

    async def post(self, path: str, body: Any | None = None) -> Any:
        data = self._lookup(path)
        if data is not None:
            return data

        if "/orders" in path and "/fnb" in path:
            return {
                "orderId": path.split("/orders/")[1].split("/fnb")[0],
                "addedItems": [],
                "fnbSubtotal": 0,
                "currency": "NZD",
            }

        if "/orders" in path:
            return {
                "id": f"ord_mock_{int(time.time() * 1000)}",
                "sessionId": "ses_mock",
                "status": "draft",
                "tickets": [],
                "items": [],
                "subtotal": 0,
                "tax": 0,
                "discount": 0,
                "total": 0,
                "currency": "NZD",
                "createdAt": "2026-05-14T00:00:00Z",
                "updatedAt": "2026-05-14T00:00:00Z",
            }

        if "/subscriptions/members/" in path:
            member_id = _extract_id_from_path(path, "/subscriptions/members/")
            status = "active"
            if "/suspend" in path:
                status = "paused"
            elif "/cancel" in path:
                status = "cancelled"
            return {
                "id": "sub_mock",
                "planId": "plan_mock",
                "memberId": member_id,
                "status": status,
                "startDate": "2026-01-01",
                "autoRenew": status == "active",
            }

        if "/loyalty/" in path:
            return {
                "id": "mem_mock",
                "email": "mock@example.co.nz",
                "firstName": "Mock",
                "lastName": "Member",
                "tier": {
                    "id": "tier_bronze",
                    "name": "Bronze",
                    "level": 1,
                    "benefits": [],
                    "pointsThreshold": 0,
                },
                "points": 0,
                "lifetimePoints": 0,
                "memberSince": "2026-01-01",
                "active": True,
            }

        return {}

    async def put(self, path: str, body: Any | None = None) -> Any:
        data = self._lookup(path)
        return data if data is not None else {}

    async def delete(self, path: str) -> Any:
        return {}

    def _lookup(self, path: str) -> Any | None:
        clean_path = path.split("?")[0]

        if clean_path in self._responses:
            return self._responses[clean_path]

        for pattern, response in self._patterns:
            if pattern.match(clean_path):
                return response

        return None


def _extract_id_from_path(path: str, prefix: str) -> str:
    idx = path.find(prefix)
    if idx < 0:
        return "unknown"
    rest = path[idx + len(prefix):]
    slash_idx = rest.find("/")
    return rest[:slash_idx] if slash_idx >= 0 else rest
