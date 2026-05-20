"""RAG chatbot API routes.

Endpoints:
  POST /api/v1/rag/chat     — Full RAG pipeline (retrieve + OpenAI answer)
  POST /api/v1/rag/retrieve — Vector search only (no OpenAI call)
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.features.rag_chat.schemas import (
    RagChatRequest,
    RagChatResponse,
    RagRetrieveRequest,
    RagRetrieveResponse,
)
from app.features.rag_chat.service import rag_chat, rag_retrieve

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/rag", tags=["RAG Chatbot"])


@router.post("/chat", response_model=RagChatResponse)
async def chat_with_rag(request: RagChatRequest) -> RagChatResponse:
    """Full RAG pipeline: retrieve relevant places + generate AI answer."""
    try:
        result = await rag_chat(message=request.message, top_k=request.top_k)
        return RagChatResponse(**result)
    except Exception as e:
        logger.exception("RAG chat endpoint error")
        raise HTTPException(status_code=500, detail=f"RAG processing failed: {e}")


@router.post("/retrieve", response_model=RagRetrieveResponse)
async def retrieve_places(request: RagRetrieveRequest) -> RagRetrieveResponse:
    """Vector search only — retrieve top-k places without calling OpenAI."""
    try:
        result = await rag_retrieve(query=request.query, top_k=request.top_k)
        return RagRetrieveResponse(**result)
    except Exception as e:
        logger.exception("RAG retrieve endpoint error")
        raise HTTPException(status_code=500, detail=f"RAG retrieval failed: {e}")
