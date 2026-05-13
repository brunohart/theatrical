"""Tests for the mock HTTP adapter and fixtures."""

import pytest

from theatrical.errors.exceptions import NotFoundError
from theatrical.mock.adapter import MockHttpAdapter
from theatrical.mock.fixtures import DEFAULT_FIXTURES


class TestDefaultFixtures:
    def test_fixture_count(self) -> None:
        assert len(DEFAULT_FIXTURES) >= 10

    def test_films_now_showing_fixture(self) -> None:
        data = DEFAULT_FIXTURES["/ocapi/v1/films/now-showing"]
        assert isinstance(data, list)
        assert len(data) >= 2
        assert data[0]["title"] == "The Holdovers"

    def test_sessions_fixture(self) -> None:
        data = DEFAULT_FIXTURES["/ocapi/v1/sessions"]
        assert "sessions" in data
        assert len(data["sessions"]) >= 2

    def test_sites_fixture(self) -> None:
        data = DEFAULT_FIXTURES["/ocapi/v1/sites"]
        assert isinstance(data, list)
        assert data[0]["name"] == "Roxy Cinema"

    def test_loyalty_member_fixture(self) -> None:
        data = DEFAULT_FIXTURES["/ocapi/v1/loyalty/members/:id"]
        assert data["firstName"] == "Hemi"
        assert data["tier"]["name"] == "Gold"

    def test_seat_plan_fixture(self) -> None:
        data = DEFAULT_FIXTURES["/ocapi/v1/sessions/:id/seat-plan"]
        assert len(data["seats"]) == 120
        assert data["rowCount"] == 10


class TestMockHttpAdapter:
    @pytest.mark.asyncio
    async def test_get_exact_path(self) -> None:
        adapter = MockHttpAdapter()
        data = await adapter.get("/ocapi/v1/films/now-showing")
        assert isinstance(data, list)
        assert len(data) >= 2

    @pytest.mark.asyncio
    async def test_get_pattern_path(self) -> None:
        adapter = MockHttpAdapter()
        data = await adapter.get("/ocapi/v1/films/film_holdovers_2023")
        assert data["id"] == "film_holdovers_2023"

    @pytest.mark.asyncio
    async def test_get_session_by_id(self) -> None:
        adapter = MockHttpAdapter()
        data = await adapter.get("/ocapi/v1/sessions/ses_roxy_holdovers_20260427_1915")
        assert data["filmTitle"] == "The Holdovers"

    @pytest.mark.asyncio
    async def test_get_seat_plan(self) -> None:
        adapter = MockHttpAdapter()
        data = await adapter.get("/ocapi/v1/sessions/ses_123/seat-plan")
        assert len(data["seats"]) == 120

    @pytest.mark.asyncio
    async def test_get_loyalty_member(self) -> None:
        adapter = MockHttpAdapter()
        data = await adapter.get("/ocapi/v1/loyalty/members/mem_hemi_walker_5528")
        assert data["firstName"] == "Hemi"

    @pytest.mark.asyncio
    async def test_get_unknown_path_raises_not_found(self) -> None:
        adapter = MockHttpAdapter()
        with pytest.raises(NotFoundError):
            await adapter.get("/ocapi/v1/nonexistent/endpoint")

    @pytest.mark.asyncio
    async def test_post_orders_returns_synthetic(self) -> None:
        adapter = MockHttpAdapter()
        data = await adapter.post("/ocapi/v1/orders", {"sessionId": "ses_123"})
        assert data["status"] == "draft"
        assert data["id"].startswith("ord_mock_")

    @pytest.mark.asyncio
    async def test_post_known_path(self) -> None:
        adapter = MockHttpAdapter()
        data = await adapter.post("/ocapi/v1/sessions")
        assert "sessions" in data

    @pytest.mark.asyncio
    async def test_put_known_path(self) -> None:
        adapter = MockHttpAdapter()
        data = await adapter.put("/ocapi/v1/sites/site_roxy_wellington")
        assert data["name"] == "Roxy Cinema"

    @pytest.mark.asyncio
    async def test_put_unknown_returns_empty(self) -> None:
        adapter = MockHttpAdapter()
        data = await adapter.put("/ocapi/v1/unknown/path")
        assert data == {}

    @pytest.mark.asyncio
    async def test_delete_returns_empty(self) -> None:
        adapter = MockHttpAdapter()
        data = await adapter.delete("/ocapi/v1/orders/ord_123")
        assert data == {}

    @pytest.mark.asyncio
    async def test_overrides(self) -> None:
        overrides = {
            "/ocapi/v1/films/now-showing": [{"id": "custom", "title": "Custom Film"}]
        }
        adapter = MockHttpAdapter(overrides)
        data = await adapter.get("/ocapi/v1/films/now-showing")
        assert len(data) == 1
        assert data[0]["title"] == "Custom Film"

    @pytest.mark.asyncio
    async def test_query_params_stripped(self) -> None:
        adapter = MockHttpAdapter()
        data = await adapter.get("/ocapi/v1/sessions?siteId=roxy")
        assert "sessions" in data
