"""Integration tests for shared and menu translation API routes."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.features.menu_translation.client import get_menu_translation_client
from app.features.menu_translation.schemas import MenuResponse, OCRExtractResponse
from app.main import app
from app.shared.refinement import get_refinement_client
from app.shared.schemas import RefineTextResponse
from app.shared.image_upload import ValidatedImage


@dataclass
class FakeMenuTranslationClient:
    text: str = "Phở bò\n50,000 VND"

    async def extract_ocr(self, image: ValidatedImage) -> OCRExtractResponse:
        return OCRExtractResponse(
            filename=image.filename,
            content_type=image.content_type,
            size_bytes=image.size_bytes,
            width=image.width,
            height=image.height,
            raw_text=self.text,
            provider="fake-ai-service",
            processing_time_ms=1.5,
        )

    async def extract_structured(
        self,
        image: ValidatedImage,
        *,
        restaurant_name: str,
        target_language: str,
    ) -> MenuResponse:
        assert image.filename == "menu.png"
        assert restaurant_name == "Pho Test"
        assert target_language == "en"
        return MenuResponse.model_validate(
            {
                "restaurantInfo": {
                    "id": "res_1",
                    "name": restaurant_name,
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
                                "name": "Phở bò",
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
        )


@dataclass
class FakeRefinementClient:
    model: str = "gpt-4o-mini"

    async def refine(self, *, content: str, context: str, source_language: str, target_language: str):
        assert source_language == "vi"
        assert target_language == "en"
        return RefineTextResponse(
            refined_text="Beef Pho\nPrice: 50,000 VND",
            source_language=source_language,
            target_language=target_language,
            context=context,
            model=self.model,
            prompt_version="generic_refine_v1",
            processing_time_ms=2.4,
        )


@pytest.fixture
def sample_image_bytes() -> bytes:
    image = Image.new("RGB", (128, 64), color="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture(autouse=True)
def override_dependencies():
    app.dependency_overrides[get_menu_translation_client] = lambda: FakeMenuTranslationClient()
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
    assert payload["provider"] == "fake-ai-service"


def test_menu_translation_structured_endpoint_returns_menu(sample_image_bytes):
    client = TestClient(app)
    response = client.post(
        "/api/v1/menu-translation/ocr/structured",
        params={"restaurant_name": "Pho Test", "target_language": "en"},
        files={"file": ("menu.png", sample_image_bytes, "image/png")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["restaurantInfo"]["name"] == "Pho Test"
    assert payload["categories"][0]["items"][0]["translation"] == "Beef pho"


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
