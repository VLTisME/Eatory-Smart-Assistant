"""Unit tests for the OCR service and upload validation helpers."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO

import pytest
from PIL import Image

import app.features.menu_translation.ocr_engine as ocr_module
import app.shared.image_upload as image_module


@dataclass
class FakeUpload:
    filename: str
    content_type: str
    data: bytes

    async def read(self) -> bytes:
        return self.data


@pytest.fixture
def sample_image_bytes() -> bytes:
    image = Image.new("RGB", (180, 90), color="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.mark.asyncio
async def test_validate_image_upload_accepts_png(sample_image_bytes):
    upload = FakeUpload(filename="menu.png", content_type="image/png", data=sample_image_bytes)

    validated = await image_module.validate_image_upload(upload)

    assert validated.filename == "menu.png"
    assert validated.content_type == "image/png"
    assert validated.width == 180
    assert validated.height == 90
    assert validated.size_bytes == len(sample_image_bytes)


@pytest.mark.asyncio
async def test_validate_image_upload_rejects_invalid_content_type(sample_image_bytes):
    upload = FakeUpload(filename="menu.txt", content_type="text/plain", data=sample_image_bytes)

    with pytest.raises(Exception) as exc_info:
        await image_module.validate_image_upload(upload)

    assert getattr(exc_info.value, "status_code", None) == 400


def test_ocr_service_uses_provider_and_returns_result(monkeypatch, sample_image_bytes):
    class FakeProvider:
        def extract_text(self, image_bytes: bytes) -> str:
            assert image_bytes == sample_image_bytes
            return "Phở bò"

    monkeypatch.setattr(ocr_module, "EasyOCROCRProvider", lambda languages, gpu: FakeProvider())
    ocr_module.get_menu_ocr_engine.cache_clear()

    service = ocr_module.MenuOCREngine()
    result = service.extract_text(sample_image_bytes)

    assert result.text == "Phở bò"
    assert result.provider.startswith("easyocr:")
    assert result.processing_time_ms >= 0


def test_get_menu_ocr_engine_returns_singleton(monkeypatch):
    class FakeProvider:
        def extract_text(self, image_bytes: bytes) -> str:
            return "demo"

    monkeypatch.setattr(ocr_module, "EasyOCROCRProvider", lambda languages, gpu: FakeProvider())
    ocr_module.get_menu_ocr_engine.cache_clear()

    service_one = ocr_module.get_menu_ocr_engine()
    service_two = ocr_module.get_menu_ocr_engine()

    assert service_one is service_two
