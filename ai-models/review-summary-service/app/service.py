"""Review summary generation and translation pipeline."""

from __future__ import annotations

import json
import logging
import re

from app.llm import ReviewSummaryLLMClient
from app.prompts import (
    REVIEW_SUMMARY_PROMPT_VERSION,
    TRANSLATE_REVIEW_SUMMARY_PROMPT_VERSION,
    build_review_summary_prompt,
    build_review_translation_prompt,
)
from app.schemas import (
    ReviewSummaryGenerateRequest,
    ReviewSummaryGenerateResponse,
    ReviewSummaryTranslateRequest,
    ReviewSummaryTranslateResponse,
)

logger = logging.getLogger(__name__)


class ReviewSummaryGenerator:
    """Turns review keyword data into frontend-ready summary text."""

    def __init__(self, llm_client: ReviewSummaryLLMClient) -> None:
        self._llm = llm_client

    def generate(self, payload: ReviewSummaryGenerateRequest) -> ReviewSummaryGenerateResponse:
        content_obj = {
            "place_name": payload.place_name,
            "positive_ratio": payload.positive_ratio,
            "negative_ratio": payload.negative_ratio,
            "top_positive_keywords": payload.top_positive_keywords,
            "top_negative_keywords": payload.top_negative_keywords,
        }
        system_prompt, user_prompt = build_review_summary_prompt(
            content=json.dumps(content_obj, ensure_ascii=False),
            target_language=payload.target_language,
        )
        refined_text, duration_ms = self._llm.complete(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        summary_text = refined_text
        extracted_dishes: list[str] = []
        json_match = re.search(r"\{.*\}", refined_text, re.DOTALL)
        if json_match:
            try:
                result = json.loads(json_match.group(0))
                summary_text = str(result.get("summary", ""))
                extracted = result.get("extracted_dishes", [])
                if isinstance(extracted, list):
                    extracted_dishes = [str(item) for item in extracted]
            except Exception:
                logger.exception("Review summary JSON parse failed; using raw model output")

        summary_text = self._clean_summary(summary_text)
        return ReviewSummaryGenerateResponse(
            summary=summary_text,
            extracted_dishes=extracted_dishes,
            prompt_version=REVIEW_SUMMARY_PROMPT_VERSION,
            processing_time_ms=duration_ms,
        )

    def translate(self, payload: ReviewSummaryTranslateRequest) -> ReviewSummaryTranslateResponse:
        system_prompt, user_prompt = build_review_translation_prompt(
            summary=payload.summary,
            target_language=payload.target_language,
        )
        translated_text, duration_ms = self._llm.complete(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )
        return ReviewSummaryTranslateResponse(
            summary=translated_text,
            prompt_version=TRANSLATE_REVIEW_SUMMARY_PROMPT_VERSION,
            processing_time_ms=duration_ms,
        )

    def _clean_summary(self, summary_text: str) -> str:
        return re.sub(r"\n?🍜[^\n]*:\s*\n?\s*$", "", summary_text).rstrip()
