
import logging
from fastapi import APIRouter, Query, HTTPException

from app.features.place_details.schemas import (
    PlaceDetailItem,
    PlaceDetailResponse,
    PlacesByCityResponse,
    PlaceExistsResponse,
    LocationSchema,
)
from app.features.place_details.service import (
    get_place_detail,
    get_places_by_city,
    check_place_exists,
)

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


@router.get("/by-city", response_model=PlacesByCityResponse)
async def places_by_city(
    city: str = Query(
        ...,
        min_length=1,
        description="City name to search for (e.g. 'Hồ Chí Minh', 'Hà Nội')",
    ),
    limit: int = Query(
        default=4,
        ge=1,
        le=20,
        description="Number of places to return",
    ),
) -> PlacesByCityResponse:
    """Get random places in a given city."""
    rows = get_places_by_city(city, limit=limit)

    items = [
        PlaceDetailItem(
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
        for row in rows
    ]

    return PlacesByCityResponse(data=items, total=len(items))


@router.get("/check-place", response_model=PlaceExistsResponse)
async def check_place(
    name: str = Query(
        ...,
        min_length=1,
        description="Place name to check",
    ),
) -> PlaceExistsResponse:
    """Check if a place exists in the database by name."""
    row = check_place_exists(name)

    if not row:
        return PlaceExistsResponse(exists=False, data=None)

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

    return PlaceExistsResponse(exists=True, data=item)
