"""Films resource — now showing, coming soon, search, and detailed film information."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import TypeAdapter

from theatrical.types.film import Film, FilmDetail, FilmFilter, FilmSearchFilter

if TYPE_CHECKING:
    from theatrical.http.client import TheatricalHttpProtocol

_film_list_adapter = TypeAdapter(list[Film])
_film_adapter = TypeAdapter(Film)
_film_detail_adapter = TypeAdapter(FilmDetail)


class FilmsResource:
    def __init__(self, http: TheatricalHttpProtocol) -> None:
        self._http = http

    async def now_showing(self, *, site_id: Optional[str] = None) -> list[Film]:
        params: dict[str, str] | None = {"siteId": site_id} if site_id else None
        raw = await self._http.get("/ocapi/v1/films/now-showing", params=params)
        return _film_list_adapter.validate_python(raw)

    async def coming_soon(self, *, site_id: Optional[str] = None) -> list[Film]:
        params: dict[str, str] | None = {"siteId": site_id} if site_id else None
        raw = await self._http.get("/ocapi/v1/films/coming-soon", params=params)
        return _film_list_adapter.validate_python(raw)

    async def get(self, film_id: str) -> Film:
        raw = await self._http.get(f"/ocapi/v1/films/{film_id}")
        return _film_adapter.validate_python(raw)

    async def get_detail(self, film_id: str) -> FilmDetail:
        raw = await self._http.get(f"/ocapi/v1/films/{film_id}/detail")
        return _film_detail_adapter.validate_python(raw)

    async def search(self, filters: FilmFilter) -> list[Film]:
        params: dict[str, str] = {}
        d = filters.model_dump(exclude_none=True)
        for key, value in d.items():
            params[key] = str(value) if not isinstance(value, str) else value
        raw = await self._http.get("/ocapi/v1/films", params=params or None)
        return _film_list_adapter.validate_python(raw)

    async def advanced_search(self, filters: FilmSearchFilter) -> list[Film]:
        params: dict[str, str] = {}
        d = filters.model_dump(exclude_none=True)
        for key, value in d.items():
            params[key] = str(value) if not isinstance(value, str) else value
        raw = await self._http.get("/ocapi/v1/films/search", params=params or None)
        return _film_list_adapter.validate_python(raw)
