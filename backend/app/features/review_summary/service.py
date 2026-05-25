import logging

from functools import lru_cache
from app.features.review_summary.schemas import ReviewSummaryResponse
from app.core.supabase import get_supabase_client
from app.features.review_summary.client import ReviewSummaryAIClient, get_review_summary_ai_client

logger = logging.getLogger(__name__)

class ReviewSummaryService:
    def __init__(self, ai_client: ReviewSummaryAIClient | None = None) -> None:
        self._ai_client = ai_client
        self._cache: dict[str, ReviewSummaryResponse] = {}
        self._data: dict[str, dict] | None = None

    def _fetch_from_supabase(self, place_id: str) -> dict | None:
        if self._data is not None:
            return self._data.get(place_id)

        try:
            supabase = get_supabase_client()
            response = (
                supabase
                .table("place_summaries")     
                .select("*")                  
                .eq("place_id", place_id)     
                .limit(1)                     
                .execute()                    
            )
            if response.data and len(response.data) > 0:
                return response.data[0]  
            return None  
        except Exception as e:
            logger.error("Error when querying Supabase place_summaries: %s", e)
            return None

    #Get restaurant summary review
    async def get_summary(self, place_id:str, target_language: str = "vi") -> ReviewSummaryResponse:
        cache_key = f"{place_id}_{target_language}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        if target_language.lower() != "vi":
            # 1. Get the base summary in Vietnamese
            base_response = await self.get_summary(place_id, target_language="vi")
            
            # 2. If AI is missing or it errored out, just return the base response
            if not self._ai_client or "An error occurred" in base_response.summary:
                return base_response

            # 3. Translate the exact summary text to the target language
            try:
                translated = await self._ai_client.translate_summary(
                    summary=base_response.summary,
                    target_language=target_language,
                )
                logger.info("AI summary translation completed in %.0fms", translated.processing_time_ms)
                
                response = ReviewSummaryResponse(
                    place_id=base_response.place_id,
                    name=base_response.name,
                    summary=translated.summary,
                    positive_ratio=base_response.positive_ratio,
                    negative_ratio=base_response.negative_ratio,
                )
                self._cache[cache_key] = response
                return response
            except Exception as exc:
                logger.error("Error when calling review summary AI translate: %s", exc)
                return base_response

        place_data = self._fetch_from_supabase(place_id)

        positive_ratio = place_data.get("positive_ratio", 0.0) if place_data else 0.0
        negative_ratio = place_data.get("negative_ratio", 0.0) if place_data else 0.0

        place_name = place_data.get("place_name","") if place_data else ""

        if not place_data:
            return ReviewSummaryResponse(
                place_id = place_id,
                name = place_name,
                summary = "There is not enough review data for this location",
                positive_ratio=positive_ratio,
                negative_ratio=negative_ratio,
            )

        if not self._ai_client:
            logger.warning("The review summary AI service is not configured; returning fallback message.")
            return ReviewSummaryResponse(
                place_id=place_id,
                name=place_name,
                summary="AI review summary service has not been configured for summarization.",
                positive_ratio=positive_ratio,
                negative_ratio=negative_ratio,
            )
        
        top_pos = place_data.get("top_positive_keywords", [])
        top_neg = place_data.get("top_negative_keywords", [])

        try:
            generated = await self._ai_client.generate_summary(
                place_name=place_name,
                positive_ratio=positive_ratio,
                negative_ratio=negative_ratio,
                top_positive_keywords=[str(item) for item in top_pos],
                top_negative_keywords=[str(item) for item in top_neg],
                target_language=target_language,
            )
            logger.info("AI review summary generation completed in %.0fms", generated.processing_time_ms)

            response = ReviewSummaryResponse(
                place_id=place_id,
                name=place_name,
                summary=generated.summary,
                positive_ratio=positive_ratio,
                negative_ratio=negative_ratio,
            )
            self._cache[cache_key] = response
            return response
        except Exception as exc:
            logger.error("Error when calling review summary AI generate: %s", exc)
            return ReviewSummaryResponse(
                place_id=place_id,
                name=place_name,
                summary="An error occurred while summarizing the review.",
                positive_ratio=positive_ratio,
                negative_ratio=negative_ratio,
            )

    def get_samples(self, place_id: str, limit: int = 3) -> list[dict]:
        try:
            supabase = get_supabase_client()
            # Fetch multiple and randomly sample (or just limit since we can't easily random in Supabase python client without RPC)
            response = (
                supabase
                .table("clean_reviews")
                .select("id, text, rating")
                .eq("place_id", place_id)
                .limit(50)  # fetch up to 50
                .execute()
            )
            data = response.data or []
            import random
            if len(data) > limit:
                return random.sample(data, limit)
            return data
        except Exception as e:
            logger.error("Error when querying Supabase clean_reviews: %s", e)
            return []

@lru_cache(maxsize=1)
def get_review_summary_service() -> ReviewSummaryService:
    try:
        ai_client = get_review_summary_ai_client()
    except Exception:
        ai_client = None
    return ReviewSummaryService(ai_client=ai_client)
