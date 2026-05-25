"""FastAPI routes for RAG and shared refinement."""

from __future__ import annotations

import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.config import settings
from app.rag_engine import RagEngine, RagServiceError, get_rag_engine
from app.refinement import RefinementClient, RefinementError, get_refinement_client
from app.schemas import (
    RefineTextRequest,
    RefineTextResponse,
    RagChatRequest,
    RagChatResponse,
    RagRetrieveRequest,
    RagRetrieveResponse,
)
from app.service import RagChatService


router = APIRouter()


async def verify_service_token(authorization: Annotated[str | None, Header()] = None) -> None:
    """Validate service-to-service bearer auth when SERVICE_TOKEN is configured."""

    if not settings.service_token:
        return

    expected = f"Bearer {settings.service_token}"
    if authorization != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid service token.")


@router.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": settings.app_name, "version": settings.app_version}


def get_optional_refinement_client() -> RefinementClient | None:
    try:
        return get_refinement_client()
    except RefinementError:
        return None


@router.post("/v1/rag/retrieve", response_model=RagRetrieveResponse, tags=["RAG"])
async def retrieve_places(
    payload: RagRetrieveRequest,
    engine: RagEngine = Depends(get_rag_engine),
    _: None = Depends(verify_service_token),
) -> RagRetrieveResponse:
    try:
        service = RagChatService(engine=engine)
        return await service.retrieve(query=payload.query, top_k=payload.top_k)
    except RagServiceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/v1/rag/chat", response_model=RagChatResponse, tags=["RAG"])
async def chat_with_rag(
    payload: RagChatRequest,
    engine: RagEngine = Depends(get_rag_engine),
    refinement_client: RefinementClient | None = Depends(get_optional_refinement_client),
    _: None = Depends(verify_service_token),
) -> RagChatResponse:
    try:
        service = RagChatService(engine=engine, refinement_client=refinement_client)
        target_language = (
            payload.target_language.value
            if hasattr(payload.target_language, "value")
            else str(payload.target_language)
        )
        return await service.chat(
            message=payload.message,
            top_k=payload.top_k,
            target_language=target_language,
            refine=payload.refine,
        )
    except RagServiceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/v1/refinement/refine", response_model=RefineTextResponse, tags=["Refinement"])
async def refine_text(
    payload: RefineTextRequest,
    refinement_client: RefinementClient = Depends(get_refinement_client),
    _: None = Depends(verify_service_token),
) -> RefineTextResponse:
    source_language = (
        payload.source_language.value
        if hasattr(payload.source_language, "value")
        else str(payload.source_language)
    )
    target_language = (
        payload.target_language.value
        if hasattr(payload.target_language, "value")
        else str(payload.target_language)
    )

    try:
        refined_text, processing_time_ms, prompt_version = await asyncio.to_thread(
            refinement_client.refine,
            content=payload.content,
            context=payload.context,
            source_language=source_language,
            target_language=target_language,
        )
    except RefinementError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return RefineTextResponse(
        refined_text=refined_text,
        source_language=source_language,
        target_language=target_language,
        context=payload.context,
        model=refinement_client.model,
        prompt_version=prompt_version,
        processing_time_ms=processing_time_ms,
    )
