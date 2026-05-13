"""Sites resource — cinema locations, screens, and configurations."""

from __future__ import annotations

from typing import TYPE_CHECKING

from theatrical.types.site import Site

if TYPE_CHECKING:
    from theatrical.http.client import TheatricalHttpProtocol


class SitesResource:
    def __init__(self, http: TheatricalHttpProtocol) -> None:
        self._http = http

    async def list(self) -> list[Site]:
        raise NotImplementedError

    async def get(self, site_id: str) -> Site:
        raise NotImplementedError
