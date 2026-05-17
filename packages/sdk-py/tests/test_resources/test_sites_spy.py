"""Spy-based tests for SitesResource — URL, param, and response verification."""

from __future__ import annotations

import pytest

from tests.conftest import SpyHttpProtocol
from theatrical.errors.exceptions import AuthenticationError, NotFoundError
from theatrical.resources.sites import SitesResource


def _site_dict(**overrides: object) -> dict[str, object]:
    base = {
        "id": "site_roxy_wellington",
        "name": "Roxy Cinema",
        "address": {
            "line1": "5 Park Road, Miramar",
            "city": "Wellington",
            "postalCode": "6022",
            "country": "NZ",
        },
        "location": {"latitude": -41.3131, "longitude": 174.8090},
        "screens": [
            {"id": "scr_1", "name": "Screen 1", "seatCount": 120, "formats": ["2D", "3D"], "isAccessible": True},
        ],
        "config": {
            "bookingLeadTime": 30,
            "maxTicketsPerOrder": 10,
            "loyaltyEnabled": True,
            "fnbEnabled": True,
        },
        "timezone": "Pacific/Auckland",
        "currency": "NZD",
        "isActive": True,
        "amenities": [{"id": "am_imax", "label": "IMAX"}],
    }
    base.update(overrides)
    return base


def _screen_dict(**overrides: object) -> dict[str, object]:
    base = {
        "id": "scr_roxy_1",
        "name": "Screen 1",
        "seatCount": 120,
        "formats": ["2D", "3D"],
        "isAccessible": True,
    }
    base.update(overrides)
    return base


class TestListAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_site_dict()])
        res = SitesResource(spy)
        await res.list()
        assert len(spy.calls) == 1
        assert spy.last_call.method == "GET"
        assert spy.last_call.path == "/ocapi/v1/sites"

    async def test_passes_no_params_when_no_filters(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_site_dict()])
        res = SitesResource(spy)
        await res.list()
        assert spy.last_call.params is None

    async def test_passes_query_filter(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_site_dict()])
        res = SitesResource(spy)
        await res.list(query="Roxy")
        assert spy.last_call.params is not None
        assert spy.last_call.params["query"] == "Roxy"

    async def test_passes_geo_coordinates(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_site_dict()])
        res = SitesResource(spy)
        await res.list(latitude=-41.3, longitude=174.8)
        assert spy.last_call.params is not None
        assert "latitude" in spy.last_call.params
        assert "longitude" in spy.last_call.params

    async def test_passes_radius(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_site_dict()])
        res = SitesResource(spy)
        await res.list(latitude=-41.3, longitude=174.8, radius=10.0)
        assert spy.last_call.params is not None
        assert "radius" in spy.last_call.params

    async def test_returns_multiple_sites(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([
            _site_dict(id="site_roxy", name="Roxy Cinema"),
            _site_dict(id="site_embassy", name="Embassy Theatre"),
        ])
        res = SitesResource(spy)
        result = await res.list()
        assert len(result) == 2
        assert result[0].name == "Roxy Cinema"
        assert result[1].name == "Embassy Theatre"

    async def test_returns_empty_when_no_sites(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([])
        res = SitesResource(spy)
        result = await res.list()
        assert len(result) == 0

    async def test_returns_site_amenities(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_site_dict()])
        res = SitesResource(spy)
        result = await res.list()
        assert result[0].amenities is not None
        assert result[0].amenities[0].label == "IMAX"


class TestGetAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_site_dict())
        res = SitesResource(spy)
        await res.get("site_roxy_wellington")
        assert spy.last_call.path == "/ocapi/v1/sites/site_roxy_wellington"

    async def test_returns_site_details(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(
            _site_dict(id="site_emb", name="Embassy")
        )
        res = SitesResource(spy)
        result = await res.get("site_emb")
        assert result.id == "site_emb"
        assert result.name == "Embassy"

    async def test_returns_inactive_site(self) -> None:
        spy = SpyHttpProtocol().enqueue_response(_site_dict(isActive=False))
        res = SitesResource(spy)
        result = await res.get("site_closed")
        assert result.is_active is False


class TestScreensAsync:
    async def test_calls_correct_endpoint(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_screen_dict()])
        res = SitesResource(spy)
        await res.screens("site_roxy_wellington")
        assert spy.last_call.path == "/ocapi/v1/sites/site_roxy_wellington/screens"

    async def test_returns_multiple_screens(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([
            _screen_dict(id="scr_1", name="Screen 1", seatCount=120),
            _screen_dict(id="scr_2", name="Screen 2", seatCount=80),
        ])
        res = SitesResource(spy)
        result = await res.screens("site_roxy")
        assert len(result) == 2
        assert result[0].name == "Screen 1"
        assert result[1].seat_count == 80

    async def test_returns_accessibility_info(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_screen_dict()])
        res = SitesResource(spy)
        result = await res.screens("site_roxy")
        assert result[0].is_accessible is True

    async def test_returns_formats(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_screen_dict()])
        res = SitesResource(spy)
        result = await res.screens("site_roxy")
        assert "2D" in result[0].formats
        assert "3D" in result[0].formats


class TestNearbyAsync:
    async def test_calls_list_with_geo_params(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_site_dict()])
        res = SitesResource(spy)
        await res.nearby(-41.3, 174.8, 15.0)
        assert len(spy.calls) == 1
        assert spy.last_call.path == "/ocapi/v1/sites"
        assert spy.last_call.params is not None
        assert "latitude" in spy.last_call.params
        assert "longitude" in spy.last_call.params
        assert "radius" in spy.last_call.params

    async def test_returns_nearby_sites(self) -> None:
        spy = SpyHttpProtocol().enqueue_response([_site_dict(), _site_dict(id="site_far")])
        res = SitesResource(spy)
        result = await res.nearby(-41.3, 174.8, 25.0)
        assert len(result) == 2


class TestErrorPropagation:
    async def test_get_propagates_not_found(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(NotFoundError("Site", "site_nonexistent"))
        res = SitesResource(spy)
        with pytest.raises(NotFoundError):
            await res.get("site_nonexistent")

    async def test_list_propagates_auth_error(self) -> None:
        spy = SpyHttpProtocol().enqueue_error(AuthenticationError())
        res = SitesResource(spy)
        with pytest.raises(AuthenticationError):
            await res.list()
