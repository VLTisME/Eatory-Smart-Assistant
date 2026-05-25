"""API tests for the place search AI service."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.dependencies import get_optional_refinement_client, get_place_search_engine
from app.main import app
from app.schemas import PlaceSearchItem
from app.search_engine import PlaceSearchNoiseError


@dataclass
class FakePlaceSearchEngine:
    results: list[PlaceSearchItem] | None = None

    def search(self, image_bytes: bytes, *, top_k_images: int | None = None) -> list[PlaceSearchItem]:
        assert image_bytes
        if self.results is not None:
            return self.results
        return [
            PlaceSearchItem(
                place_id="pho_hoa_q3",
                image_id="img_1",
                score=0.91,
                top_image="images/pho_hoa_q3/pho_hoa_q3_001.jpg",
                name="Pho Hoa",
                address="260C Pasteur, Q3",
            )
        ]


@dataclass
class NoisePlaceSearchEngine:
    def search(self, image_bytes: bytes, *, top_k_images: int | None = None) -> list[PlaceSearchItem]:
        raise PlaceSearchNoiseError("text", 0.91, "/tmp/noise.jpg")


@dataclass
class FakeRefinementClient:
    def refine(self, *, content: str, source_language: str, target_language: str):
        assert "pho_hoa_q3" in content
        assert source_language == "vi"
        assert target_language == "vi"
        return (
            '{"results":[{"place_id":"pho_hoa_q3","image_id":"img_1","score":0.91,"top_image":"images/pho_hoa_q3/pho_hoa_q3_001.jpg","images":[],"name":"Pho Hoa Sai Gon","address":"260C Pasteur, Quan 3"}]}',
            2.1,
            "place_search_v1",
        )


@pytest.fixture
def sample_image_bytes() -> bytes:
    image = Image.new("RGB", (64, 64), color="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture(autouse=True)
def override_dependencies():
    app.dependency_overrides[get_place_search_engine] = lambda: FakePlaceSearchEngine()
    app.dependency_overrides[get_optional_refinement_client] = lambda: FakeRefinementClient()
    yield
    app.dependency_overrides.clear()


def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_place_search_returns_refined_results(sample_image_bytes):
    client = TestClient(app)
    response = client.post(
        "/v1/place-search/by-image",
        files={"file": ("dish.png", sample_image_bytes, "image/png")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["results"][0]["place_id"] == "pho_hoa_q3"
    assert payload["results"][0]["name"] == "Pho Hoa Sai Gon"


def test_place_search_returns_empty_results(sample_image_bytes):
    app.dependency_overrides[get_place_search_engine] = lambda: FakePlaceSearchEngine(results=[])

    client = TestClient(app)
    response = client.post(
        "/v1/place-search/by-image",
        files={"file": ("dish.png", sample_image_bytes, "image/png")},
    )

    assert response.status_code == 200
    assert response.json()["results"] == []


def test_place_search_returns_noise_detail(sample_image_bytes):
    app.dependency_overrides[get_place_search_engine] = lambda: NoisePlaceSearchEngine()

    client = TestClient(app)
    response = client.post(
        "/v1/place-search/by-image",
        files={"file": ("dish.png", sample_image_bytes, "image/png")},
    )

    assert response.status_code == 422
    assert response.json()["detail"]["reason"] == "similar_to_noise"
    assert response.json()["detail"]["noise_category"] == "text"
