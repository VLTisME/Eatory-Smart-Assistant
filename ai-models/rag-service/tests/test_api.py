"""API tests for the RAG service."""

from __future__ import annotations

from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.rag_engine import get_rag_engine
from app.routes import get_optional_refinement_client
from app.refinement import get_refinement_client


@dataclass
class FakeDocument:
    page_content: str
    metadata: dict


class FakeRagEngine:
    def retrieve(self, query: str, top_k: int):
        assert top_k in {2, 3}
        if query == "empty":
            return []
        return [
            (
                FakeDocument(
                    page_content="Quiet cafe with good drinks.",
                    metadata={
                        "place_id": "cafe_test",
                        "place_name": "Cafe Test",
                        "district": "Quan 1",
                        "avg_rating": "4.7",
                        "positive_ratio": "0.9",
                    },
                ),
                0.12,
            )
        ]

    def build_sources(self, results):
        from app.rag_engine import _source_from_result

        return [_source_from_result(doc, score) for doc, score in results]

    def build_context(self, results):
        return "Cafe Test context"

    def generate_answer(self, user_query: str, context: str, target_language: str = "vi"):
        assert context == "Cafe Test context"
        assert target_language in {"vi", "en"}
        return f"Raw answer for {user_query}"


class FakeRefinementClient:
    model = "gpt-4o-mini"

    def refine(self, *, content: str, context: str, source_language: str, target_language: str):
        assert source_language == target_language
        return f"Refined: {content}", 4.2, "rag_chat_v1" if context == "rag_chat" else "generic_refine_v1"


@pytest.fixture(autouse=True)
def override_dependencies():
    app.dependency_overrides[get_rag_engine] = lambda: FakeRagEngine()
    app.dependency_overrides[get_refinement_client] = lambda: FakeRefinementClient()
    app.dependency_overrides[get_optional_refinement_client] = lambda: FakeRefinementClient()
    yield
    app.dependency_overrides.clear()


def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_retrieve_returns_sources():
    client = TestClient(app)
    response = client.post("/v1/rag/retrieve", json={"query": "quan ca phe", "top_k": 2})

    assert response.status_code == 200
    payload = response.json()
    assert payload["query"] == "quan ca phe"
    assert payload["sources"][0]["place_id"] == "cafe_test"
    assert payload["sources"][0]["avg_rating"] == 4.7


def test_chat_generates_and_refines_answer():
    client = TestClient(app)
    response = client.post("/v1/rag/chat", json={"message": "quan ca phe", "top_k": 3})

    assert response.status_code == 200
    payload = response.json()
    assert payload["answer"] == "Refined: Raw answer for quan ca phe"
    assert payload["sources"][0]["place_name"] == "Cafe Test"


def test_chat_returns_no_results_message():
    client = TestClient(app)
    response = client.post("/v1/rag/chat", json={"message": "empty", "top_k": 3})

    assert response.status_code == 200
    assert response.json()["sources"] == []


def test_refinement_endpoint_returns_refined_text():
    client = TestClient(app)
    response = client.post(
        "/v1/refinement/refine",
        json={
            "content": "Pho bo",
            "context": "generic",
            "source_language": "vi",
            "target_language": "en",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["refined_text"] == "Refined: Pho bo"
    assert payload["prompt_version"] == "generic_refine_v1"
