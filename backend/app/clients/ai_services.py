"""Configuration boundary for future internal AI service clients.

Phase 1 keeps the existing local AI implementations active. These types give
later phases a single place to wire HTTP clients without spreading service URLs
through feature modules.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.core.config import settings


@dataclass(frozen=True)
class AIServiceEndpoints:
    menu_translation: str | None
    place_search: str | None
    rag: str | None
    refinement: str | None
    review_summary: str | None
    timeout_seconds: float
    service_token: str | None


def get_ai_service_endpoints() -> AIServiceEndpoints:
    return AIServiceEndpoints(
        menu_translation=settings.ai_menu_service_url,
        place_search=settings.ai_place_search_service_url,
        rag=settings.ai_rag_service_url,
        refinement=settings.ai_refinement_service_url,
        review_summary=settings.ai_review_summary_service_url,
        timeout_seconds=settings.ai_service_timeout_seconds,
        service_token=settings.ai_service_token,
    )
