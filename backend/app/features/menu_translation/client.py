"""HTTP client for the menu translation AI service."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException
from pydantic import ValidationError

from app.clients.ai_services import get_ai_service_endpoints
from app.features.menu_translation.schemas import OCRExtractResponse, MenuResponse
from app.shared.image_upload import ValidatedImage


class MenuTranslationServiceError(RuntimeError):
    """Raised when the menu translation AI service cannot satisfy a request."""

    def __init__(self, detail: Any, status_code: int = 502) -> None:
        super().__init__(str(detail))
        self.detail = detail
        self.status_code = status_code


@dataclass(slots=True)
class MenuTranslationAIClient:
    """Small wrapper around the internal menu translation AI service."""

    base_url: str
    timeout_seconds: float
    service_token: str | None = None
    transport: httpx.AsyncBaseTransport | None = None

    async def extract_ocr(self, image: ValidatedImage) -> OCRExtractResponse:
        payload = await self._post_image("/v1/menu/ocr", image)
        try:
            return OCRExtractResponse.model_validate(payload)
        except ValidationError as exc:
            raise MenuTranslationServiceError(
                "Menu translation AI service returned an invalid OCR response.",
                status_code=502,
            ) from exc

    async def extract_structured(
        self,
        image: ValidatedImage,
        *,
        restaurant_name: str,
        target_language: str,
    ) -> MenuResponse:
        payload = await self._post_image(
            "/v1/menu/structured",
            image,
            params={
                "restaurant_name": restaurant_name,
                "target_language": target_language,
            },
        )
        try:
            return MenuResponse.model_validate(payload)
        except ValidationError as exc:
            raise MenuTranslationServiceError(
                "Menu translation AI service returned an invalid structured menu response.",
                status_code=502,
            ) from exc

    async def _post_image(
        self,
        path: str,
        image: ValidatedImage,
        *,
        params: dict[str, str] | None = None,
    ) -> Any:
        headers = self._headers()
        files = {"file": (image.filename, image.data, image.content_type)}

        try:
            async with httpx.AsyncClient(
                timeout=self.timeout_seconds,
                transport=self.transport,
            ) as client:
                response = await client.post(
                    self._url(path),
                    params=params,
                    headers=headers,
                    files=files,
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            raise MenuTranslationServiceError(
                self._extract_error_detail(exc.response),
                status_code=status_code if status_code < 500 else 502,
            ) from exc
        except httpx.RequestError as exc:
            raise MenuTranslationServiceError(
                "Menu translation AI service is unavailable.",
                status_code=503,
            ) from exc
        except ValueError as exc:
            raise MenuTranslationServiceError(
                "Menu translation AI service returned a non-JSON response.",
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
            return response.text or "Menu translation AI service request failed."

        if isinstance(payload, dict):
            return payload.get("detail") or payload.get("error") or payload
        return payload


def get_menu_translation_client() -> MenuTranslationAIClient:
    """Build a menu translation AI client from backend service settings."""

    endpoints = get_ai_service_endpoints()
    if not endpoints.menu_translation:
        raise HTTPException(
            status_code=503,
            detail="AI_MENU_SERVICE_URL is not configured for the backend.",
        )

    return MenuTranslationAIClient(
        base_url=endpoints.menu_translation,
        timeout_seconds=endpoints.timeout_seconds,
        service_token=endpoints.service_token,
    )
