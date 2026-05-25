

from __future__ import annotations

from dataclasses import dataclass

import httpx
import pytest
from fastapi.testclient import TestClient

from app.features.review_summary.client import (
    ReviewSummaryAIClient,
    ReviewSummaryAIServiceError,
    ReviewSummaryGenerateResponse,
    ReviewSummaryTranslateResponse,
)
from app.features.review_summary.service import get_review_summary_service, ReviewSummaryService
from app.main import app


FAKE_PLACE_DATA = {
    "pho_hoa_q3": {
        "place_id": "pho_hoa_q3",
        "place_name": "Phở Hòa Pasteur",
        "positive_ratio": 0.85,
        "negative_ratio": 0.15,
        "top_positive_keywords": ["ngon", "đậm đà", "tươi"],
        "top_negative_keywords": ["đông", "chờ lâu"],
    }
}

FAKE_LLM_SUMMARY = "Phở Hòa Pasteur nổi tiếng với hương vị đậm đà, nguyên liệu tươi. Khách hàng đánh giá cao chất lượng món ăn."



@dataclass
class FakeAIClient:
    async def generate_summary(
        self,
        *,
        place_name: str,
        positive_ratio: float,
        negative_ratio: float,
        top_positive_keywords: list[str],
        top_negative_keywords: list[str],
        target_language: str,
    ) -> ReviewSummaryGenerateResponse:
        assert place_name == "Phở Hòa Pasteur"
        assert target_language == "vi"
        return ReviewSummaryGenerateResponse(summary=FAKE_LLM_SUMMARY, processing_time_ms=120.0)

    async def translate_summary(self, *, summary: str, target_language: str) -> ReviewSummaryTranslateResponse:
        assert summary == FAKE_LLM_SUMMARY
        assert target_language == "en"
        return ReviewSummaryTranslateResponse(summary=f"Translated: {summary}", processing_time_ms=80.0)


@dataclass
class BrokenLLMClient:
    async def generate_summary(self, **kwargs):
        raise RuntimeError("LLM service unavailable")


@dataclass
class PlainTextAIClient:
    async def generate_summary(self, **kwargs) -> ReviewSummaryGenerateResponse:
        return ReviewSummaryGenerateResponse(summary="Đây là summary dạng plain text.", processing_time_ms=80.0)


def make_service(ai_client=None, data: dict | None = None) -> ReviewSummaryService:
    svc = ReviewSummaryService(ai_client=ai_client)
    svc._data = data if data is not None else dict(FAKE_PLACE_DATA)
    return svc



@pytest.fixture(autouse=True)
def clear_dependency_overrides():
    yield
    app.dependency_overrides.clear()


def test_get_review_summary_returns_correct_structure():
    app.dependency_overrides[get_review_summary_service] = lambda: make_service(
        ai_client=FakeAIClient()
    )

    client = TestClient(app)
    response = client.get("/api/v1/review-summary", params={"place_id": "pho_hoa_q3"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["place_id"] == "pho_hoa_q3"
    assert payload["name"] == "Phở Hòa Pasteur"
    assert payload["summary"] == FAKE_LLM_SUMMARY
    assert payload["positive_ratio"] == pytest.approx(0.85)
    assert payload["negative_ratio"] == pytest.approx(0.15)


def test_get_review_summary_with_target_language():
    app.dependency_overrides[get_review_summary_service] = lambda: make_service(
        ai_client=FakeAIClient()
    )

    client = TestClient(app)
    response = client.get(
        "/api/v1/review-summary",
        params={"place_id": "pho_hoa_q3", "target_language": "en"},
    )

    assert response.status_code == 200
    assert response.json()["place_id"] == "pho_hoa_q3"
    assert response.json()["summary"].startswith("Translated:")



def test_get_review_summary_unknown_place_returns_no_data_message():
    app.dependency_overrides[get_review_summary_service] = lambda: make_service(
        ai_client=FakeAIClient()
    )

    client = TestClient(app)
    response = client.get("/api/v1/review-summary", params={"place_id": "unknown_place_xyz"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["place_id"] == "unknown_place_xyz"
    assert "not enough" in payload["summary"].lower() or "không đủ" in payload["summary"].lower()
    assert payload["positive_ratio"] == pytest.approx(0.0)
    assert payload["negative_ratio"] == pytest.approx(0.0)



def test_get_review_summary_without_llm_returns_raw_message():
    app.dependency_overrides[get_review_summary_service] = lambda: make_service(
        ai_client=None
    )

    client = TestClient(app)
    response = client.get("/api/v1/review-summary", params={"place_id": "pho_hoa_q3"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["place_id"] == "pho_hoa_q3"
    assert "AI" in payload["summary"] or "configured" in payload["summary"].lower()




def test_get_review_summary_falls_back_when_llm_raises():
    app.dependency_overrides[get_review_summary_service] = lambda: make_service(
        ai_client=BrokenLLMClient()
    )

    client = TestClient(app)
    response = client.get("/api/v1/review-summary", params={"place_id": "pho_hoa_q3"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["place_id"] == "pho_hoa_q3"
    assert "error" in payload["summary"].lower() or "lỗi" in payload["summary"].lower()


def test_get_review_summary_uses_plain_text_when_llm_returns_no_json():
    """The backend accepts summary text already normalized by the AI service."""
    app.dependency_overrides[get_review_summary_service] = lambda: make_service(
        ai_client=PlainTextAIClient()
    )

    client = TestClient(app)
    response = client.get("/api/v1/review-summary", params={"place_id": "pho_hoa_q3"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["place_id"] == "pho_hoa_q3"
    assert len(payload["summary"]) > 0



def test_get_review_summary_missing_place_id_returns_422():
    client = TestClient(app)
    response = client.get("/api/v1/review-summary")

    assert response.status_code == 422


def test_get_review_summary_empty_data_source():
    app.dependency_overrides[get_review_summary_service] = lambda: make_service(
        ai_client=FakeAIClient(), data={}
    )

    client = TestClient(app)
    response = client.get("/api/v1/review-summary", params={"place_id": "pho_hoa_q3"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["place_id"] == "pho_hoa_q3"


@pytest.mark.asyncio
async def test_review_summary_ai_client_posts_generate_request():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/review-summary/generate"
        assert request.headers["authorization"] == "Bearer test-token"
        payload = json_from_request(request)
        assert payload["place_name"] == "Pho Hoa"
        assert payload["target_language"] == "vi"
        return httpx.Response(200, json={"summary": "Generated summary", "processing_time_ms": 1.5})

    client = ReviewSummaryAIClient(
        base_url="http://review-ai.test",
        timeout_seconds=5,
        service_token="test-token",
        transport=httpx.MockTransport(handler),
    )

    result = await client.generate_summary(
        place_name="Pho Hoa",
        positive_ratio=0.85,
        negative_ratio=0.15,
        top_positive_keywords=["ngon"],
        top_negative_keywords=["dong"],
        target_language="vi",
    )

    assert result.summary == "Generated summary"


@pytest.mark.asyncio
async def test_review_summary_ai_client_preserves_service_error():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"detail": "model unavailable"})

    client = ReviewSummaryAIClient(
        base_url="http://review-ai.test",
        timeout_seconds=5,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(ReviewSummaryAIServiceError) as exc_info:
        await client.translate_summary(summary="Xin chao", target_language="en")

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == "model unavailable"


def json_from_request(request: httpx.Request) -> dict:
    import json

    return json.loads(request.content.decode("utf-8"))
