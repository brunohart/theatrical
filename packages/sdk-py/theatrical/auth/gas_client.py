"""Client for Vista's Global Authentication Service (GAS)."""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Protocol

import httpx


@dataclass(frozen=True)
class GasToken:
    access_token: str
    token_type: str
    expires_in: int
    issued_at: float


class GasClientProtocol(Protocol):
    async def request_token(self) -> GasToken: ...


class GasClient:
    def __init__(self, api_key: str, auth_url: str = "https://auth.moviexchange.com") -> None:
        self._api_key = api_key
        self._auth_url = auth_url
        self._http = httpx.AsyncClient()

    async def request_token(self) -> GasToken:
        response = await self._http.post(
            f"{self._auth_url}/oauth/token",
            json={
                "grant_type": "client_credentials",
                "api_key": self._api_key,
            },
        )
        if response.status_code != 200:
            raise RuntimeError(
                f"GAS authentication failed: {response.status_code} {response.reason_phrase}"
            )

        data = response.json()
        return GasToken(
            access_token=data["access_token"],
            token_type=data.get("token_type", "Bearer"),
            expires_in=data.get("expires_in", 3600),
            issued_at=time.time(),
        )

    async def close(self) -> None:
        await self._http.aclose()
