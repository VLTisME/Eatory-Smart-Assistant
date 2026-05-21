"""Pydantic Schemas for multiple features."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class LanguageEnum(str, Enum):
    """Supported translation languages."""

    VIETNAMESE = "vi"
    ENGLISH = "en"


class UploadImageResponse(BaseModel):
    """Response for validating and normalizing an uploaded image."""

    filename: str = Field(..., description="Original filename from the client")
    content_type: str = Field(..., description="MIME type of the uploaded image")
    size_bytes: int = Field(..., description="Image size in bytes")
    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")
    message: str = Field(..., description="Human-readable validation result")


class RefineTextRequest(BaseModel):
    """Shared request payload for LLM refinement."""

    model_config = ConfigDict(use_enum_values=True)

    content: str = Field(..., min_length=1, description="Text to refine")
    context: str = Field(default="generic", description="Use case for the refinement")
    source_language: LanguageEnum = Field(
        default=LanguageEnum.VIETNAMESE,
        description="Language of the incoming text",
    )
    target_language: LanguageEnum = Field(
        default=LanguageEnum.ENGLISH,
        description="Language to translate into",
    )


class RefineTextResponse(BaseModel):
    """Shared response for refinement endpoint."""

    refined_text: str = Field(..., description="Refined output from the LLM")
    source_language: str = Field(..., description="Source language used by the prompt")
    target_language: str = Field(..., description="Target language used by the prompt")
    context: str = Field(..., description="Refinement context")
    model: str = Field(..., description="LLM model name")
    prompt_version: str = Field(..., description="Prompt version used for the request")
    processing_time_ms: float = Field(..., description="LLM processing time in milliseconds")


class ErrorResponse(BaseModel):
    """Standard API error response."""

    error: str = Field(..., description="Short error label")
    detail: str | None = Field(default=None, description="Detailed error message")
    status_code: int = Field(..., description="HTTP status code")
