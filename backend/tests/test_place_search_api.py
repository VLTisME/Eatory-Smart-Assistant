"""Integration tests for place search API."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.features.place_search.client import PlaceSearchServiceError, get_place_search_client
from app.features.place_search.schemas import PlaceSearchResponse
from app.main import app
from app.shared.image_upload import ValidatedImage


@dataclass
class FakePlaceSearchClient:
    response: PlaceSearchResponse | None = None
    error: PlaceSearchServiceError | None = None

    async def search_by_image(self, image: ValidatedImage, *, target_language: str) -> PlaceSearchResponse:
        assert image.filename == "dish.png"
        assert target_language == "vi"
        if self.error is not None:
            raise self.error
        if self.response is not None:
            return self.response
        return PlaceSearchResponse.model_validate(
            {
                "results": [
                    {
                        "place_id": "pho_hoa_q3",
                        "image_id": "img_1",
                        "score": 0.91,
                        "top_image": "images/pho_hoa_q3/pho_hoa_q3_001.jpg",
                        "images": [],
                        "name": "Pho Hoa Sai Gon",
                        "address": "260C Pasteur, Quan 3",
                    }
                ]
            }
        )


@pytest.fixture
def sample_image_bytes() -> bytes:
    image = Image.new("RGB", (64, 64), color="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture(autouse=True)
def override_dependencies():
    app.dependency_overrides[get_place_search_client] = lambda: FakePlaceSearchClient()
    yield
    app.dependency_overrides.clear()


def test_place_search_returns_service_results(sample_image_bytes):
    client = TestClient(app)
    response = client.post(
        "/api/v1/place-search",
        files={"file": ("dish.png", sample_image_bytes, "image/png")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert "results" in payload
    assert payload["results"][0]["place_id"] == "pho_hoa_q3"
    assert payload["results"][0]["name"] == "Pho Hoa Sai Gon"


def test_place_search_returns_404_when_no_match(sample_image_bytes):
    app.dependency_overrides[get_place_search_client] = lambda: FakePlaceSearchClient(
        response=PlaceSearchResponse(results=[])
    )

    client = TestClient(app)
    response = client.post(
        "/api/v1/place-search",
        files={"file": ("dish.png", sample_image_bytes, "image/png")},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "No matching place found for the uploaded image."


def test_place_search_returns_422_when_query_is_noise(sample_image_bytes):
    app.dependency_overrides[get_place_search_client] = lambda: FakePlaceSearchClient(
        error=PlaceSearchServiceError(
            {
                "reason": "similar_to_noise",
                "noise_category": "text",
                "noise_score": 0.91,
                "noise_image": "/tmp/noise.jpg",
            },
            status_code=422,
        )
    )

    client = TestClient(app)
    response = client.post(
        "/api/v1/place-search",
        files={"file": ("dish.png", sample_image_bytes, "image/png")},
    )

    assert response.status_code == 422
    assert response.json()["detail"]["reason"] == "similar_to_noise"
    assert response.json()["detail"]["noise_category"] == "text"
