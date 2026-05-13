"""Tests for auth — GAS client and token manager."""

from __future__ import annotations

import asyncio
import time

import pytest

from theatrical.auth.gas_client import GasToken
from theatrical.auth.token_manager import EXPIRY_BUFFER_SECONDS, TokenManager


class FakeGasClient:
    def __init__(self, tokens: list[GasToken] | None = None) -> None:
        self.call_count = 0
        self._tokens = tokens or [
            GasToken(
                access_token="token-1",
                token_type="Bearer",
                expires_in=3600,
                issued_at=time.time(),
            )
        ]

    async def request_token(self) -> GasToken:
        idx = min(self.call_count, len(self._tokens) - 1)
        self.call_count += 1
        return self._tokens[idx]


class TestTokenManager:
    @pytest.mark.asyncio
    async def test_returns_token_on_first_call(self) -> None:
        gas = FakeGasClient()
        mgr = TokenManager(gas)
        token = await mgr.get_token()
        assert token == "token-1"
        assert gas.call_count == 1

    @pytest.mark.asyncio
    async def test_caches_valid_token(self) -> None:
        gas = FakeGasClient()
        mgr = TokenManager(gas)
        t1 = await mgr.get_token()
        t2 = await mgr.get_token()
        assert t1 == t2
        assert gas.call_count == 1

    @pytest.mark.asyncio
    async def test_refreshes_expired_token(self) -> None:
        expired = GasToken(
            access_token="expired-token",
            token_type="Bearer",
            expires_in=3600,
            issued_at=time.time() - 7200,
        )
        fresh = GasToken(
            access_token="fresh-token",
            token_type="Bearer",
            expires_in=3600,
            issued_at=time.time(),
        )
        gas = FakeGasClient(tokens=[expired, fresh])
        mgr = TokenManager(gas)
        # First call caches the expired token (trusts GAS)
        t1 = await mgr.get_token()
        assert t1 == "expired-token"
        # Second call detects expiry and refreshes
        t2 = await mgr.get_token()
        assert t2 == "fresh-token"
        assert gas.call_count == 2

    @pytest.mark.asyncio
    async def test_invalidate_clears_cached_token(self) -> None:
        t1 = GasToken(access_token="old", token_type="Bearer", expires_in=3600, issued_at=time.time())
        t2 = GasToken(access_token="new", token_type="Bearer", expires_in=3600, issued_at=time.time())
        gas = FakeGasClient(tokens=[t1, t2])
        mgr = TokenManager(gas)
        await mgr.get_token()
        mgr.invalidate()
        token = await mgr.get_token()
        assert token == "new"
        assert gas.call_count == 2

    @pytest.mark.asyncio
    async def test_refreshes_within_expiry_buffer(self) -> None:
        near_expiry = GasToken(
            access_token="near-expiry",
            token_type="Bearer",
            expires_in=3600,
            issued_at=time.time() - 3600 + EXPIRY_BUFFER_SECONDS - 10,
        )
        fresh = GasToken(
            access_token="refreshed",
            token_type="Bearer",
            expires_in=3600,
            issued_at=time.time(),
        )
        gas = FakeGasClient(tokens=[near_expiry, fresh])
        mgr = TokenManager(gas)
        # First call caches the near-expiry token
        t1 = await mgr.get_token()
        assert t1 == "near-expiry"
        # Second call detects it's within the buffer and refreshes
        t2 = await mgr.get_token()
        assert t2 == "refreshed"

    @pytest.mark.asyncio
    async def test_concurrent_calls_deduplicate(self) -> None:
        call_count = 0

        class SlowGasClient:
            async def request_token(self) -> GasToken:
                nonlocal call_count
                call_count += 1
                await asyncio.sleep(0.05)
                return GasToken(
                    access_token="concurrent-token",
                    token_type="Bearer",
                    expires_in=3600,
                    issued_at=time.time(),
                )

        mgr = TokenManager(SlowGasClient())
        results = await asyncio.gather(
            mgr.get_token(),
            mgr.get_token(),
            mgr.get_token(),
        )
        assert all(r == "concurrent-token" for r in results)
        assert call_count <= 2
