"""Pydantic schemas for RAG and refinement endpoints."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SourcePlace(BaseModel):
    """A place returned as a source from vector retrieval."""

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


class LanguageEnum(str, Enum):
    VIETNAMESE = "vi"
    ENGLISH = "en"


class RagChatRequest(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    message: str = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=10)
    target_language: LanguageEnum = Field(
        default=LanguageEnum.VIETNAMESE,
        description="Language for the generated answer: vi or en.",
    )
    refine: bool = Field(default=True, description="Whether to polish the generated answer.")


class RagChatResponse(BaseModel):
    answer: str
    sources: list[SourcePlace] = Field(default_factory=list)


class RagRetrieveRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=10)


class RagRetrieveResponse(BaseModel):
    query: str
    sources: list[SourcePlace] = Field(default_factory=list)


class RefineTextRequest(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    content: str = Field(..., min_length=1)
    context: str = Field(default="generic")
    source_language: LanguageEnum = LanguageEnum.VIETNAMESE
    target_language: LanguageEnum = LanguageEnum.ENGLISH


class RefineTextResponse(BaseModel):
    refined_text: str
    source_language: str
    target_language: str
    context: str
    model: str
    prompt_version: str
    processing_time_ms: float
