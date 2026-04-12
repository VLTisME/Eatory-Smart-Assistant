"""Routes for menu translation feature."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Query

from app.features.menu_translation.ocr_engine import (
    OCRServiceError,
    MenuOCREngine,
    get_menu_ocr_engine,
)
from app.features.menu_translation.schemas import OCRExtractResponse, MenuResponse
from app.features.menu_translation.menu_pipeline import MenuPipeline
from app.shared.refinement import get_refinement_client, RefinementClient
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

@router.post("/ocr/structured", response_model=MenuResponse)
async def extract_structured_menu(
    file: UploadFile = File(...),
    restaurant_name: str = Query(default="", description="Tên quán nếu biết trước"),
    target_language: str = Query(default="en", description="Ngôn ngữ đích (ví dụ: 'en' cho tiếng Anh, 'vi' cho tiếng Việt)"),
    ocr_engine: MenuOCREngine = Depends(get_menu_ocr_engine),
    llm_client: RefinementClient = Depends(get_refinement_client),
) -> MenuResponse:
    """
    Upload ảnh menu → Trả trực tiếp structured JSON cho frontend.
    Pipeline: OCR → LLM → Structured JSON
    """
    validated = await validate_image_upload(file)
    
    pipeline = MenuPipeline(
        ocr_engine=ocr_engine,
        llm_client=llm_client,
    )
    
    return await pipeline.process(validated.data, restaurant_name, target_language)
