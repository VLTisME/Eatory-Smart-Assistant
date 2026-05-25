"""HTTP client for the RAG AI service."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException
from pydantic import ValidationError

from app.clients.ai_services import get_ai_service_endpoints
from app.features.rag_chat.schemas import RagChatResponse, RagRetrieveResponse


class RagServiceError(RuntimeError):
    """Raised when the RAG AI service cannot satisfy a request."""

    def __init__(self, detail: Any, status_code: int = 502) -> None:
        super().__init__(str(detail))
        self.detail = detail
        self.status_code = status_code


@dataclass(slots=True)
class RagAIClient:
    """Small wrapper around the internal RAG AI service."""

    base_url: str
    timeout_seconds: float
    service_token: str | None = None
    transport: httpx.AsyncBaseTransport | None = None

    async def chat(self, *, message: str, top_k: int, target_language: str = "vi") -> RagChatResponse:
        payload = await self._post_json(
            "/v1/rag/chat",
            {
                "message": message,
                "top_k": top_k,
                "target_language": target_language,
                "refine": True,
            },
        )
        try:
            return RagChatResponse.model_validate(payload)
        except ValidationError as exc:
            raise RagServiceError("RAG AI service returned an invalid chat response.") from exc

    async def retrieve(self, *, query: str, top_k: int) -> RagRetrieveResponse:
        payload = await self._post_json(
            "/v1/rag/retrieve",
            {
                "query": query,
                "top_k": top_k,
            },
        )
        try:
            return RagRetrieveResponse.model_validate(payload)
        except ValidationError as exc:
            raise RagServiceError("RAG AI service returned an invalid retrieval response.") from exc

    async def _post_json(self, path: str, payload: dict[str, Any]) -> Any:
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout_seconds,
                transport=self.transport,
            ) as client:
                response = await client.post(self._url(path), headers=self._headers(), json=payload)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            raise RagServiceError(
                self._extract_error_detail(exc.response),
                status_code=status_code if status_code < 500 else 502,
            ) from exc
        except httpx.RequestError as exc:
            raise RagServiceError("RAG AI service is unavailable.", status_code=503) from exc
        except ValueError as exc:
            raise RagServiceError("RAG AI service returned a non-JSON response.", status_code=502) from exc

    def _url(self, path: str) -> str:
        return f"{self.base_url.rstrip('/')}{path}"

    def _headers(self) -> dict[str, str]:
        if not self.service_token:
            return {}
        return {"Authorization": f"Bearer {self.service_token}"}

    def _extract_error_detail(self, response: httpx.Response) -> Any:
        try:
            payload = response.json()
        except ValueError:
            return response.text or "RAG AI service request failed."

        if isinstance(payload, dict):
            return payload.get("detail") or payload.get("error") or payload
        return payload


def get_rag_client() -> RagAIClient:
    endpoints = get_ai_service_endpoints()
    if not endpoints.rag:
        raise HTTPException(
            status_code=503,
            detail="AI_RAG_SERVICE_URL is not configured for the backend.",
        )

    return RagAIClient(
        base_url=endpoints.rag,
        timeout_seconds=endpoints.timeout_seconds,
        service_token=endpoints.service_token,
    )
