"""Film types."""

from __future__ import annotations

from enum import Enum
from typing import Literal, Optional

from theatrical.types.base import ApiModel


class Genre(str, Enum):
    ACTION = "action"
    ADVENTURE = "adventure"
    ANIMATION = "animation"
    COMEDY = "comedy"
    CRIME = "crime"
    DOCUMENTARY = "documentary"
    DRAMA = "drama"
    FAMILY = "family"
    FANTASY = "fantasy"
    HORROR = "horror"
    MUSICAL = "musical"
    MYSTERY = "mystery"
    ROMANCE = "romance"
    SCI_FI = "sci-fi"
    THRILLER = "thriller"
    WAR = "war"
    WESTERN = "western"


class FilmFormat(str, Enum):
    TWO_D = "2D"
    THREE_D = "3D"
    IMAX = "IMAX"
    IMAX_3D = "IMAX 3D"
    FOUR_DX = "4DX"
    DOLBY_ATMOS = "Dolby Atmos"
    SCREENX = "ScreenX"


class FilmLanguage(str, Enum):
    EN = "en"
    ES = "es"
    FR = "fr"
    DE = "de"
    JA = "ja"
    KO = "ko"
    ZH = "zh"
    HI = "hi"
    TE = "te"
    MI = "mi"


class Rating(ApiModel):
    classification: str
    description: Optional[str] = None


class CastMember(ApiModel):
    name: str
    role: Optional[str] = None


class CrewMember(ApiModel):
    name: str
    department: str
    job: str


class FilmRating(ApiModel):
    source: str
    score: str
    out_of: Optional[str] = None


class Film(ApiModel):
    id: str
    title: str
    synopsis: str
    genres: list[Genre]
    runtime: int
    rating: Rating
    release_date: str
    poster_url: Optional[str] = None
    trailer_url: Optional[str] = None
    cast: list[CastMember]
    director: str
    distributor: Optional[str] = None
    is_now_showing: bool
    is_coming_soon: bool


class FilmDetail(Film):
    crew: list[CrewMember]
    ratings: list[FilmRating]
    formats: list[FilmFormat]
    languages: list[FilmLanguage]
    original_title: Optional[str] = None
    production_countries: Optional[list[str]] = None
    budget: Optional[float] = None
    box_office: Optional[float] = None
    website: Optional[str] = None


class FilmFilter(ApiModel):
    site_id: Optional[str] = None
    genre: Optional[Genre] = None
    query: Optional[str] = None
    now_showing: Optional[bool] = None
    coming_soon: Optional[bool] = None
    limit: Optional[int] = None
    offset: Optional[int] = None


class FilmSearchFilter(FilmFilter):
    rating_classification: Optional[str] = None
    format: Optional[FilmFormat] = None
    language: Optional[FilmLanguage] = None
    release_date_from: Optional[str] = None
    release_date_to: Optional[str] = None
    min_runtime: Optional[int] = None
    max_runtime: Optional[int] = None
    sort_by: Optional[Literal["title", "releaseDate", "runtime", "popularity"]] = None
    sort_order: Optional[Literal["asc", "desc"]] = None
