"""Films resource — now showing, coming soon, search."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from theatrical.types.film import Film, FilmDetail, FilmFilter, FilmSearchFilter

if TYPE_CHECKING:
    from theatrical.http.client import TheatricalHttpProtocol


class FilmsResource:
    def __init__(self, http: TheatricalHttpProtocol) -> None:
        self._http = http

    async def now_showing(self, filters: Optional[FilmFilter] = None) -> list[Film]:
        raise NotImplementedError

    async def coming_soon(self, filters: Optional[FilmFilter] = None) -> list[Film]:
        raise NotImplementedError

    async def search(self, filters: Optional[FilmSearchFilter] = None) -> list[Film]:
        raise NotImplementedError

    async def get_detail(self, film_id: str) -> FilmDetail:
        raise NotImplementedError
