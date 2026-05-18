import json
import logging
import re

from functools import lru_cache
from pathlib import Path
from app.core.config import settings
from app.features.review_summary.schemas import ReviewSummaryResponse
from app.shared.refinement import RefinementClient
from app.core.supabase import get_supabase_client

logger = logging.getLogger(__name__)

class ReviewSummaryService:
    def __init__(self, llm_client: RefinementClient | None = None) -> None:
        self._llm = llm_client
        self._cache: dict[str, ReviewSummaryResponse] = {}

    def _fetch_from_supabase(self, place_id: str) -> dict | None:
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
    def get_summary(self, place_id:str, target_language: str = "vi") -> ReviewSummaryResponse:
        cache_key = f"{place_id}_{target_language}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        if target_language.lower() != "vi":
            # 1. Get the base summary in Vietnamese
            base_response = self.get_summary(place_id, target_language="vi")
            
            # 2. If LLM is missing or it errored out, just return the base response
            if not self._llm or "An error occurred" in base_response.summary:
                return base_response

            # 3. Translate the exact summary text to the target language
            try:
                translated_text, duration_ms, _ = self._llm.refine(
                    content=base_response.summary,
                    context="translate_review_summary",
                    source_language="vi",
                    target_language=target_language
                )
                logger.info("LLM summary translation completed in %.0fms", duration_ms)
                
                response = ReviewSummaryResponse(
                    place_id=base_response.place_id,
                    name=base_response.name,
                    summary=translated_text,
                    positive_ratio=base_response.positive_ratio,
                    negative_ratio=base_response.negative_ratio,
                )
                self._cache[cache_key] = response
                return response
            except Exception as exc:
                logger.error("Error when calling LLM translate: %s", exc)
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

        if not self._llm:
            logger.warning("The LLM client is not configured; it returns raw data.")
            return ReviewSummaryResponse(
                place_id=place_id,
                name=place_name,
                summary="LLM has not been configured for summarization.",
                positive_ratio=positive_ratio,
                negative_ratio=negative_ratio,
            )
        
        top_pos = place_data.get("top_positive_keywords", [])
        top_neg = place_data.get("top_negative_keywords", [])

        content_obj = {
            "place_name": place_name,
            "positive_ratio": positive_ratio,
            "negative_ratio": negative_ratio,
            "top_positive_keywords": top_pos,
            "top_negative_keywords": top_neg,
        }

        try:
            refined_text, duration_ms, _ = self._llm.refine(content = json.dumps(content_obj, ensure_ascii=False),
            context = "review_summary",
            source_language="vi",
            target_language=target_language)
            logger.info("LLM refinement completed in %.0fms", duration_ms)
            
            json_match = re.search(r"\{.*\}", refined_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group(0))
                summary_text = result.get("summary", "")
            else:
                summary_text = refined_text
                
            summary_text = re.sub(r'\n?🍜[^\n]*:\s*\n?\s*$', '', summary_text).rstrip()

            response = ReviewSummaryResponse(
                place_id=place_id,
                name=place_name,
                summary=summary_text,
                positive_ratio=positive_ratio,
                negative_ratio=negative_ratio,
            )
            self._cache[cache_key] = response
            return response
        except Exception as exc:
            logger.error("Error when calling LLM refine: %s", exc)
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
    from app.shared.refinement import get_refinement_client
    try:
        llm = get_refinement_client()
    except Exception:
        llm = None
    return ReviewSummaryService(llm_client=llm)
