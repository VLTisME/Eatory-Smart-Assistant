"""Routes for image-based place search."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from app.features.place_search.client import (
    PlaceSearchAIClient,
    PlaceSearchServiceError,
    get_place_search_client,
)
from app.features.place_search.schemas import PlaceSearchResponse
from app.features.places.routes import router as places_router
from app.shared.image_upload import validate_image_upload

router = APIRouter(prefix="/api/v1/place-search", tags=["Place Search"])
__all__ = ["router", "places_router"]


@router.post("", response_model=PlaceSearchResponse)
async def search_places_by_image(
    file: UploadFile = File(...),
    target_language: str = Query(default="vi", description="Ngon ngu dau ra cho buoc refine"),
    client: PlaceSearchAIClient = Depends(get_place_search_client),
) -> PlaceSearchResponse:
    validated = await validate_image_upload(file)
    try:
        response = await client.search_by_image(validated, target_language=target_language)
    except PlaceSearchServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    if not response.results:
        raise HTTPException(status_code=404, detail="No matching place found for the uploaded image.")

    return response
