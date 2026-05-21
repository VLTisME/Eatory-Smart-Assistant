"""Unit tests for upload validation and menu translation service client."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO

import httpx
import pytest
from PIL import Image

from app.features.menu_translation.client import (
    MenuTranslationAIClient,
    MenuTranslationServiceError,
)
import app.shared.image_upload as image_module
from app.shared.image_upload import ValidatedImage


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


@pytest.fixture
def validated_image(sample_image_bytes) -> ValidatedImage:
    return ValidatedImage(
        filename="menu.png",
        content_type="image/png",
        size_bytes=len(sample_image_bytes),
        width=180,
        height=90,
        data=sample_image_bytes,
    )


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


@pytest.mark.asyncio
async def test_menu_translation_client_posts_ocr_request(validated_image):
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/menu/ocr"
        assert request.headers["authorization"] == "Bearer test-token"
        assert "multipart/form-data" in request.headers["content-type"]
        assert b'name="file"' in request.read()
        return httpx.Response(
            200,
            json={
                "filename": "menu.png",
                "content_type": "image/png",
                "size_bytes": validated_image.size_bytes,
                "width": 180,
                "height": 90,
                "raw_text": "Phở bò",
                "provider": "fake-ai-service",
                "processing_time_ms": 1.5,
            },
        )

    client = MenuTranslationAIClient(
        base_url="http://menu-ai.test",
        timeout_seconds=5,
        service_token="test-token",
        transport=httpx.MockTransport(handler),
    )

    result = await client.extract_ocr(validated_image)

    assert result.raw_text == "Phở bò"
    assert result.provider == "fake-ai-service"


@pytest.mark.asyncio
async def test_menu_translation_client_posts_structured_request(validated_image):
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/menu/structured"
        assert request.url.params["restaurant_name"] == "Pho Test"
        assert request.url.params["target_language"] == "en"
        return httpx.Response(
            200,
            json={
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
            },
        )

    client = MenuTranslationAIClient(
        base_url="http://menu-ai.test",
        timeout_seconds=5,
        transport=httpx.MockTransport(handler),
    )

    result = await client.extract_structured(
        validated_image,
        restaurant_name="Pho Test",
        target_language="en",
    )

    assert result.restaurant_info.name == "Pho Test"
    assert result.categories[0].items[0].translation == "Beef pho"


@pytest.mark.asyncio
async def test_menu_translation_client_preserves_service_error(validated_image):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(422, json={"detail": "No readable text was detected."})

    client = MenuTranslationAIClient(
        base_url="http://menu-ai.test",
        timeout_seconds=5,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(MenuTranslationServiceError) as exc_info:
        await client.extract_ocr(validated_image)

    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == "No readable text was detected."
