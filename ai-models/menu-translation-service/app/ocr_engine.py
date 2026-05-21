"""OCR engine for menu translation."""

from __future__ import annotations

import base64
import logging
import time
from dataclasses import dataclass
from functools import lru_cache
from io import BytesIO

import numpy as np
from openai import OpenAI
from PIL import Image

from app.config import settings

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
    """OCR provider based on EasyOCR."""

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


class OpenAIOCRProvider:
    """OCR provider using OpenAI vision models."""

    def __init__(self, model_name: str, api_key: str | None) -> None:
        if not api_key:
            raise OCRServiceError(
                "OPENAI_API_KEY is not configured. Set it in the environment before using OpenAI OCR."
            )

        self._client = OpenAI(api_key=api_key)
        self._model = model_name

    def _to_data_url(self, image_bytes: bytes) -> str:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{encoded}"

    def extract_text(self, image_bytes: bytes) -> str:
        data_url = self._to_data_url(image_bytes)

        response = self._client.chat.completions.create(
            model=self._model,
            temperature=0,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an OCR engine for Vietnamese menu images. "
                        "Transcribe all visible text exactly as plain text. "
                        "Do not translate, summarize, explain, or add markdown. "
                        "Preserve line breaks as best as possible."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract all visible text from this image. Output only raw OCR text.",
                        },
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                },
            ],
        )

        content = response.choices[0].message.content or ""
        return content.strip()


class MenuOCREngine:
    """Facade for menu OCR extraction."""

    def __init__(self) -> None:
        provider_name = settings.ocr_provider.strip().lower()
        if provider_name == "openai":
            self._provider = OpenAIOCRProvider(settings.ocr_openai_model, settings.openai_api_key)
            self.provider_name = f"openai:{settings.ocr_openai_model}"
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
