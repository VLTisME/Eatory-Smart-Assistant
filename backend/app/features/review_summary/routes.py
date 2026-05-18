from fastapi import APIRouter, Depends, Query, HTTPException

from app.features.review_summary.schemas import ReviewSummaryResponse, ReviewSamplesResponse, ReviewSampleItem
from app.features.review_summary.service import get_review_summary_service, ReviewSummaryService


router = APIRouter(prefix="/api/v1/review-summary", tags = ["Review Summary"])

@router.get("", response_model=ReviewSummaryResponse)
async def get_review_summary(
    place_id: str = Query(..., description="place_id of the location"),
    target_language: str = Query(default="vi", description="Target language"),
    
    service: ReviewSummaryService = Depends(get_review_summary_service)) -> ReviewSummaryResponse:
    try:
        return service.get_summary(place_id=place_id, target_language=target_language)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))


@router.get("/samples", response_model=ReviewSamplesResponse)
async def get_review_samples(
    place_id: str = Query(..., description="place_id of the location"),
    limit: int = Query(default=3, description="Number of reviews to fetch"),
    service: ReviewSummaryService = Depends(get_review_summary_service),
) -> ReviewSamplesResponse:
    try:
        data = service.get_samples(place_id=place_id, limit=limit)
        items = [
            ReviewSampleItem(
                id=int(row.get("id", 0)),
                text=str(row.get("text", "")),
                rating=int(row.get("rating", 0)),
            ) for row in data
        ]
        return ReviewSamplesResponse(place_id=place_id, reviews=items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
