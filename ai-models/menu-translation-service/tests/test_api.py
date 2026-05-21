"""API tests for the menu translation AI service."""

from __future__ import annotations

import json
from dataclasses import dataclass
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.ocr_engine import OCRResult, get_menu_ocr_engine
from app.refinement import get_refinement_client


@dataclass
class FakeMenuOCREngine:
    text: str = "Pho bo\n50,000 VND"

    def extract_text(self, image_bytes: bytes) -> OCRResult:
        assert image_bytes
        return OCRResult(text=self.text, provider="fake-ocr", processing_time_ms=1.5)


@dataclass
class FakeRefinementClient:
    def refine(self, *, content: str, source_language: str, target_language: str):
        assert "Pho bo" in content
        assert source_language == "vi"
        assert target_language == "en"
        payload = {
            "restaurantInfo": {
                "id": "res_1",
                "name": "Pho Test",
                "phoneNumber": None,
                "address": "",
            },
            "categories": [
                {
                    "id": "cat_1",
                    "title": "Main",
                    "translation": "Main",
                    "items": [
                        {
                            "id": "item_1",
                            "name": "Pho bo",
                            "translation": "Beef pho",
                            "description": None,
                            "priceType": "fixed",
                            "basePrice": 50000,
                            "priceText": None,
                            "priceOptions": [],
                            "tags": [],
                            "modifierGroups": [],
                        }
                    ],
                }
            ],
        }
        return json.dumps(payload), 2.4, "menu_translation_v2"


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


def test_menu_ocr_endpoint_returns_raw_text(sample_image_bytes):
    client = TestClient(app)
    response = client.post(
        "/v1/menu/ocr",
        files={"file": ("menu.png", sample_image_bytes, "image/png")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["filename"] == "menu.png"
    assert payload["raw_text"] == "Pho bo\n50,000 VND"
    assert payload["provider"] == "fake-ocr"


def test_structured_menu_endpoint_returns_menu_json(sample_image_bytes):
    client = TestClient(app)
    response = client.post(
        "/v1/menu/structured",
        params={"restaurant_name": "Pho Test", "target_language": "en"},
        files={"file": ("menu.png", sample_image_bytes, "image/png")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["restaurantInfo"]["name"] == "Pho Test"
    assert payload["categories"][0]["items"][0]["translation"] == "Beef pho"
