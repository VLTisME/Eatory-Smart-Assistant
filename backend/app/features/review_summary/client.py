"""HTTP client for the review summary AI service."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field, ValidationError

from app.clients.ai_services import get_ai_service_endpoints


class ReviewSummaryAIServiceError(RuntimeError):
    """Raised when the review summary AI service cannot satisfy a request."""

    def __init__(self, detail: Any, status_code: int = 502) -> None:
        super().__init__(str(detail))
        self.detail = detail
        self.status_code = status_code


class ReviewSummaryGenerateResponse(BaseModel):
    summary: str = ""
    extracted_dishes: list[str] = Field(default_factory=list)
    prompt_version: str = "review_summary_v1"
    processing_time_ms: float = 0.0


class ReviewSummaryTranslateResponse(BaseModel):
    summary: str = ""
    prompt_version: str = "translate_review_summary_v1"
    processing_time_ms: float = 0.0


@dataclass(slots=True)
class ReviewSummaryAIClient:
    """Small wrapper around the internal review summary AI service."""

    base_url: str
    timeout_seconds: float
    service_token: str | None = None
    transport: httpx.AsyncBaseTransport | None = None

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
        payload = await self._post_json(
            "/v1/review-summary/generate",
            {
                "place_name": place_name,
                "positive_ratio": positive_ratio,
                "negative_ratio": negative_ratio,
                "top_positive_keywords": top_positive_keywords,
                "top_negative_keywords": top_negative_keywords,
                "target_language": target_language,
            },
        )
        try:
            return ReviewSummaryGenerateResponse.model_validate(payload)
        except ValidationError as exc:
            raise ReviewSummaryAIServiceError(
                "Review summary AI service returned an invalid generation response.",
                status_code=502,
            ) from exc

    async def translate_summary(self, *, summary: str, target_language: str) -> ReviewSummaryTranslateResponse:
        payload = await self._post_json(
            "/v1/review-summary/translate",
            {
                "summary": summary,
                "target_language": target_language,
            },
        )
        try:
            return ReviewSummaryTranslateResponse.model_validate(payload)
        except ValidationError as exc:
            raise ReviewSummaryAIServiceError(
                "Review summary AI service returned an invalid translation response.",
                status_code=502,
            ) from exc

    async def _post_json(self, path: str, payload: dict[str, Any]) -> Any:
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout_seconds,
                transport=self.transport,
            ) as client:
                response = await client.post(
                    self._url(path),
                    headers=self._headers(),
                    json=payload,
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            raise ReviewSummaryAIServiceError(
                self._extract_error_detail(exc.response),
                status_code=status_code if status_code < 500 else 502,
            ) from exc
        except httpx.RequestError as exc:
            raise ReviewSummaryAIServiceError(
                "Review summary AI service is unavailable.",
                status_code=503,
            ) from exc
        except ValueError as exc:
            raise ReviewSummaryAIServiceError(
                "Review summary AI service returned a non-JSON response.",
                status_code=502,
            ) from exc

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
            return response.text or "Review summary AI service request failed."

        if isinstance(payload, dict):
            return payload.get("detail") or payload.get("error") or payload
        return payload


def get_review_summary_ai_client() -> ReviewSummaryAIClient:
    """Build a review summary AI client from backend service settings."""

    endpoints = get_ai_service_endpoints()
    if not endpoints.review_summary:
        raise HTTPException(
            status_code=503,
            detail="AI_REVIEW_SUMMARY_SERVICE_URL is not configured for the backend.",
        )

    return ReviewSummaryAIClient(
        base_url=endpoints.review_summary,
        timeout_seconds=endpoints.timeout_seconds,
        service_token=endpoints.service_token,
    )
