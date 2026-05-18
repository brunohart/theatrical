"""Mock mode — offline fixture-based client for demos and testing."""

from theatrical.mock.adapter import MockHttpAdapter
from theatrical.mock.fixtures import DEFAULT_FIXTURES

__all__ = [
    "DEFAULT_FIXTURES",
    "MockHttpAdapter",
]
