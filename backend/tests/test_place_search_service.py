"""Unit tests for the backend place search AI client."""

from __future__ import annotations

from io import BytesIO

import httpx
import pytest
from PIL import Image

from app.features.place_search.client import PlaceSearchAIClient, PlaceSearchServiceError
from app.shared.image_upload import ValidatedImage


@pytest.fixture
def validated_image() -> ValidatedImage:
    image = Image.new("RGB", (64, 64), color="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    data = buffer.getvalue()
    return ValidatedImage(
        filename="dish.png",
        content_type="image/png",
        size_bytes=len(data),
        width=64,
        height=64,
        data=data,
    )


@pytest.mark.asyncio
async def test_place_search_client_posts_image_request(validated_image):
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/place-search/by-image"
        assert request.url.params["target_language"] == "vi"
        assert request.headers["authorization"] == "Bearer test-token"
        assert "multipart/form-data" in request.headers["content-type"]
        assert b'name="file"' in request.read()
        return httpx.Response(
            200,
            json={
                "results": [
                    {
                        "place_id": "pho_hoa_q3",
                        "image_id": "img_1",
                        "score": 0.91,
                        "top_image": "images/pho_hoa_q3/pho_hoa_q3_001.jpg",
                        "images": [],
                        "name": "Pho Hoa",
                        "address": "260C Pasteur, Q3",
                    }
                ]
            },
        )

    client = PlaceSearchAIClient(
        base_url="http://place-ai.test",
        timeout_seconds=5,
        service_token="test-token",
        transport=httpx.MockTransport(handler),
    )

    result = await client.search_by_image(validated_image, target_language="vi")

    assert result.results[0].place_id == "pho_hoa_q3"
    assert result.results[0].name == "Pho Hoa"


@pytest.mark.asyncio
async def test_place_search_client_preserves_noise_error(validated_image):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            422,
            json={
                "detail": {
                    "reason": "similar_to_noise",
                    "noise_category": "text",
                    "noise_score": 0.91,
                    "noise_image": "/tmp/noise.jpg",
                }
            },
        )

    client = PlaceSearchAIClient(
        base_url="http://place-ai.test",
        timeout_seconds=5,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(PlaceSearchServiceError) as exc_info:
        await client.search_by_image(validated_image, target_language="vi")

    assert exc_info.value.status_code == 422
    assert exc_info.value.detail["reason"] == "similar_to_noise"
