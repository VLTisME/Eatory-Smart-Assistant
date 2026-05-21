"""Integration tests for backend RAG proxy routes."""

from __future__ import annotations

from dataclasses import dataclass

from fastapi.testclient import TestClient

from app.features.rag_chat.client import RagServiceError, get_rag_client
from app.features.rag_chat.schemas import RagChatResponse, RagRetrieveResponse
from app.main import app


@dataclass
class FakeRagClient:
    error: RagServiceError | None = None

    async def chat(
        self,
        *,
        message: str,
        top_k: int,
        target_language: str = "vi",
    ) -> RagChatResponse:
        assert message == "goi y quan sushi"
        assert top_k == 3
        assert target_language == "vi"
        if self.error:
            raise self.error
        return RagChatResponse(
            answer="Sushi Test is a good match.",
            sources=[
                {
                    "place_id": "sushi_test",
                    "place_name": "Sushi Test",
                    "score": 0.12,
                    "content_preview": "Sushi review summary",
                }
            ],
        )

    async def retrieve(self, *, query: str, top_k: int) -> RagRetrieveResponse:
        assert query == "quan ca phe yen tinh"
        assert top_k == 2
        if self.error:
            raise self.error
        return RagRetrieveResponse(
            query=query,
            sources=[
                {
                    "place_id": "cafe_test",
                    "place_name": "Cafe Test",
                    "score": 0.22,
                    "content_preview": "Quiet cafe review summary",
                }
            ],
        )


def setup_function():
    app.dependency_overrides.clear()


def teardown_function():
    app.dependency_overrides.clear()


def test_rag_chat_proxies_to_ai_service():
    app.dependency_overrides[get_rag_client] = lambda: FakeRagClient()

    client = TestClient(app)
    response = client.post(
        "/api/v1/rag/chat",
        json={"message": "goi y quan sushi", "top_k": 3},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["answer"] == "Sushi Test is a good match."
    assert payload["sources"][0]["place_id"] == "sushi_test"


def test_rag_retrieve_proxies_to_ai_service():
    app.dependency_overrides[get_rag_client] = lambda: FakeRagClient()

    client = TestClient(app)
    response = client.post(
        "/api/v1/rag/retrieve",
        json={"query": "quan ca phe yen tinh", "top_k": 2},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["query"] == "quan ca phe yen tinh"
    assert payload["sources"][0]["place_id"] == "cafe_test"


def test_rag_service_error_is_forwarded():
    app.dependency_overrides[get_rag_client] = lambda: FakeRagClient(
        error=RagServiceError("rag unavailable", status_code=503)
    )

    client = TestClient(app)
    response = client.post(
        "/api/v1/rag/chat",
        json={"message": "goi y quan sushi", "top_k": 3},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "rag unavailable"
