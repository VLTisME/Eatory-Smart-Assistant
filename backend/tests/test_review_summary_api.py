

from __future__ import annotations

from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient

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
class FakeLLMClient:
    model: str = "gpt-4o-mini"

    def refine(self, *, content: str, context: str, source_language: str, target_language: str):
        assert context == "review_summary"
        return f'{{"summary": "{FAKE_LLM_SUMMARY}"}}', 120.0, "review_summary_v1"


@dataclass
class BrokenLLMClient:
    model: str = "gpt-4o-mini"

    def refine(self, *, content: str, context: str, source_language: str, target_language: str):
        raise RuntimeError("LLM service unavailable")


@dataclass
class InvalidJSONLLMClient:
    model: str = "gpt-4o-mini"

    def refine(self, *, content: str, context: str, source_language: str, target_language: str):
        return "Đây là summary dạng plain text, không phải JSON.", 80.0, "review_summary_v1"


def make_service(llm_client=None, data: dict | None = None) -> ReviewSummaryService:
    svc = ReviewSummaryService(llm_client=llm_client)
    svc._data = data if data is not None else dict(FAKE_PLACE_DATA)
    return svc



@pytest.fixture(autouse=True)
def clear_dependency_overrides():
    yield
    app.dependency_overrides.clear()


def test_get_review_summary_returns_correct_structure():
    app.dependency_overrides[get_review_summary_service] = lambda: make_service(
        llm_client=FakeLLMClient()
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
        llm_client=FakeLLMClient()
    )

    client = TestClient(app)
    response = client.get(
        "/api/v1/review-summary",
        params={"place_id": "pho_hoa_q3", "target_language": "en"},
    )

    assert response.status_code == 200
    assert response.json()["place_id"] == "pho_hoa_q3"



def test_get_review_summary_unknown_place_returns_no_data_message():
    app.dependency_overrides[get_review_summary_service] = lambda: make_service(
        llm_client=FakeLLMClient()
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
        llm_client=None
    )

    client = TestClient(app)
    response = client.get("/api/v1/review-summary", params={"place_id": "pho_hoa_q3"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["place_id"] == "pho_hoa_q3"
    assert "LLM" in payload["summary"] or "configured" in payload["summary"].lower()




def test_get_review_summary_falls_back_when_llm_raises():
    app.dependency_overrides[get_review_summary_service] = lambda: make_service(
        llm_client=BrokenLLMClient()
    )

    client = TestClient(app)
    response = client.get("/api/v1/review-summary", params={"place_id": "pho_hoa_q3"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["place_id"] == "pho_hoa_q3"
    assert "error" in payload["summary"].lower() or "lỗi" in payload["summary"].lower()


def test_get_review_summary_uses_plain_text_when_llm_returns_no_json():
    """Khi LLM không trả về JSON, summary được lấy trực tiếp từ plain text."""
    app.dependency_overrides[get_review_summary_service] = lambda: make_service(
        llm_client=InvalidJSONLLMClient()
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
        llm_client=FakeLLMClient(), data={}
    )

    client = TestClient(app)
    response = client.get("/api/v1/review-summary", params={"place_id": "pho_hoa_q3"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["place_id"] == "pho_hoa_q3"
