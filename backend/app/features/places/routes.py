"""Routes for Goong Places proxy endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query, status

from app.features.places.schemas import PlaceAutoCompleteResponse, PlaceDetailResponse
from app.features.places.service import (
    RateLimitExceeded,
    autocomplete as goong_autocomplete,
    place_detail as goong_place_detail,
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
) -> PlaceAutoCompleteResponse:
    try:
        return await goong_autocomplete(
            input_text=input,
            location=location,
            limit=limit,
            radius=radius,
            more_compound=more_compound,
        )
    except RateLimitExceeded as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Goong autocomplete error")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Upstream API error: {exc}") from exc


@router.get("/detail", response_model=PlaceDetailResponse)
async def detail(
    place_id: str = Query(..., min_length=1, description="Goong place_id"),
) -> PlaceDetailResponse:
    try:
        return await goong_place_detail(place_id=place_id)
    except RateLimitExceeded as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Goong detail error")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Upstream API error: {exc}") from exc
