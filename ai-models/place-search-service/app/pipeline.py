"""Place-search pipeline: retrieval first, optional LLM refinement second."""

from __future__ import annotations

import json
import logging
import re

from app.refinement import PlaceRefinementClient
from app.schemas import PlaceSearchResponse
from app.search_engine import PlaceSearchEngine

logger = logging.getLogger(__name__)


class PlaceSearchPipeline:
    """Search pipeline: retrieval first, then optional LLM refinement."""

    def __init__(self, engine: PlaceSearchEngine, llm_client: PlaceRefinementClient | None = None):
        self._engine = engine
        self._llm = llm_client

    def run(self, image_bytes: bytes, *, target_language: str = "vi") -> PlaceSearchResponse:
        raw_results = self._engine.search(image_bytes)
        if not raw_results:
            return PlaceSearchResponse(results=[])

        raw_response = PlaceSearchResponse(results=raw_results)

        if self._llm is None:
            logger.warning("No refinement client available for place search. Returning raw response.")
            return raw_response

        try:
            return self._refine_response(raw_response, target_language=target_language)
        except Exception as exc:
            logger.error("Place search refinement failed, falling back to raw response: %s", exc)
            return raw_response

    def _refine_response(self, raw_response: PlaceSearchResponse, *, target_language: str) -> PlaceSearchResponse:
        payload = raw_response.model_dump(by_alias=True)
        content = json.dumps(payload, ensure_ascii=False)

        refined_text, duration_ms, _ = self._llm.refine(
            content=content,
            source_language="vi",
            target_language=target_language,
        )
        logger.info("Place search refinement completed in %.0fms", duration_ms)

        json_str = self._extract_json(refined_text)
        data = json.loads(json_str)
        return PlaceSearchResponse.model_validate(data)

    def _extract_json(self, text: str) -> str:
        markdown_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if markdown_match:
            return markdown_match.group(1)

        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            return json_match.group(0)

        raise ValueError("No JSON object found in LLM output")
