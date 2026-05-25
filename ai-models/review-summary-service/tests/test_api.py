"""API tests for the review summary AI service."""

from __future__ import annotations

from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routes import get_generator
from app.schemas import (
    ReviewSummaryGenerateRequest,
    ReviewSummaryGenerateResponse,
    ReviewSummaryTranslateRequest,
    ReviewSummaryTranslateResponse,
)


@dataclass
class FakeGenerator:
    def generate(self, payload: ReviewSummaryGenerateRequest) -> ReviewSummaryGenerateResponse:
        assert payload.place_name == "Pho Hoa"
        assert payload.target_language == "vi"
        return ReviewSummaryGenerateResponse(
            summary="Tong quan danh gia\nKhen (85%)\nHuong vi dam da",
            extracted_dishes=["pho"],
            processing_time_ms=1.5,
        )

    def translate(self, payload: ReviewSummaryTranslateRequest) -> ReviewSummaryTranslateResponse:
        assert payload.target_language == "en"
        return ReviewSummaryTranslateResponse(summary="Overview\nPros (85%)\nRich flavor", processing_time_ms=1.1)


@pytest.fixture(autouse=True)
def override_dependencies():
    app.dependency_overrides[get_generator] = lambda: FakeGenerator()
    yield
    app.dependency_overrides.clear()


def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_generate_review_summary():
    client = TestClient(app)
    response = client.post(
        "/v1/review-summary/generate",
        json={
            "place_name": "Pho Hoa",
            "positive_ratio": 0.85,
            "negative_ratio": 0.15,
            "top_positive_keywords": ["pho", "dam da"],
            "top_negative_keywords": ["dong"],
            "target_language": "vi",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert "Huong vi" in payload["summary"]
    assert payload["extracted_dishes"] == ["pho"]


def test_translate_review_summary():
    client = TestClient(app)
    response = client.post(
        "/v1/review-summary/translate",
        json={"summary": "Tong quan danh gia\nKhen (85%)", "target_language": "en"},
    )

    assert response.status_code == 200
    assert response.json()["summary"].startswith("Overview")
