"""Unified menu OCR pipeline: OCR → LLM → Structured JSON."""
import json
import uuid
import re
import logging
from app.features.menu_translation.ocr_engine import MenuOCREngine
from app.features.menu_translation.schemas import (
    MenuResponse, RestaurantInfo, MenuCategory, MenuItem, PriceType,
)
from app.shared.refinement import RefinementClient

logger = logging.getLogger(__name__)


class MenuPipeline:
    """
    Pipeline đơn giản, ít bug nhất:
      OCR → gửi TOÀN BỘ raw text cho LLM → validate JSON → trả về
    
    Không dùng rule-based parser ở giữa (loại bỏ mọi bug merge/dedup).
    Nếu LLM fail → trả empty response (an toàn, không crash).
    """
    
    def __init__(
        self,
        ocr_engine: MenuOCREngine,
        llm_client: RefinementClient | None = None,
    ):
        self.ocr = ocr_engine
        self.llm = llm_client
    
    async def process(self, image_bytes: bytes, restaurant_name: str = "", target_language: str = "en") -> MenuResponse:
        """Full pipeline."""
        
        # ===== Bước 1: OCR =====
        ocr_result = self.ocr.extract_text(image_bytes)
        raw_text = ocr_result.text
        logger.info("OCR done: %d chars, %.0fms", len(raw_text), ocr_result.processing_time_ms)
        logger.info("RAW OCR TEXT:\n%s", raw_text)
        
        if not raw_text.strip():
            logger.warning("OCR returned empty text")
            return self._empty_response(restaurant_name)
        
        # ===== Bước 2: Gửi TOÀN BỘ text cho LLM =====
        if self.llm is None:
            logger.warning("No LLM client available - returning empty response")
            return self._empty_response(restaurant_name)
        
        try:
            llm_response = await self._call_llm(raw_text, restaurant_name, target_language)
            if llm_response is not None:
                logger.info(
                    "LLM success: %d categories, %d items",
                    len(llm_response.categories),
                    sum(len(c.items) for c in llm_response.categories),
                )
                return llm_response
        except Exception as e:
            logger.error("Pipeline LLM error: %s", e)
        
        # ===== Fallback: trả empty nếu LLM thất bại =====
        logger.warning("LLM failed - returning empty response")
        return self._empty_response(restaurant_name)
    
    async def _call_llm(self, raw_text: str, restaurant_name: str, target_language: str) -> MenuResponse | None:
        """
        Gọi LLM với toàn bộ raw text.
        Trả về MenuResponse nếu thành công, None nếu thất bại.
        """
        # Thêm context restaurant_name vào input nếu có
        content = raw_text
        if restaurant_name:
            content = f"Restaurant name: {restaurant_name}\n\n{raw_text}"
        
        # Gọi LLM
        try:
            refined_text, duration_ms, _ = self.llm.refine(
                content=content,
                context="ocr_menu",
                source_language="vi",
                target_language=target_language,
            )
            logger.info("LLM call done in %.0fms", duration_ms)
        except Exception as e:
            logger.error("LLM call failed: %s", e)
            return None
        
        # Extract JSON từ LLM output (có thể bọc trong markdown ```json...```)
        try:
            json_str = self._extract_json(refined_text)
            data = json.loads(json_str)
        except Exception as e:
            logger.error("JSON parse failed: %s | raw output: %.500s", e, refined_text)
            return None
        
        # Validate với Pydantic
        try:
            response = MenuResponse.model_validate(data)
        except Exception as e:
            logger.error("Pydantic validation failed: %s", e)
            # Thử sửa lỗi phổ biến và validate lại
            fixed_data = self._fix_common_issues(data)
            try:
                response = MenuResponse.model_validate(fixed_data)
                logger.info("Fixed validation issues successfully")
            except Exception as e2:
                logger.error("Pydantic validation still failed after fix: %s", e2)
                return None
        
        return response
    
    def _extract_json(self, text: str) -> str:
        """Trích xuất JSON từ output LLM (xử lý markdown code blocks)."""
        # Thử tìm JSON trong markdown code block trước
        md_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if md_match:
            return md_match.group(1)
        
        # Tìm JSON object trực tiếp
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json_match.group(0)
        
        raise ValueError("No JSON object found in LLM output")
    
    def _fix_common_issues(self, data: dict) -> dict:
        """Sửa các lỗi phổ biến từ LLM output trước khi validate lại."""
        if "categories" in data:
            for cat in data["categories"]:
                for item in cat.get("items", []):
                    # Fix 1: priceType null → "fixed"
                    if not item.get("priceType"):
                        item["priceType"] = "fixed"
                    
                    # Fix 2: tags null → []
                    if item.get("tags") is None:
                        item["tags"] = []
                    
                    # Fix 3: modifierGroups null → []
                    if item.get("modifierGroups") is None:
                        item["modifierGroups"] = []
                    
                    # Fix 4: priceOptions null → []
                    if item.get("priceOptions") is None:
                        item["priceOptions"] = []
                    
                    # Fix 5: thiếu id
                    if not item.get("id"):
                        item["id"] = f"item_{uuid.uuid4().hex[:8]}"
                
                # Fix 6: category thiếu id
                if not cat.get("id"):
                    cat["id"] = f"cat_{uuid.uuid4().hex[:8]}"
        
        # Fix 7: restaurantInfo thiếu
        if "restaurantInfo" not in data:
            data["restaurantInfo"] = {
                "id": f"res_{uuid.uuid4().hex[:8]}",
                "name": "Unknown",
                "phoneNumber": None,
                "address": "",
            }
        
        return data
    
    def _empty_response(self, restaurant_name: str = "") -> MenuResponse:
        """Trả về response trống khi thất bại."""
        return MenuResponse(
            restaurantInfo=RestaurantInfo(
                id=f"res_{uuid.uuid4().hex[:8]}",
                name=restaurant_name or "Unknown",
                phoneNumber=None,
                address="",
            ),
            categories=[],
        )