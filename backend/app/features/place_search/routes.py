"""Routes for Place Search feature (Goong Places API proxy)."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query, status

from app.features.place_search import service
from app.features.place_search.schemas import (
    PlaceAutoCompleteResponse,
    PlaceDetailResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/places", tags=["Places"])


@router.get("/autocomplete", response_model=PlaceAutoCompleteResponse)
async def autocomplete(
    input: str = Query(..., min_length=1, max_length=200, description="Search keyword"),
    location: str | None = Query(None, description="Lat,lng for location bias"),
    limit: int = Query(10, ge=1, le=20, description="Max results"),
    radius: int | None = Query(None, ge=50, le=50000, description="Radius in metres"),
    more_compound: bool | None = Query(None, description="More address compounds"),
):
    """Proxy for Goong Place/AutoComplete with server-side caching & rate limiting."""
    try:
        data = await service.autocomplete(
            input_text=input,
            location=location,
            limit=limit,
            radius=radius,
            more_compound=more_compound,
        )
        return data
    except service.RateLimitExceeded as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Goong autocomplete error")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Upstream API error: {exc}",
        )


@router.get("/detail", response_model=PlaceDetailResponse)
async def detail(
    place_id: str = Query(..., min_length=1, description="Goong place_id"),
):
    """Proxy for Goong Place/Detail."""
    try:
        data = await service.place_detail(place_id=place_id)
        return data
    except service.RateLimitExceeded as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Goong detail error")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Upstream API error: {exc}",
        )
