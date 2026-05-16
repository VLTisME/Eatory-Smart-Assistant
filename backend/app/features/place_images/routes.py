import logging
from fastapi import APIRouter, Query, HTTPException

from app.features.place_images.schemas import (
    PlaceImageItem,
    PlaceImagesResponse,
    SingleImageResponse,
)

from app.features.place_images.service import (
    get_single_image,
    get_batch_images,
    get_random_image,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/place-images", tags=["Place Images"])
@router.get("/single", response_model=SingleImageResponse)
async def single_image(place_id: str = Query(..., min_length=1, description="Location ID"),) -> SingleImageResponse:
    result = get_single_image(place_id)
    if not result:
        raise HTTPException(status_code=404, detail="No photos found for this location.")
    
    return SingleImageResponse(
        image_id=result.get("image_id", ""),
        place_id=result.get("place_id", ""),
        file_path=result.get("file_path", ""),
    )

@router.get("", response_model=PlaceImagesResponse)
async def batch_images(
    place_id: str = Query(..., min_length=1, description="ID of the location"),
    limit: int = Query(default=10, ge=1, le=50, description="Maximum number of photos"),
    offset: int = Query(default=0, ge=0, description="Starting position (pagination)"),
) -> PlaceImagesResponse:
    results = get_batch_images(place_id, limit=limit, offset=offset)
    images = [
        PlaceImageItem(
            image_id=row.get("image_id", ""),
            place_id=row.get("place_id", ""),
            file_path=row.get("file_path", ""),
        )
        for row in results
    ]
    return PlaceImagesResponse(
        place_id=place_id,
        images=images,
        total=len(images),
    )

@router.get("/random", response_model=SingleImageResponse)
async def random_image(
    place_id: str = Query(..., min_length=1, description="ID of the location"),
) -> SingleImageResponse:
    result = get_random_image(place_id)
    if not result:
        raise HTTPException(status_code=404, detail="No photos found for this location.")
    return SingleImageResponse(
        image_id=result.get("image_id", ""),
        place_id=result.get("place_id", ""),
        file_path=result.get("file_path", ""),
    )

