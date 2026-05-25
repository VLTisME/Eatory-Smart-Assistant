"""OpenAI refinement client for turning OCR text into menu JSON."""

from __future__ import annotations

import time
from functools import lru_cache

from openai import OpenAI

from app.config import settings
from app.prompts import MENU_REFINEMENT_PROMPT_VERSION, build_menu_refinement_prompt


class RefinementError(RuntimeError):
    """Raised when the refinement model cannot be used."""


class MenuRefinementClient:
    """OpenAI chat wrapper for menu JSON structuring."""

    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise RefinementError(
                "OPENAI_API_KEY is not configured. Set it in the environment before structuring menus."
            )
        self._client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_refine_model

    def refine(
        self,
        *,
        content: str,
        source_language: str,
        target_language: str,
    ) -> tuple[str, float, str]:
        system_prompt, user_prompt = build_menu_refinement_prompt(
            content=content,
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
        return refined_text, processing_time_ms, MENU_REFINEMENT_PROMPT_VERSION


@lru_cache
def get_refinement_client() -> MenuRefinementClient:
    return MenuRefinementClient()
