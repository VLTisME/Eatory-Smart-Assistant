"""Reusable OpenAI refinement client exposed by the RAG service."""

from __future__ import annotations

import time
from functools import lru_cache

from app.config import settings
from app.prompts import build_refinement_prompt


class RefinementError(RuntimeError):
    """Raised when the refinement model cannot be used."""


class RefinementClient:
    """OpenAI chat wrapper for final output refinement."""

    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise RefinementError("OPENAI_API_KEY is not configured for refinement.")

        try:
            from openai import OpenAI
        except ImportError as exc:  # pragma: no cover - dependency is installed in service env
            raise RefinementError("The openai package is not installed.") from exc

        self._client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_refine_model

    def refine(
        self,
        *,
        content: str,
        context: str,
        source_language: str,
        target_language: str,
    ) -> tuple[str, float, str]:
        system_prompt, user_prompt, prompt_version = build_refinement_prompt(
            content=content,
            context=context,
            source_language=source_language,
            target_language=target_language,
        )

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
        refined_text = (response.choices[0].message.content or "").strip()
        return refined_text, processing_time_ms, prompt_version


@lru_cache
def get_refinement_client() -> RefinementClient:
    return RefinementClient()
