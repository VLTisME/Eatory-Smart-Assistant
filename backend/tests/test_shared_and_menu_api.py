"""Integration tests for shared and menu translation API routes."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.features.menu_translation.ocr_engine import OCRResult, get_menu_ocr_engine
from app.main import app
from app.shared.refinement import get_refinement_client


@dataclass
class FakeMenuOCREngine:
    text: str = "Phở bò\n50,000 VND"

    def extract_text(self, image_bytes: bytes) -> OCRResult:
        return OCRResult(text=self.text, provider="fake-ocr", processing_time_ms=1.5)


@dataclass
class FakeRefinementClient:
    model: str = "gpt-4o-mini"

    def refine(self, *, content: str, context: str, source_language: str, target_language: str):
        assert source_language == "vi"
        assert target_language == "en"
        return "Beef Pho\nPrice: 50,000 VND", 2.4, "menu_translation_v1"


@pytest.fixture
def sample_image_bytes() -> bytes:
    image = Image.new("RGB", (128, 64), color="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture(autouse=True)
def override_dependencies():
    app.dependency_overrides[get_menu_ocr_engine] = lambda: FakeMenuOCREngine()
    app.dependency_overrides[get_refinement_client] = lambda: FakeRefinementClient()
    yield
    app.dependency_overrides.clear()


def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_upload_endpoint_returns_metadata(sample_image_bytes):
    client = TestClient(app)
    response = client.post(
        "/api/v1/uploads/image",
        files={"file": ("menu.png", sample_image_bytes, "image/png")},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["filename"] == "menu.png"
    assert payload["width"] == 128
    assert payload["height"] == 64
    assert payload["message"] == "Image accepted for processing."


def test_menu_translation_ocr_endpoint_returns_raw_text(sample_image_bytes):
    client = TestClient(app)
    response = client.post(
        "/api/v1/menu-translation/ocr",
        files={"file": ("menu.png", sample_image_bytes, "image/png")},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["raw_text"] == "Phở bò\n50,000 VND"
    assert payload["provider"] == "fake-ocr"


def test_shared_llm_refinement_endpoint_returns_refined_text():
    client = TestClient(app)
    response = client.post(
        "/api/v1/llm/refine",
        json={
            "content": "Phở bò\n50,000 VND",
            "context": "menu_translation",
            "source_language": "vi",
            "target_language": "en",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["refined_text"] == "Beef Pho\nPrice: 50,000 VND"
    assert payload["model"] == "gpt-4o-mini"