"""Routes for the Goong Directions proxy."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query, status

from app.features.directions.schemas import DirectionResponse
from app.features.directions.service import get_directions

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/directions", tags=["Directions"])


@router.get("", response_model=DirectionResponse)
async def directions(
    origin: str = Query(..., description="Origin as 'lat,lng'"),
    destination: str = Query(..., description="Destination as 'lat,lng'"),
    vehicle: str = Query("car", description="Transport mode: car, motorcycle, walking"),
) -> DirectionResponse:
    """Proxy endpoint for Goong Directions API."""
    try:
        return await get_directions(
            origin=origin,
            destination=destination,
            vehicle=vehicle,
        )
    except Exception as exc:
        logger.exception("Goong directions error")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Upstream API error: {exc}",
        ) from exc
