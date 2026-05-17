"""Spy-based tests for SessionsResource — URL, param, and response verification."""

from __future__ import annotations

import pytest

from tests.conftest import SpyHttpProtocol
from theatrical.errors.exceptions import NotFoundError
from theatrical.resources.sessions import SessionsResource
from theatrical.types.pagination import PaginationParams
from theatrical.types.session import SessionFilter, SessionFormat


def _session_dict(**overrides: object) -> dict[str, object]:
    base = {
        "id": "ses_roxy_holdovers_20260410_1915",
        "filmId": "film_holdovers_2023",
        "filmTitle": "The Holdovers",
        "siteId": "site_roxy_wellington",
        "screenId": "scr_roxy_3",
        "screenName": "Screen 3",
        "startTime": "2026-04-10T19:15:00+12:00",
        "endTime": "2026-04-10T21:42:00+12:00",
        "format": "2D",
        "isBookable": True,
        "isSoldOut": False,
        "seatsAvailable": 74,
        "seatsTotal": 120,
        "priceFrom": 19.50,
        "currency": "NZD",
        "attributes": {},
    }
    base.update(overrides)
    return base


def _session_list_response(
    sessions: list[dict[str, object]] | None = None,
    total: int | None = None,
    has_more: bool = False,
    next_offset: int | None = None,
    next_cursor: str | None = None,
) -> dict[str, object]:
    s = sessions if sessions is not None else [_session_dict()]
    return {
        "sessions": s,
        "total": total if total is not None else len(s),
        "hasMore": has_more,
        "nextOffset": next_offset,
        "nextCursor": next_cursor,
    }


def _seat_availability_dict() -> dict[str, object]:
    return {
        "sessionId": "ses_roxy_holdovers_20260410_1915",
        "screenName": "Screen 3",
        "rowCount": 10,
        "screenPosition": "top",
        "availableCount": 74,
        "totalCount": 120,
        "seats": [
            {"id": "H7", "row": "H", "number": 7, "status": "available", "x": 7, "y": 8, "isAccessible": False},
            {"id": "H8", "row": "H", "number": 8, "status": "available", "x": 8, "y": 8, "isAccessible": False},
            {"id": "A1", "row": "A", "number": 1, "status": "wheelchair", "x": 1, "y": 1, "isAccessible": True},
            {"id": "B3", "row": "B", "number": 3, "status": "taken", "x": 3, "y": 2, "isAccessible": False},
        ],
    }


class TestListAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_session_list_response())
        res = SessionsResource(spy)
        await res.list()
        assert len(spy.calls) == 1
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/sessions"

    async def test_passes_site_id_filter(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_session_list_response())
        res = SessionsResource(spy)
        await res.list(SessionFilter(site_id="site_roxy_wellington"))
        assert spy.last_call.params is not None
        assert spy.last_call.params["site_id"] == "site_roxy_wellington"

    async def test_passes_date_and_format_filters(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_session_list_response())
        res = SessionsResource(spy)
        await res.list(SessionFilter(date="2026-04-10", format=SessionFormat.IMAX))
        assert spy.last_call.params is not None
        assert spy.last_call.params["date"] == "2026-04-10"
        assert spy.last_call.params["format"] == "IMAX"

    async def test_passes_bookable_only_flag(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_session_list_response())
        res = SessionsResource(spy)
        await res.list(SessionFilter(bookable_only=True))
        assert spy.last_call.params is not None
        assert spy.last_call.params["bookable_only"] == "True"

    async def test_returns_empty_when_no_sessions(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_session_list_response(sessions=[], total=0))
        res = SessionsResource(spy)
        result = await res.list()
        assert len(result.sessions) == 0
        assert result.total == 0
        assert result.has_more is False

    async def test_returns_film_title_and_format(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(
            _session_list_response(sessions=[_session_dict(filmTitle="Oppenheimer", format="IMAX3D")])
        )
        res = SessionsResource(spy)
        result = await res.list()
        assert result.sessions[0].film_title == "Oppenheimer"
        assert result.sessions[0].format.value == "IMAX3D"

    async def test_returns_multiple_sessions(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(
            _session_list_response(
                sessions=[
                    _session_dict(id="ses_001"),
                    _session_dict(id="ses_002", filmTitle="Dune: Part Two", format="IMAX"),
                ],
                total=2,
            )
        )
        res = SessionsResource(spy)
        result = await res.list()
        assert len(result.sessions) == 2
        assert result.sessions[1].format.value == "IMAX"


class TestGetAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_session_dict())
        res = SessionsResource(spy)
        await res.get("ses_roxy_holdovers_20260410_1915")
        assert spy.last_call.path == "/ocapi/v1/sessions/ses_roxy_holdovers_20260410_1915"

    async def test_returns_bookability_flags(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(
            _session_dict(isBookable=False, isSoldOut=True, seatsAvailable=0)
        )
        res = SessionsResource(spy)
        result = await res.get("ses_001")
        assert result.is_bookable is False
        assert result.is_sold_out is True
        assert result.seats_available == 0


class TestGetAvailabilityAsync:
    async def test_calls_seat_plan_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_seat_availability_dict())
        res = SessionsResource(spy)
        await res.availability("ses_roxy_holdovers_20260410_1915")
        assert spy.last_call.path == "/ocapi/v1/sessions/ses_roxy_holdovers_20260410_1915/seat-plan"

    async def test_returns_seat_counts(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_seat_availability_dict())
        res = SessionsResource(spy)
        result = await res.availability("ses_001")
        assert result.available_count == 74
        assert result.total_count == 120
        assert result.screen_name == "Screen 3"

    async def test_returns_individual_seat_records(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_seat_availability_dict())
        res = SessionsResource(spy)
        result = await res.availability("ses_001")
        h7 = next(s for s in result.seats if s.id == "H7")
        assert h7.row == "H"
        assert h7.number == 7
        assert h7.status.value == "available"
        assert h7.is_accessible is False

    async def test_identifies_wheelchair_seats(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_seat_availability_dict())
        res = SessionsResource(spy)
        result = await res.availability("ses_001")
        wheelchair = [s for s in result.seats if s.status.value == "wheelchair"]
        assert len(wheelchair) == 1
        assert wheelchair[0].is_accessible is True
        assert wheelchair[0].id == "A1"

    async def test_distinguishes_available_from_taken(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_seat_availability_dict())
        res = SessionsResource(spy)
        result = await res.availability("ses_001")
        available = [s for s in result.seats if s.status.value == "available"]
        taken = [s for s in result.seats if s.status.value == "taken"]
        assert len(available) == 2
        assert len(taken) == 1


class TestListAllAsync:
    async def test_yields_all_sessions_single_page(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(
            _session_list_response(
                sessions=[_session_dict(id="ses_001"), _session_dict(id="ses_002", filmTitle="Perfect Days")],
                has_more=False,
            )
        )
        res = SessionsResource(spy)
        collected = [s async for s in res.list_all()]
        assert len(collected) == 2
        assert collected[0].id == "ses_001"
        assert collected[1].film_title == "Perfect Days"
        assert len(spy.calls) == 1

    async def test_auto_paginates_when_has_more(self) -> None:
        spy = SpyHttpProtocol()
        spy.enqueue_response(
            _session_list_response(
                sessions=[_session_dict(id="ses_p1_001"), _session_dict(id="ses_p1_002")],
                total=3, has_more=True, next_offset=2,
            )
        )
        spy.enqueue_response(
            _session_list_response(
                sessions=[_session_dict(id="ses_p2_001")],
                total=3, has_more=False,
            )
        )
        res = SessionsResource(spy)
        collected = [s async for s in res.list_all()]
        assert len(collected) == 3
        assert len(spy.calls) == 2

    async def test_handles_empty_first_page(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(
            _session_list_response(sessions=[], total=0, has_more=False)
        )
        res = SessionsResource(spy)
        collected = [s async for s in res.list_all()]
        assert len(collected) == 0
        assert len(spy.calls) == 1


class TestListPaginatedAsync:
    async def test_returns_offset_strategy(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_session_list_response(has_more=False))
        res = SessionsResource(spy)
        page = await res.list_paginated(pagination=PaginationParams(limit=10))
        assert page.strategy.value == "offset"

    async def test_returns_cursor_strategy_when_cursor_given(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(
            _session_list_response(has_more=True, next_cursor="cur_next")
        )
        res = SessionsResource(spy)
        page = await res.list_paginated(pagination=PaginationParams(cursor="cur_page2"))
        assert page.strategy.value == "cursor"
        assert page.next_cursor == "cur_next"


class TestErrorPropagation:
    async def test_list_propagates_not_found_error(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(NotFoundError("Session", "ses_expired"))
        res = SessionsResource(spy)
        with pytest.raises(NotFoundError, match="not found"):
            await res.list(SessionFilter(site_id="site_nonexistent"))

    async def test_get_propagates_error(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(NotFoundError("Session", "ses_expired"))
        res = SessionsResource(spy)
        with pytest.raises(NotFoundError):
            await res.get("ses_expired")
