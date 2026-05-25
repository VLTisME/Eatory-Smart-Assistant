"""HTTP routes for the place search AI service."""

from __future__ import annotations

import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, UploadFile, status

from app.config import settings
from app.dependencies import get_optional_refinement_client, get_place_search_engine
from app.image_upload import validate_image_upload
from app.pipeline import PlaceSearchPipeline
from app.refinement import PlaceRefinementClient
from app.schemas import PlaceSearchResponse
from app.search_engine import PlaceSearchEngine, PlaceSearchNoiseError, PlaceSearchServiceError


router = APIRouter()


async def verify_service_token(authorization: Annotated[str | None, Header()] = None) -> None:
    """Validate service-to-service bearer auth when SERVICE_TOKEN is configured."""

    if not settings.service_token:
        return

    expected = f"Bearer {settings.service_token}"
    if authorization != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid service token.")


@router.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": settings.app_name, "version": settings.app_version}


@router.post(
    "/v1/place-search/by-image",
    response_model=PlaceSearchResponse,
    tags=["Place Search"],
    dependencies=[Depends(verify_service_token)],
)
async def search_places_by_image(
    file: UploadFile = File(...),
    target_language: str = Query(default="vi", description="Output language for optional refinement"),
    engine: PlaceSearchEngine = Depends(get_place_search_engine),
    llm_client: PlaceRefinementClient | None = Depends(get_optional_refinement_client),
) -> PlaceSearchResponse:
    validated = await validate_image_upload(file)
    pipeline = PlaceSearchPipeline(engine=engine, llm_client=llm_client)
    try:
        return await asyncio.to_thread(
            pipeline.run,
            validated.data,
            target_language=target_language,
        )
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
    except PlaceSearchServiceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
