"""Menu OCR pipeline: OCR, LLM structuring, Pydantic validation."""

from __future__ import annotations

import asyncio
import json
import logging
import re
import uuid

from app.config import settings
from app.ocr_engine import MenuOCREngine
from app.refinement import MenuRefinementClient
from app.schemas import MenuResponse, RestaurantInfo

logger = logging.getLogger(__name__)


class MenuPipeline:
    """Turns a menu image into the structured menu JSON expected by the frontend."""

    def __init__(
        self,
        ocr_engine: MenuOCREngine,
        llm_client: MenuRefinementClient | None = None,
    ) -> None:
        self.ocr = ocr_engine
        self.llm = llm_client

    async def process(
        self,
        image_bytes: bytes,
        restaurant_name: str = "",
        target_language: str = "en",
    ) -> MenuResponse:
        """Run the full OCR and LLM menu structuring pipeline."""

        ocr_result = await asyncio.to_thread(self.ocr.extract_text, image_bytes)
        raw_text = ocr_result.text
        logger.info("OCR done: %d chars, %.0fms", len(raw_text), ocr_result.processing_time_ms)

        if not raw_text.strip():
            logger.warning("OCR returned empty text")
            return self._empty_response(restaurant_name)

        if self.llm is None:
            logger.warning("No LLM client available; returning empty menu response")
            return self._empty_response(restaurant_name)

        prepared_text = self._prepare_refinement_input(raw_text)
        logger.info("Prepared OCR text for refine: %d -> %d chars", len(raw_text), len(prepared_text))

        try:
            llm_response = await self._call_llm(prepared_text, restaurant_name, target_language)
            if llm_response is not None:
                logger.info(
                    "LLM success: %d categories, %d items",
                    len(llm_response.categories),
                    sum(len(category.items) for category in llm_response.categories),
                )
                return llm_response
        except Exception:
            logger.exception("Menu structuring pipeline failed")

        logger.warning("LLM failed; returning empty menu response")
        return self._empty_response(restaurant_name)

    def _prepare_refinement_input(self, raw_text: str) -> str:
        """Trim duplicated OCR lines and cap prompt size."""

        lines = [line.strip() for line in raw_text.splitlines()]
        lines = [line for line in lines if line]

        deduped: list[str] = []
        seen: set[str] = set()
        for line in lines:
            normalized = re.sub(r"\s+", " ", line).lower()
            if normalized in seen:
                continue
            seen.add(normalized)
            deduped.append(line)

        compact_text = "\n".join(deduped)
        max_chars = max(1000, settings.menu_refine_max_chars)
        if len(compact_text) <= max_chars:
            return compact_text
        return compact_text[:max_chars]

    async def _call_llm(
        self,
        raw_text: str,
        restaurant_name: str,
        target_language: str,
    ) -> MenuResponse | None:
        """Call the menu LLM and parse its JSON output."""

        content = raw_text
        if restaurant_name:
            content = f"Restaurant name: {restaurant_name}\n\n{raw_text}"

        try:
            refined_text, duration_ms, _ = await asyncio.to_thread(
                self.llm.refine,
                content=content,
                source_language="vi",
                target_language=target_language,
            )
            logger.info("LLM call done in %.0fms", duration_ms)
        except Exception:
            logger.exception("LLM call failed")
            return None

        try:
            json_str = self._extract_json(refined_text)
            data = json.loads(json_str)
        except Exception:
            logger.exception("JSON parse failed from LLM output")
            return None

        try:
            return MenuResponse.model_validate(data)
        except Exception:
            logger.exception("Menu response validation failed; attempting common fixes")
            fixed_data = self._fix_common_issues(data)
            try:
                return MenuResponse.model_validate(fixed_data)
            except Exception:
                logger.exception("Menu response validation still failed")
                return None

    def _extract_json(self, text: str) -> str:
        """Extract a JSON object from an LLM response."""

        markdown_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if markdown_match:
            return markdown_match.group(1)

        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            return json_match.group(0)

        raise ValueError("No JSON object found in LLM output")

    def _fix_common_issues(self, data: dict) -> dict:
        """Repair common nullable/missing fields from model output."""

        if "categories" not in data or data["categories"] is None:
            data["categories"] = []

        for category in data["categories"]:
            if not category.get("id"):
                category["id"] = f"cat_{uuid.uuid4().hex[:8]}"

            category["items"] = category.get("items") or []
            for item in category["items"]:
                if not item.get("priceType"):
                    item["priceType"] = "fixed"
                if item.get("tags") is None:
                    item["tags"] = []
                if item.get("modifierGroups") is None:
                    item["modifierGroups"] = []
                if item.get("priceOptions") is None:
                    item["priceOptions"] = []
                if not item.get("id"):
                    item["id"] = f"item_{uuid.uuid4().hex[:8]}"

        if "restaurantInfo" not in data or data["restaurantInfo"] is None:
            data["restaurantInfo"] = {
                "id": f"res_{uuid.uuid4().hex[:8]}",
                "name": "Unknown",
                "phoneNumber": None,
                "address": "",
            }

        return data

    def _empty_response(self, restaurant_name: str = "") -> MenuResponse:
        """Return an empty structured response when extraction cannot complete."""

        return MenuResponse(
            restaurantInfo=RestaurantInfo(
                id=f"res_{uuid.uuid4().hex[:8]}",
                name=restaurant_name or "Unknown",
                phoneNumber=None,
                address="",
            ),
            categories=[],
        )
