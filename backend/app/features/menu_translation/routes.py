"""Routes for menu translation feature."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.features.menu_translation.ocr_engine import (
    OCRServiceError,
    MenuOCREngine,
    get_menu_ocr_engine,
)
from app.features.menu_translation.schemas import OCRExtractResponse
from app.shared.image_upload import validate_image_upload


router = APIRouter(prefix="/api/v1/menu-translation", tags=["Menu Translation"])


@router.post("/ocr", response_model=OCRExtractResponse)
async def extract_menu_text(
    file: UploadFile = File(...),
    ocr_engine: MenuOCREngine = Depends(get_menu_ocr_engine),
) -> OCRExtractResponse:
    validated = await validate_image_upload(file)
    try:
        result = ocr_engine.extract_text(validated.data)
    except OCRServiceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not result.text.strip():
        raise HTTPException(status_code=422, detail="No readable text was detected in the uploaded image.")

    return OCRExtractResponse(
        filename=validated.filename,
        content_type=validated.content_type,
        size_bytes=validated.size_bytes,
        width=validated.width,
        height=validated.height,
        raw_text=result.text,
        provider=result.provider,
        processing_time_ms=result.processing_time_ms,
    )
