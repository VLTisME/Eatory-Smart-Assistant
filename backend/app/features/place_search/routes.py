"""Routes for image-based place search and Goong Places proxy."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.features.place_search.schemas import PlaceAutoCompleteResponse, PlaceDetailResponse, PlaceSearchResponse
from app.features.place_search.service import (
    PlaceSearchEngine,
    PlaceSearchPipeline,
    PlaceSearchNoiseError,
    RateLimitExceeded,
    autocomplete as goong_autocomplete,
    get_place_search_engine,
    place_detail as goong_place_detail,
)
from app.shared.image_upload import validate_image_upload
from app.shared.refinement import RefinementClient, RefinementError, get_refinement_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/place-search", tags=["Place Search"])
places_router = APIRouter(prefix="/api/v1/places", tags=["Places"])


def get_optional_refinement_client() -> RefinementClient | None:
    try:
        return get_refinement_client()
    except RefinementError:
        return None


@router.post("", response_model=PlaceSearchResponse)
async def search_places_by_image(
    file: UploadFile = File(...),
    target_language: str = Query(default="vi", description="Ngon ngu dau ra cho buoc refine"),
    engine: PlaceSearchEngine = Depends(get_place_search_engine),
    llm_client: RefinementClient | None = Depends(get_optional_refinement_client),
) -> PlaceSearchResponse:
    validated = await validate_image_upload(file)
    pipeline = PlaceSearchPipeline(engine=engine, llm_client=llm_client)
    try:
        response = pipeline.run(validated.data, target_language=target_language)
    except PlaceSearchNoiseError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "reason": "similar_to_noise",
                "noise_category": exc.category,
                "noise_score": exc.score,
                "noise_image": exc.image_path,
            },
        ) from exc

    if not response.results:
        raise HTTPException(status_code=404, detail="No matching place found for the uploaded image.")

    return response


@places_router.get("/autocomplete", response_model=PlaceAutoCompleteResponse)
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


@places_router.get("/detail", response_model=PlaceDetailResponse)
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
