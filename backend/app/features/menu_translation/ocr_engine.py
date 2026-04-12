"""OCR engine for menu translation feature."""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from functools import lru_cache
from io import BytesIO

import numpy as np
from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)


class OCRServiceError(RuntimeError):
    """Raised when OCR processing fails."""


@dataclass(slots=True)
class OCRResult:
    """Internal OCR result representation."""

    text: str
    provider: str
    processing_time_ms: float


class EasyOCROCRProvider:
    """CPU-friendly OCR provider based on EasyOCR."""

    def __init__(self, languages: list[str], gpu: bool) -> None:
        import easyocr

        self._reader = easyocr.Reader(languages, gpu=gpu, verbose=False)

    def extract_text(self, image_bytes: bytes) -> str:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        results = self._reader.readtext(np.array(image), detail=1, paragraph=False)
        lines: list[str] = []
        for _, text, confidence in results:
            if confidence >= 0.3 and text.strip():
                lines.append(text.strip())
        return "\n".join(lines).strip()


class HuggingFaceOCRProvider:
    """OCR provider using Hugging Face Inference API."""

    def __init__(self, model_name: str) -> None:
        from huggingface_hub import InferenceClient

        self._client = InferenceClient(model=model_name)

    def extract_text(self, image_bytes: bytes) -> str:
        response = self._client.image_to_text(image_bytes)
        if isinstance(response, list):
            texts: list[str] = []
            for item in response:
                if isinstance(item, dict):
                    text = str(item.get("generated_text", "")).strip()
                else:
                    text = str(getattr(item, "generated_text", "")).strip()
                if text:
                    texts.append(text)
            return "\n".join(texts).strip()
        if isinstance(response, dict):
            return str(response.get("generated_text", "")).strip()
        return str(response).strip()


class MenuOCREngine:
    """Facade for menu OCR extraction."""

    def __init__(self) -> None:
        provider_name = settings.ocr_provider.strip().lower()
        if provider_name == "hf":
            self._provider = HuggingFaceOCRProvider(settings.huggingface_ocr_model)
            self.provider_name = f"huggingface:{settings.huggingface_ocr_model}"
        else:
            self._provider = EasyOCROCRProvider(settings.ocr_language_list, settings.ocr_gpu)
            self.provider_name = f"easyocr:{','.join(settings.ocr_language_list)}"

    def extract_text(self, image_bytes: bytes) -> OCRResult:
        start_time = time.perf_counter()
        try:
            text = self._provider.extract_text(image_bytes)
        except Exception as exc:  # pragma: no cover
            logger.exception("Menu OCR extraction failed")
            raise OCRServiceError("Failed to extract text from the uploaded image.") from exc
        processing_time_ms = (time.perf_counter() - start_time) * 1000
        return OCRResult(text=text, provider=self.provider_name, processing_time_ms=processing_time_ms)


@lru_cache
def get_menu_ocr_engine() -> MenuOCREngine:
    return MenuOCREngine()
