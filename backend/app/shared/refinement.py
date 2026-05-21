"""HTTP client for the internal shared refinement AI endpoint."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException
from pydantic import ValidationError

from app.clients.ai_services import get_ai_service_endpoints
from app.shared.schemas import RefineTextResponse


class RefinementError(RuntimeError):
    """Raised when the refinement service cannot satisfy a request."""

    def __init__(self, detail: Any, status_code: int = 502) -> None:
        super().__init__(str(detail))
        self.detail = detail
        self.status_code = status_code


@dataclass(slots=True)
class RefinementClient:
    """Thin backend client for the AI-owned refinement endpoint."""

    base_url: str
    timeout_seconds: float
    service_token: str | None = None
    transport: httpx.AsyncBaseTransport | None = None

    @property
    def model(self) -> str:
        return "remote-refinement-service"

    async def refine(
        self,
        *,
        content: str,
        context: str,
        source_language: str,
        target_language: str,
    ) -> RefineTextResponse:
        payload = await self._post_json(
            "/v1/refinement/refine",
            {
                "content": content,
                "context": context,
                "source_language": source_language,
                "target_language": target_language,
            },
        )
        try:
            return RefineTextResponse.model_validate(payload)
        except ValidationError as exc:
            raise RefinementError("Refinement AI service returned an invalid response.") from exc

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
            raise RefinementError(
                self._extract_error_detail(exc.response),
                status_code=status_code if status_code < 500 else 502,
            ) from exc
        except httpx.RequestError as exc:
            raise RefinementError("Refinement AI service is unavailable.", status_code=503) from exc
        except ValueError as exc:
            raise RefinementError("Refinement AI service returned a non-JSON response.", status_code=502) from exc

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
            return response.text or "Refinement AI service request failed."

        if isinstance(payload, dict):
            return payload.get("detail") or payload.get("error") or payload
        return payload


def get_refinement_client() -> RefinementClient:
    endpoints = get_ai_service_endpoints()
    refinement_url = endpoints.refinement or endpoints.rag
    if not refinement_url:
        raise HTTPException(
            status_code=503,
            detail="AI_REFINEMENT_SERVICE_URL or AI_RAG_SERVICE_URL is not configured for the backend.",
        )

    return RefinementClient(
        base_url=refinement_url,
        timeout_seconds=endpoints.timeout_seconds,
        service_token=endpoints.service_token,
    )
