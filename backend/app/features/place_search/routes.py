"""Routes for image-based place search."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from app.features.place_search.schemas import PlaceSearchResponse
from app.features.place_search.service import PlaceSearchPipeline, PlaceSearchEngine, get_place_search_engine
from app.shared.image_upload import validate_image_upload
from app.shared.refinement import RefinementClient, RefinementError, get_refinement_client

router = APIRouter(prefix="/api/v1/place-search", tags=["Place Search"])


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
    response = pipeline.run(validated.data, target_language=target_language)

    if not response.results:
        raise HTTPException(status_code=404, detail="No matching place found for the uploaded image.")

    return response
