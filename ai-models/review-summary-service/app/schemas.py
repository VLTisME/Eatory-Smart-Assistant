"""Schemas for review summary generation and translation."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ReviewSummaryGenerateRequest(BaseModel):
    """Source data required to generate a review summary."""

    place_name: str = ""
    positive_ratio: float = 0.0
    negative_ratio: float = 0.0
    top_positive_keywords: list[str] = Field(default_factory=list)
    top_negative_keywords: list[str] = Field(default_factory=list)
    target_language: str = "vi"


class ReviewSummaryGenerateResponse(BaseModel):
    """Generated review summary response."""

    summary: str = ""
    extracted_dishes: list[str] = Field(default_factory=list)
    prompt_version: str = "review_summary_v1"
    processing_time_ms: float = 0.0


class ReviewSummaryTranslateRequest(BaseModel):
    """Request to translate an existing review summary."""

    summary: str
    target_language: str


class ReviewSummaryTranslateResponse(BaseModel):
    """Translated summary response."""

    summary: str = ""
    prompt_version: str = "translate_review_summary_v1"
    processing_time_ms: float = 0.0
