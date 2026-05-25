"""HTTP routes for the menu translation AI service."""

from __future__ import annotations

import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, UploadFile, status

from app.config import settings
from app.image_upload import validate_image_upload
from app.menu_pipeline import MenuPipeline
from app.ocr_engine import OCRServiceError, MenuOCREngine, get_menu_ocr_engine
from app.refinement import MenuRefinementClient, get_refinement_client
from app.schemas import OCRExtractResponse, MenuResponse


router = APIRouter()


async def verify_service_token(authorization: Annotated[str | None, Header()] = None) -> None:
    """Validate service-to-service bearer auth when SERVICE_TOKEN is configured."""

    if not settings.service_token:
        return

    expected = f"Bearer {settings.service_token}"
    if authorization != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid service token.")


@router.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": settings.app_name, "version": settings.app_version}


@router.post(
    "/v1/menu/ocr",
    response_model=OCRExtractResponse,
    tags=["Menu Translation"],
    dependencies=[Depends(verify_service_token)],
)
async def extract_menu_text(
    file: UploadFile = File(...),
    ocr_engine: MenuOCREngine = Depends(get_menu_ocr_engine),
) -> OCRExtractResponse:
    validated = await validate_image_upload(file)
    try:
        result = await asyncio.to_thread(ocr_engine.extract_text, validated.data)
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


@router.post(
    "/v1/menu/structured",
    response_model=MenuResponse,
    tags=["Menu Translation"],
    dependencies=[Depends(verify_service_token)],
)
async def extract_structured_menu(
    file: UploadFile = File(...),
    restaurant_name: str = Query(default="", description="Known restaurant name, when available"),
    target_language: str = Query(default="en", description="Target language code, for example en or vi"),
    ocr_engine: MenuOCREngine = Depends(get_menu_ocr_engine),
    llm_client: MenuRefinementClient = Depends(get_refinement_client),
) -> MenuResponse:
    validated = await validate_image_upload(file)
    pipeline = MenuPipeline(ocr_engine=ocr_engine, llm_client=llm_client)
    try:
        return await pipeline.process(validated.data, restaurant_name, target_language)
    except OCRServiceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
