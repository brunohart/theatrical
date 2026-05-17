"""Spy-based tests for FilmsResource — URL, param, and response verification."""

from __future__ import annotations

import pytest

from tests.conftest import SpyHttpProtocol
from theatrical.errors.exceptions import NotFoundError, ServerError
from theatrical.resources.films import FilmsResource
from theatrical.types.film import FilmFilter, FilmFormat, FilmLanguage, FilmSearchFilter, Genre


def _film_dict(**overrides: object) -> dict[str, object]:
    base = {
        "id": "film_holdovers_2023",
        "title": "The Holdovers",
        "synopsis": "A curmudgeon instructor at a prep school.",
        "genres": ["drama", "comedy"],
        "runtime": 133,
        "rating": {"classification": "M", "description": "Offensive language"},
        "releaseDate": "2023-10-27",
        "posterUrl": "https://example.com/holdovers.jpg",
        "cast": [{"name": "Paul Giamatti", "role": "Paul Hunham"}],
        "director": "Alexander Payne",
        "isNowShowing": True,
        "isComingSoon": False,
    }
    base.update(overrides)
    return base


def _film_detail_dict(**overrides: object) -> dict[str, object]:
    base = _film_dict()
    base.update({
        "crew": [{"name": "Alexander Payne", "department": "Directing", "job": "Director"}],
        "ratings": [{"source": "IMDB", "score": "7.9", "outOf": "10"}],
        "formats": ["2D"],
        "languages": ["en"],
    })
    base.update(overrides)
    return base


class TestNowShowingAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict()])
        res = FilmsResource(spy)
        await res.now_showing()
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/films/now-showing"

    async def test_passes_site_id_filter(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict()])
        res = FilmsResource(spy)
        await res.now_showing(site_id="site_roxy")
        assert spy.last_call.params is not None
        assert spy.last_call.params["siteId"] == "site_roxy"

    async def test_sends_no_params_without_site_id(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict()])
        res = FilmsResource(spy)
        await res.now_showing()
        assert spy.last_call.params is None

    async def test_returns_multiple_films(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([
            _film_dict(id="film_001", title="The Holdovers"),
            _film_dict(id="film_002", title="Oppenheimer", runtime=180),
        ])
        res = FilmsResource(spy)
        result = await res.now_showing()
        assert len(result) == 2
        assert result[0].title == "The Holdovers"
        assert result[1].runtime == 180


class TestComingSoonAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict(isComingSoon=True, isNowShowing=False)])
        res = FilmsResource(spy)
        await res.coming_soon()
        assert spy.last_call.path == "/ocapi/v1/films/coming-soon"

    async def test_passes_site_id_filter(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict()])
        res = FilmsResource(spy)
        await res.coming_soon(site_id="site_embassy")
        assert spy.last_call.params is not None
        assert spy.last_call.params["siteId"] == "site_embassy"


class TestGetAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_film_dict())
        res = FilmsResource(spy)
        await res.get("film_holdovers_2023")
        assert spy.last_call.path == "/ocapi/v1/films/film_holdovers_2023"

    async def test_returns_film_details(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_film_dict(title="Oppenheimer", runtime=180))
        res = FilmsResource(spy)
        result = await res.get("film_opp")
        assert result.title == "Oppenheimer"
        assert result.runtime == 180


class TestGetDetailAsync:
    async def test_calls_detail_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_film_detail_dict())
        res = FilmsResource(spy)
        await res.get_detail("film_holdovers_2023")
        assert spy.last_call.path == "/ocapi/v1/films/film_holdovers_2023/detail"

    async def test_returns_cast_and_crew(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_film_detail_dict())
        res = FilmsResource(spy)
        result = await res.get_detail("film_holdovers_2023")
        assert len(result.cast) == 1
        assert result.cast[0].name == "Paul Giamatti"
        assert len(result.crew) == 1
        assert result.crew[0].department == "Directing"

    async def test_returns_ratings(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_film_detail_dict())
        res = FilmsResource(spy)
        result = await res.get_detail("film_holdovers_2023")
        assert len(result.ratings) == 1
        assert result.ratings[0].source == "IMDB"
        assert result.ratings[0].score == "7.9"


class TestSearchAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict()])
        res = FilmsResource(spy)
        await res.search(FilmFilter(query="holdovers"))
        assert spy.last_call.path == "/ocapi/v1/films"

    async def test_passes_query_param(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict()])
        res = FilmsResource(spy)
        await res.search(FilmFilter(query="holdovers"))
        assert spy.last_call.params is not None
        assert spy.last_call.params["query"] == "holdovers"

    async def test_passes_genre_filter(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict()])
        res = FilmsResource(spy)
        await res.search(FilmFilter(genre=Genre.DRAMA))
        assert spy.last_call.params is not None
        assert spy.last_call.params["genre"] == "drama"

    async def test_passes_now_showing_flag(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict()])
        res = FilmsResource(spy)
        await res.search(FilmFilter(now_showing=True))
        assert spy.last_call.params is not None
        assert spy.last_call.params["now_showing"] == "True"

    async def test_passes_coming_soon_flag(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict()])
        res = FilmsResource(spy)
        await res.search(FilmFilter(coming_soon=True))
        assert spy.last_call.params is not None
        assert spy.last_call.params["coming_soon"] == "True"

    async def test_returns_empty_for_no_matches(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([])
        res = FilmsResource(spy)
        result = await res.search(FilmFilter(query="nonexistent"))
        assert len(result) == 0


class TestAdvancedSearchAsync:
    async def test_calls_search_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict()])
        res = FilmsResource(spy)
        await res.advanced_search(FilmSearchFilter(query="drama"))
        assert spy.last_call.path == "/ocapi/v1/films/search"

    async def test_passes_runtime_filters(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict()])
        res = FilmsResource(spy)
        await res.advanced_search(FilmSearchFilter(min_runtime=90, max_runtime=180))
        assert spy.last_call.params is not None
        assert spy.last_call.params["min_runtime"] == "90"
        assert spy.last_call.params["max_runtime"] == "180"

    async def test_passes_pagination_params(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict()])
        res = FilmsResource(spy)
        await res.advanced_search(FilmSearchFilter(limit=10, offset=20))
        assert spy.last_call.params is not None
        assert spy.last_call.params["limit"] == "10"
        assert spy.last_call.params["offset"] == "20"

    async def test_passes_sort_params(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict()])
        res = FilmsResource(spy)
        await res.advanced_search(FilmSearchFilter(sort_by="releaseDate", sort_order="desc"))
        assert spy.last_call.params is not None
        assert spy.last_call.params["sort_by"] == "releaseDate"
        assert spy.last_call.params["sort_order"] == "desc"

    async def test_passes_format_and_language(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_film_dict()])
        res = FilmsResource(spy)
        await res.advanced_search(FilmSearchFilter(format=FilmFormat.IMAX, language=FilmLanguage.EN))
        assert spy.last_call.params is not None
        assert spy.last_call.params["format"] == "IMAX"
        assert spy.last_call.params["language"] == "en"


class TestErrorPropagation:
    async def test_get_propagates_not_found(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(NotFoundError("Film", "film_none"))
        res = FilmsResource(spy)
        with pytest.raises(NotFoundError):
            await res.get("film_none")

    async def test_now_showing_propagates_server_error(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(ServerError())
        res = FilmsResource(spy)
        with pytest.raises(ServerError):
            await res.now_showing()
