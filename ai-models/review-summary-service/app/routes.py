"""HTTP routes for the review summary AI service."""

from __future__ import annotations

import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.config import settings
from app.llm import ReviewSummaryAIError, ReviewSummaryLLMClient, get_llm_client
from app.schemas import (
    ReviewSummaryGenerateRequest,
    ReviewSummaryGenerateResponse,
    ReviewSummaryTranslateRequest,
    ReviewSummaryTranslateResponse,
)
from app.service import ReviewSummaryGenerator


router = APIRouter()


async def verify_service_token(authorization: Annotated[str | None, Header()] = None) -> None:
    """Validate service-to-service bearer auth when SERVICE_TOKEN is configured."""

    if not settings.service_token:
        return

    expected = f"Bearer {settings.service_token}"
    if authorization != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid service token.")


def get_generator(llm_client: ReviewSummaryLLMClient = Depends(get_llm_client)) -> ReviewSummaryGenerator:
    return ReviewSummaryGenerator(llm_client=llm_client)


@router.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": settings.app_name, "version": settings.app_version}


@router.post(
    "/v1/review-summary/generate",
    response_model=ReviewSummaryGenerateResponse,
    tags=["Review Summary"],
    dependencies=[Depends(verify_service_token)],
)
async def generate_review_summary(
    payload: ReviewSummaryGenerateRequest,
    generator: ReviewSummaryGenerator = Depends(get_generator),
) -> ReviewSummaryGenerateResponse:
    try:
        return await asyncio.to_thread(generator.generate, payload)
    except ReviewSummaryAIError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post(
    "/v1/review-summary/translate",
    response_model=ReviewSummaryTranslateResponse,
    tags=["Review Summary"],
    dependencies=[Depends(verify_service_token)],
)
async def translate_review_summary(
    payload: ReviewSummaryTranslateRequest,
    generator: ReviewSummaryGenerator = Depends(get_generator),
) -> ReviewSummaryTranslateResponse:
    try:
        return await asyncio.to_thread(generator.translate, payload)
    except ReviewSummaryAIError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
