"""OpenAI wrapper for review summary generation and translation."""

from __future__ import annotations

import time
from functools import lru_cache

from openai import OpenAI

from app.config import settings


class ReviewSummaryAIError(RuntimeError):
    """Raised when the review summary model cannot be used."""


class ReviewSummaryLLMClient:
    """OpenAI chat wrapper for review summary tasks."""

    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise ReviewSummaryAIError(
                "OPENAI_API_KEY is not configured. Set it before using review summary generation."
            )
        self._client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_refine_model

    def complete(self, *, system_prompt: str, user_prompt: str) -> tuple[str, float]:
        start_time = time.perf_counter()
        response = self._client.chat.completions.create(
            model=self.model,
            temperature=0.2,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        processing_time_ms = (time.perf_counter() - start_time) * 1000
        return (response.choices[0].message.content or "").strip(), processing_time_ms


@lru_cache
def get_llm_client() -> ReviewSummaryLLMClient:
    return ReviewSummaryLLMClient()
