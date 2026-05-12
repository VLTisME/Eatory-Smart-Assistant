import json
import logging
import re

from functools import lru_cache
from pathlib import Path
from app.core.config import settings
from app.features.review_summary.schemas import ReviewSummaryResponse
from app.shared.refinement import RefinementClient

logger = logging.getLogger(__name__)

class ReviewSummaryService:
    def __init__(self, llm_client: RefinementClient | None = None) -> None:
        self._llm = llm_client
        self._data = self._load_data()

    #File path finding function
    def _resolve_data_path(self, configured_path: str) -> Path:
        path = Path(configured_path)

        if path.is_absolute():
            return path 

        backend_root = Path(__file__).resolve().parents[3]
        project_root = backend_root.parent

        candidates = [project_root / path, backend_root / path]
        for candidate in candidates:
            if candidate.exists():
                return candidate

        return candidates[0]


    #JSON load file function
    def _load_data(self) -> dict[str, dict]:
        file_path = self._resolve_data_path(settings.review_summary_path)

        if not file_path.exists():
            logger.warning("The review summary file could not be found at: %s", file_path)
            return {}
        try:
            with file_path.open("r", encoding="utf-8") as f:
                raw_list = json.load(f)
                places_by_id = {}
                for item in raw_list:
                    place_id = str(item.get("place_id", "")).strip()
                    if place_id:
                        places_by_id[place_id] = item
                logger.info("Review summaries has been loaded %d", len(places_by_id))
                return places_by_id
        except Exception as e:
            logger.error("Error occur when reading review summaries file: %s", e)
            return {}

    #Get restaurant summary review
    def get_summary(self, place_id:str, target_language: str = "vi") -> ReviewSummaryResponse:
        place_data = self._data.get(place_id)

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

            return ReviewSummaryResponse(
                place_id=place_id,
                name=place_name,
                summary=summary_text,
                positive_ratio=positive_ratio,
                negative_ratio=negative_ratio,
            )
        except Exception as exc:
            logger.error("Error when calling LLM refine: %s", exc)
            return ReviewSummaryResponse(
                place_id=place_id,
                name=place_name,
                summary="An error occurred while summarizing the review.",
                positive_ratio=positive_ratio,
                negative_ratio=negative_ratio,
            )

@lru_cache(maxsize=1)
def get_review_summary_service() -> ReviewSummaryService:
    from app.shared.refinement import get_refinement_client
    try:
        llm = get_refinement_client()
    except Exception:
        llm = None
    return ReviewSummaryService(llm_client=llm)
