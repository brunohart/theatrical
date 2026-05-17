"""Shared test infrastructure — SpyHttpProtocol for URL/param verification."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class HttpCall:
    method: str
    path: str
    params: dict[str, str] | None = None
    body: Any = None


class SpyHttpProtocol:
    """Records all HTTP calls and returns enqueued responses or raises enqueued errors.

    Implements TheatricalHttpProtocol for direct resource instantiation in tests.
    """

    def __init__(self) -> None:
        self.calls: list[HttpCall] = []
        self._responses: deque[Any] = deque()
        self._errors: deque[Exception] = deque()

    def enqueue_response(self, response: Any) -> "SpyHttpProtocol":
        self._responses.append(response)
        return self

    def enqueue_error(self, error: Exception) -> "SpyHttpProtocol":
        self._errors.append(error)
        return self

    @property
    def last_call(self) -> HttpCall:
        return self.calls[-1]

    def _resolve(self) -> Any:
        if self._errors:
            raise self._errors.popleft()
        if self._responses:
            return self._responses.popleft()
        return None

    async def get(self, path: str, params: dict[str, str] | None = None) -> Any:
        self.calls.append(HttpCall("GET", path, params=params))
        return self._resolve()

    async def post(self, path: str, body: Any | None = None) -> Any:
        self.calls.append(HttpCall("POST", path, body=body))
        return self._resolve()

    async def put(self, path: str, body: Any | None = None) -> Any:
        self.calls.append(HttpCall("PUT", path, body=body))
        return self._resolve()

    async def delete(self, path: str) -> Any:
        self.calls.append(HttpCall("DELETE", path))
        return self._resolve()
