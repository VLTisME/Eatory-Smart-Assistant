"""Shared image upload validation used by image-based features."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO

from fastapi import HTTPException, UploadFile
from PIL import Image

from app.core.config import settings


@dataclass(slots=True)
class ValidatedImage:
    """Normalized image payload kept only for the active request."""

    filename: str
    content_type: str
    size_bytes: int
    width: int
    height: int
    data: bytes


async def validate_image_upload(file: UploadFile) -> ValidatedImage:
    """Validate and normalize a client uploaded image."""

    if not file.filename:
        raise HTTPException(status_code=400, detail="Image filename is required.")

    if file.content_type not in settings.allowed_image_content_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Supported formats: JPEG, PNG, WebP, BMP.",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(data) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Image file too large. Maximum size: {settings.max_upload_size_mb}MB.",
        )

    try:
        image = Image.open(BytesIO(data))
        image.verify()
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=400, detail="Invalid image file.") from exc

    image = Image.open(BytesIO(data))
    width, height = image.size

    return ValidatedImage(
        filename=file.filename,
        content_type=file.content_type,
        size_bytes=len(data),
        width=width,
        height=height,
        data=data,
    )
