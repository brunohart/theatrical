"""Pagination types."""

from __future__ import annotations

from enum import Enum
from typing import Generic, Optional, TypeVar

from pydantic import BaseModel


T = TypeVar("T")


class PaginationStrategy(str, Enum):
    CURSOR = "cursor"
    OFFSET = "offset"


class PaginationParams(BaseModel):
    limit: Optional[int] = None
    cursor: Optional[str] = None
    offset: Optional[int] = None


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    total: int
    has_more: bool
    next_cursor: Optional[str] = None
    next_offset: Optional[int] = None
    strategy: PaginationStrategy
