"""Pydantic request/response schemas for RAG chatbot endpoints."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


# ── Shared models ──

class SourcePlace(BaseModel):
    """A place returned as a source from the RAG vector search."""

    place_id: Optional[str] = None
    place_name: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    avg_rating: Optional[float] = None
    positive_ratio: Optional[float] = None
    negative_ratio: Optional[float] = None
    score: float
    content_preview: str


class RagChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's question")
    top_k: int = Field(default=5, ge=1, le=10, description="Number of documents to retrieve")
    target_language: str = Field(
        default="vi",
        pattern="^(vi|en)$",
        description="Language for the generated answer: vi or en",
    )


class RagChatResponse(BaseModel):
    answer: str
    sources: List[SourcePlace] = Field(default_factory=list)


class RagRetrieveRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Search query")
    top_k: int = Field(default=5, ge=1, le=10, description="Number of results to return")


class RagRetrieveResponse(BaseModel):
    query: str
    sources: List[SourcePlace] = Field(default_factory=list)
