"""RAG chatbot API routes.

Endpoints:
  POST /api/v1/rag/chat     — Full RAG pipeline (retrieve + OpenAI answer)
  POST /api/v1/rag/retrieve — Vector search only (no OpenAI call)
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.features.rag_chat.client import RagAIClient, RagServiceError, get_rag_client
from app.features.rag_chat.schemas import (
    RagChatRequest,
    RagChatResponse,
    RagRetrieveRequest,
    RagRetrieveResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/rag", tags=["RAG Chatbot"])


@router.post("/chat", response_model=RagChatResponse)
async def chat_with_rag(
    request: RagChatRequest,
    rag_client: RagAIClient = Depends(get_rag_client),
) -> RagChatResponse:
    """Full RAG pipeline: retrieve relevant places + generate AI answer."""
    try:
        return await rag_client.chat(
            message=request.message,
            top_k=request.top_k,
            target_language=request.target_language,
        )
    except RagServiceError as exc:
        logger.exception("RAG chat endpoint error")
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.post("/retrieve", response_model=RagRetrieveResponse)
async def retrieve_places(
    request: RagRetrieveRequest,
    rag_client: RagAIClient = Depends(get_rag_client),
) -> RagRetrieveResponse:
    """Vector search only — retrieve top-k places without calling OpenAI."""
    try:
        return await rag_client.retrieve(query=request.query, top_k=request.top_k)
    except RagServiceError as exc:
        logger.exception("RAG retrieve endpoint error")
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
