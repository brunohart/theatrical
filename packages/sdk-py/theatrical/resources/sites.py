"""Sites resource — cinema locations, screens, and geographic discovery."""

from __future__ import annotations

import builtins
from typing import TYPE_CHECKING, Optional

from pydantic import TypeAdapter

from theatrical.types.site import Screen, Site

if TYPE_CHECKING:
    from theatrical.http.client import TheatricalHttpProtocol

_site_list_adapter = TypeAdapter(builtins.list[Site])
_site_adapter = TypeAdapter(Site)
_screen_list_adapter = TypeAdapter(builtins.list[Screen])


class SitesResource:
    def __init__(self, http: TheatricalHttpProtocol) -> None:
        self._http = http

    async def list(
        self,
        *,
        query: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius: Optional[float] = None,
    ) -> builtins.list[Site]:
        params: dict[str, str] = {}
        if query is not None:
            params["query"] = query
        if latitude is not None:
            params["latitude"] = str(latitude)
        if longitude is not None:
            params["longitude"] = str(longitude)
        if radius is not None:
            params["radius"] = str(radius)
        raw = await self._http.get("/ocapi/v1/sites", params=params or None)
        return _site_list_adapter.validate_python(raw)

    async def get(self, site_id: str) -> Site:
        raw = await self._http.get(f"/ocapi/v1/sites/{site_id}")
        return _site_adapter.validate_python(raw)

    async def screens(self, site_id: str) -> builtins.list[Screen]:
        raw = await self._http.get(f"/ocapi/v1/sites/{site_id}/screens")
        return _screen_list_adapter.validate_python(raw)

    async def nearby(
        self, latitude: float, longitude: float, radius_km: float
    ) -> builtins.list[Site]:
        raw = await self._http.get(
            "/ocapi/v1/sites",
            params={
                "latitude": str(latitude),
                "longitude": str(longitude),
                "radius": str(radius_km),
            },
        )
        return _site_list_adapter.validate_python(raw)
