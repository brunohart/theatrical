"""Sessions resource — showtimes, availability, and seat maps."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import TYPE_CHECKING, Optional

from pydantic import TypeAdapter

from theatrical.types.pagination import PaginatedResponse, PaginationParams, PaginationStrategy
from theatrical.types.session import (
    SeatAvailability,
    Session,
    SessionFilter,
    SessionListResponse,
)

if TYPE_CHECKING:
    from theatrical.http.client import TheatricalHttpProtocol

DEFAULT_PAGE_SIZE = 50

_session_list_response_adapter = TypeAdapter(SessionListResponse)
_session_adapter = TypeAdapter(Session)
_seat_availability_adapter = TypeAdapter(SeatAvailability)


class SessionsResource:
    def __init__(self, http: TheatricalHttpProtocol) -> None:
        self._http = http

    async def list(self, filters: Optional[SessionFilter] = None) -> SessionListResponse:
        params = _build_filter_params(filters) if filters else None
        raw = await self._http.get("/ocapi/v1/sessions", params=params)
        return _session_list_response_adapter.validate_python(raw)

    async def list_paginated(
        self,
        filters: Optional[SessionFilter] = None,
        pagination: Optional[PaginationParams] = None,
    ) -> PaginatedResponse[Session]:
        limit = pagination.limit if pagination and pagination.limit else DEFAULT_PAGE_SIZE
        use_cursor = pagination is not None and pagination.cursor is not None

        merged = SessionFilter(**(filters.model_dump(exclude_none=True) if filters else {}))
        merged.limit = limit
        if use_cursor:
            merged.cursor = pagination.cursor  # type: ignore[union-attr]
        else:
            merged.offset = (pagination.offset if pagination and pagination.offset is not None else 0)

        response = await self.list(merged)
        return PaginatedResponse[Session](
            data=response.sessions,
            total=response.total,
            has_more=response.has_more,
            next_cursor=response.next_cursor,
            next_offset=response.next_offset,
            strategy=PaginationStrategy.CURSOR if use_cursor else PaginationStrategy.OFFSET,
        )

    async def list_all(
        self,
        filters: Optional[SessionFilter] = None,
        page_size: int = DEFAULT_PAGE_SIZE,
    ) -> AsyncIterator[Session]:
        offset = 0
        has_more = True

        while has_more:
            merged = SessionFilter(**(filters.model_dump(exclude_none=True) if filters else {}))
            merged.limit = page_size
            merged.offset = offset

            response = await self.list(merged)
            for session in response.sessions:
                yield session

            has_more = response.has_more
            offset = response.next_offset if response.next_offset is not None else offset + len(response.sessions)

    async def get(self, session_id: str) -> Session:
        raw = await self._http.get(f"/ocapi/v1/sessions/{session_id}")
        return _session_adapter.validate_python(raw)

    async def availability(self, session_id: str) -> SeatAvailability:
        raw = await self._http.get(f"/ocapi/v1/sessions/{session_id}/seat-plan")
        return _seat_availability_adapter.validate_python(raw)


def _build_filter_params(filters: SessionFilter) -> dict[str, str]:
    params: dict[str, str] = {}
    d = filters.model_dump(exclude_none=True)
    for key, value in d.items():
        params[key] = str(value) if not isinstance(value, str) else value
    return params
