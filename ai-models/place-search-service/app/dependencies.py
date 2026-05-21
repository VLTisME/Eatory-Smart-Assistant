"""Dependency providers for the place search AI service."""

from __future__ import annotations

from functools import lru_cache

from app.refinement import PlaceRefinementClient, RefinementError, get_refinement_client
from app.search_engine import PlaceSearchEngine


@lru_cache(maxsize=1)
def get_place_search_engine() -> PlaceSearchEngine:
    return PlaceSearchEngine()


def get_optional_refinement_client() -> PlaceRefinementClient | None:
    try:
        return get_refinement_client()
    except RefinementError:
        return None
