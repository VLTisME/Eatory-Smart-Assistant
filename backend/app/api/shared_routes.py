"""Shared API routes used by multiple features."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.shared.image_upload import validate_image_upload
from app.shared.refinement import RefinementClient, RefinementError, get_refinement_client
from app.shared.schemas import RefineTextRequest, RefineTextResponse, UploadImageResponse


router = APIRouter(prefix="/api/v1", tags=["Shared"])


@router.post("/uploads/image", response_model=UploadImageResponse, tags=["Uploads"])
async def upload_image(file: UploadFile = File(...)) -> UploadImageResponse:
    validated = await validate_image_upload(file)
    return UploadImageResponse(
        filename=validated.filename,
        content_type=validated.content_type,
        size_bytes=validated.size_bytes,
        width=validated.width,
        height=validated.height,
        message="Image accepted for processing.",
    )


@router.post("/llm/refine", response_model=RefineTextResponse, tags=["LLM"])
async def refine_text(
    payload: RefineTextRequest,
    refinement_client: RefinementClient = Depends(get_refinement_client),
) -> RefineTextResponse:
    source_language = (
        payload.source_language.value
        if hasattr(payload.source_language, "value")
        else str(payload.source_language)
    )
    target_language = (
        payload.target_language.value
        if hasattr(payload.target_language, "value")
        else str(payload.target_language)
    )

    try:
        refined_text, processing_time_ms, prompt_version = refinement_client.refine(
            content=payload.content,
            context=payload.context,
            source_language=source_language,
            target_language=target_language,
        )
    except RefinementError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return RefineTextResponse(
        refined_text=refined_text,
        source_language=source_language,
        target_language=target_language,
        context=payload.context,
        model=refinement_client.model,
        prompt_version=prompt_version,
        processing_time_ms=processing_time_ms,
    )
