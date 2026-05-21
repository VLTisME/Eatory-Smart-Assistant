"""Routes for menu translation feature."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Query

from app.features.menu_translation.client import (
    MenuTranslationAIClient,
    MenuTranslationServiceError,
    get_menu_translation_client,
)
from app.features.menu_translation.schemas import OCRExtractResponse, MenuResponse
from app.shared.image_upload import validate_image_upload


router = APIRouter(prefix="/api/v1/menu-translation", tags=["Menu Translation"])


@router.post("/ocr", response_model=OCRExtractResponse)
async def extract_menu_text(
    file: UploadFile = File(...),
    client: MenuTranslationAIClient = Depends(get_menu_translation_client),
) -> OCRExtractResponse:
    validated = await validate_image_upload(file)
    try:
        return await client.extract_ocr(validated)
    except MenuTranslationServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.post("/ocr/structured", response_model=MenuResponse)
async def extract_structured_menu(
    file: UploadFile = File(...),
    restaurant_name: str = Query(default="", description="Tên quán nếu biết trước"),
    target_language: str = Query(
        default="en",
        description="Ngôn ngữ đích (ví dụ: 'en' cho tiếng Anh, 'vi' cho tiếng Việt)",
    ),
    client: MenuTranslationAIClient = Depends(get_menu_translation_client),
) -> MenuResponse:
    """
    Upload an image menu and return structured JSON for the frontend.
    The backend validates the upload, then delegates OCR and model handling
    to the menu translation AI service.
    """
    validated = await validate_image_upload(file)
    try:
        return await client.extract_structured(
            validated,
            restaurant_name=restaurant_name,
            target_language=target_language,
        )
    except MenuTranslationServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
