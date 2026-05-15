
import logging
from fastapi import APIRouter, Query, HTTPException

from app.features.place_details.schemas import (
    PlaceDetailItem,
    PlaceDetailResponse,
    LocationSchema,
)
from app.features.place_details.service import get_place_detail

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/place-details",    
    tags=["Place Details"],           
)


@router.get("", response_model=PlaceDetailResponse)
async def place_details(
    place_id: str = Query(
        ...,                              
        min_length=1,                    
        description="Location ID",
    ),
) -> PlaceDetailResponse:

    row = get_place_detail(place_id)

    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"No location with place_id found = '{place_id}'",
        )

    item = PlaceDetailItem(
        place_id=row.get("place_id", ""),
        name=row.get("name", ""),
        type=row.get("type", ""),
        address=row.get("address", ""),
        location=LocationSchema(
            lat=float(row.get("lat", 0)),
            lng=float(row.get("lng", 0)),
        ),
        avg_rating=float(row.get("avg_rating", 0) or 0),
        total_review=int(row.get("total_reviews", 0) or 0),
    )

    return PlaceDetailResponse(data=item)
