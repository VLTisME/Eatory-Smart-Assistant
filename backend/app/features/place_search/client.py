"""HTTP client for the place search AI service."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException
from pydantic import ValidationError

from app.clients.ai_services import get_ai_service_endpoints
from app.features.place_search.schemas import PlaceSearchResponse
from app.shared.image_upload import ValidatedImage


class PlaceSearchServiceError(RuntimeError):
    """Raised when the place search AI service cannot satisfy a request."""

    def __init__(self, detail: Any, status_code: int = 502) -> None:
        super().__init__(str(detail))
        self.detail = detail
        self.status_code = status_code


@dataclass(slots=True)
class PlaceSearchAIClient:
    """Small wrapper around the internal place search AI service."""

    base_url: str
    timeout_seconds: float
    service_token: str | None = None
    transport: httpx.AsyncBaseTransport | None = None

    async def search_by_image(
        self,
        image: ValidatedImage,
        *,
        target_language: str,
    ) -> PlaceSearchResponse:
        payload = await self._post_image(
            "/v1/place-search/by-image",
            image,
            params={"target_language": target_language},
        )
        try:
            return PlaceSearchResponse.model_validate(payload)
        except ValidationError as exc:
            raise PlaceSearchServiceError(
                "Place search AI service returned an invalid response.",
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
            raise PlaceSearchServiceError(
                self._extract_error_detail(exc.response),
                status_code=status_code if status_code < 500 else 502,
            ) from exc
        except httpx.RequestError as exc:
            raise PlaceSearchServiceError(
                "Place search AI service is unavailable.",
                status_code=503,
            ) from exc
        except ValueError as exc:
            raise PlaceSearchServiceError(
                "Place search AI service returned a non-JSON response.",
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
            return response.text or "Place search AI service request failed."

        if isinstance(payload, dict):
            return payload.get("detail") or payload.get("error") or payload
        return payload


def get_place_search_client() -> PlaceSearchAIClient:
    """Build a place search AI client from backend service settings."""

    endpoints = get_ai_service_endpoints()
    if not endpoints.place_search:
        raise HTTPException(
            status_code=503,
            detail="AI_PLACE_SEARCH_SERVICE_URL is not configured for the backend.",
        )

    return PlaceSearchAIClient(
        base_url=endpoints.place_search,
        timeout_seconds=endpoints.timeout_seconds,
        service_token=endpoints.service_token,
    )
