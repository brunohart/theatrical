"""Core HTTP client with auth, retry, rate limiting, and error parsing."""

from __future__ import annotations

import asyncio
import time
import uuid
from typing import Any, Protocol

import httpx

from theatrical.auth.token_manager import TokenManager
from theatrical.errors.exceptions import (
    RateLimitError,
    ServerError,
    TheatricalError,
)
from theatrical.errors.parser import parse_error_response
from theatrical.http.rate_limiter import RateLimiter
from theatrical.http.retry import DEFAULT_RETRY_CONFIG, RetryConfig, compute_backoff_delay


class TheatricalHttpProtocol(Protocol):
    async def get(self, path: str, params: dict[str, str] | None = None) -> Any: ...
    async def post(self, path: str, body: Any | None = None) -> Any: ...
    async def put(self, path: str, body: Any | None = None) -> Any: ...
    async def delete(self, path: str) -> Any: ...


class TheatricalHttpClient:
    def __init__(
        self,
        *,
        base_url: str,
        timeout: float,
        max_retries: int,
        token_manager: TokenManager,
        debug: bool = False,
        retry_config: RetryConfig | None = None,
        rate_limiter: RateLimiter | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._max_retries = max_retries
        self._token_manager = token_manager
        self._debug = debug
        self._retry_config = retry_config or DEFAULT_RETRY_CONFIG
        self._rate_limiter = rate_limiter
        self._http = httpx.AsyncClient(timeout=timeout)

    async def get(self, path: str, params: dict[str, str] | None = None) -> Any:
        return await self._request("GET", path, params=params)

    async def post(self, path: str, body: Any | None = None) -> Any:
        return await self._request("POST", path, body=body)

    async def put(self, path: str, body: Any | None = None) -> Any:
        return await self._request("PUT", path, body=body)

    async def delete(self, path: str) -> Any:
        return await self._request("DELETE", path)

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, str] | None = None,
        body: Any | None = None,
        attempt: int = 1,
    ) -> Any:
        if self._rate_limiter is not None:
            await self._rate_limiter.wait_for_slot()

        token = await self._token_manager.get_token()
        url = f"{self._base_url}{path}"
        request_id = f"th_{int(time.time() * 1000)}_{uuid.uuid4().hex[:7]}"

        if self._debug:
            print(f"[theatrical] {method} {url} ({request_id})")

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "X-Request-ID": request_id,
        }

        try:
            response = await self._http.request(
                method,
                url,
                headers=headers,
                params=params,
                json=body if body is not None else None,
            )

            if response.is_success:
                return response.json()

            if response.status_code == 401:
                self._token_manager.invalidate()
                if attempt <= 1:
                    return await self._request(
                        method, path, params=params, body=body, attempt=attempt + 1
                    )

            error = parse_error_response(response, url)

            if isinstance(error, (RateLimitError, ServerError)) and attempt <= self._max_retries:
                if isinstance(error, RateLimitError):
                    delay = error.retry_after
                else:
                    delay = compute_backoff_delay(attempt, self._retry_config)
                await asyncio.sleep(delay)
                return await self._request(
                    method, path, params=params, body=body, attempt=attempt + 1
                )

            raise error

        except TheatricalError:
            raise
        except httpx.TimeoutException as exc:
            raise TheatricalError("Request timed out", 408, request_id=request_id) from exc
        except httpx.HTTPError as exc:
            raise TheatricalError(
                f"Network error: {exc}", 0, request_id=request_id
            ) from exc

    async def close(self) -> None:
        await self._http.aclose()
