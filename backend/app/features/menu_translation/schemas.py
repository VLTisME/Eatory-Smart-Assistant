"""Schemas for menu translation OCR extraction."""

from pydantic import BaseModel, Field


class OCRExtractResponse(BaseModel):
    """Raw OCR extraction response for menu translation."""

    filename: str = Field(..., description="Original filename from the client")
    content_type: str = Field(..., description="MIME type of the uploaded image")
    size_bytes: int = Field(..., description="Image size in bytes")
    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")
    raw_text: str = Field(..., description="Text extracted from the image before refinement")
    provider: str = Field(..., description="OCR provider used for extraction")
    processing_time_ms: float = Field(..., description="OCR processing time in milliseconds")