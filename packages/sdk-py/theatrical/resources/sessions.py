"""Sessions resource — showtimes, availability, and seat maps."""

from __future__ import annotations

from typing import TYPE_CHECKING, AsyncIterator, Optional

from theatrical.types.session import (
    SeatAvailability,
    Session,
    SessionFilter,
    SessionListResponse,
)
from theatrical.types.pagination import PaginatedResponse, PaginationParams

if TYPE_CHECKING:
    from theatrical.http.client import TheatricalHttpProtocol

DEFAULT_PAGE_SIZE = 50


class SessionsResource:
    def __init__(self, http: TheatricalHttpProtocol) -> None:
        self._http = http

    async def list(self, filters: Optional[SessionFilter] = None) -> SessionListResponse:
        raise NotImplementedError

    async def list_paginated(
        self,
        filters: Optional[SessionFilter] = None,
        pagination: Optional[PaginationParams] = None,
    ) -> PaginatedResponse[Session]:
        raise NotImplementedError

    async def list_all(
        self,
        filters: Optional[SessionFilter] = None,
        page_size: int = DEFAULT_PAGE_SIZE,
    ) -> AsyncIterator[Session]:
        raise NotImplementedError
        yield

    async def get(self, session_id: str) -> Session:
        raise NotImplementedError

    async def availability(self, session_id: str) -> SeatAvailability:
        raise NotImplementedError
