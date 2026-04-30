"""Integration tests for place search API."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.features.place_search.routes import (
    get_optional_refinement_client,
)
from app.features.place_search.schemas import PlaceSearchItem
from app.features.place_search.service import get_place_search_engine
from app.main import app


@dataclass
class FakePlaceSearchEngine:
    def search(self, image_bytes: bytes, *, top_k_images: int | None = None) -> list[PlaceSearchItem]:
        return [
            PlaceSearchItem(
                place_id="pho_hoa_q3",
                score=0.91,
                top_image="images/pho_hoa_q3/pho_hoa_q3_001.jpg",
                name="Pho Hoa",
                address="260C Pasteur, Q3",
            ),
            PlaceSearchItem(
                place_id="bun_bo_hue_q1",
                score=0.86,
                top_image="images/bun_bo_hue_q1/bun_bo_hue_q1_003.jpg",
                name="Bun Bo Hue 3A3",
                address="3A3 Vo Van Tan, Q1",
            ),
        ]


@dataclass
class EmptyPlaceSearchEngine:
    def search(self, image_bytes: bytes, *, top_k_images: int | None = None) -> list[PlaceSearchItem]:
        return []


@dataclass
class FakeRefinementClient:
    model: str = "gpt-4o-mini"

    def refine(self, *, content: str, context: str, source_language: str, target_language: str):
        assert context == "place_search"
        assert source_language == "vi"
        assert target_language == "vi"
        return (
            '{"results":[{"place_id":"pho_hoa_q3","score":0.91,"top_image":"images/pho_hoa_q3/pho_hoa_q3_001.jpg","name":"Pho Hoa Sai Gon","address":"260C Pasteur, Quan 3"}]}',
            2.1,
            "menu_translation_v2",
        )


@dataclass
class BrokenRefinementClient:
    model: str = "gpt-4o-mini"

    def refine(self, *, content: str, context: str, source_language: str, target_language: str):
        return "not-a-json-response", 1.2, "menu_translation_v2"


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


def test_place_search_returns_refined_structure(sample_image_bytes):
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
    app.dependency_overrides[get_place_search_engine] = lambda: EmptyPlaceSearchEngine()

    client = TestClient(app)
    response = client.post(
        "/api/v1/place-search",
        files={"file": ("dish.png", sample_image_bytes, "image/png")},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "No matching place found for the uploaded image."


def test_place_search_falls_back_to_raw_results_when_refine_invalid(sample_image_bytes):
    app.dependency_overrides[get_optional_refinement_client] = lambda: BrokenRefinementClient()

    client = TestClient(app)
    response = client.post(
        "/api/v1/place-search",
        files={"file": ("dish.png", sample_image_bytes, "image/png")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["results"][0]["place_id"] == "pho_hoa_q3"
    assert payload["results"][0]["name"] == "Pho Hoa"
