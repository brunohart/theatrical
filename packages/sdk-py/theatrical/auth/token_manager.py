"""Token lifecycle management with async deduplication."""

from __future__ import annotations

import asyncio
import time

from theatrical.auth.gas_client import GasClientProtocol, GasToken

EXPIRY_BUFFER_SECONDS = 5 * 60


class TokenManager:
    def __init__(self, gas_client: GasClientProtocol) -> None:
        self._gas_client = gas_client
        self._current_token: GasToken | None = None
        self._lock = asyncio.Lock()

    async def get_token(self) -> str:
        if self._current_token is not None and not self._is_expired(self._current_token):
            return self._current_token.access_token

        async with self._lock:
            if self._current_token is not None and not self._is_expired(self._current_token):
                return self._current_token.access_token

            self._current_token = await self._gas_client.request_token()
            return self._current_token.access_token

    def invalidate(self) -> None:
        self._current_token = None

    def _is_expired(self, token: GasToken) -> bool:
        expires_at = token.issued_at + token.expires_in
        return time.time() >= expires_at - EXPIRY_BUFFER_SECONDS
