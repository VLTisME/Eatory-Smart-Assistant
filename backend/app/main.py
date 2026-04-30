"""FastAPI application for the Smart Travel Assistant backend."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.firebase import initialize_firebase
initialize_firebase()


from app.api.router import router as api_router
from app.core.config import settings
from app.features.menu_translation.ocr_engine import get_menu_ocr_engine
from app.features.place_search.service import get_place_search_engine
from app.shared.refinement import get_refinement_client

# 1. Logging configuration
logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# 2. Lifespan (startup/shutdown) management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""

    logger.info("Starting %s", settings.app_name)
    logger.info("OpenAI model: %s", settings.openai_model)
    logger.info("OCR provider: %s", settings.ocr_provider)

    # Warm-up heavy clients to avoid cold-start failures on the first upload.
    try:
        logger.info("Warming up OCR engine...")
        await asyncio.to_thread(get_menu_ocr_engine)
        logger.info("OCR engine warm-up completed")
    except Exception:
        logger.exception("OCR engine warm-up failed; first OCR request may be slower")

    if settings.openai_api_key:
        try:
            logger.info("Warming up refinement client...")
            await asyncio.to_thread(get_refinement_client)
            logger.info("Refinement client warm-up completed")
        except Exception:
            logger.exception("Refinement warm-up failed; first LLM request may be slower")

    try:
        logger.info("Warming up place search engine...")
        await asyncio.to_thread(get_place_search_engine)
        logger.info("Place search engine warm-up completed")
    except Exception:
        logger.exception("Place search warm-up failed; first place-search request may be slower")

    yield
    logger.info("Shutting down %s", settings.app_name)

# 3. FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="API for upload validation, OCR extraction, and LLM-based menu refinement.",
    version=settings.app_version,
    lifespan=lifespan,
)

# 4. Middleware and routes -> allow FE to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/", tags=["Root"])
async def root() -> dict[str, object]:
    """Simple root endpoint for local sanity checks."""

    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": settings.app_name, "version": settings.app_version}


@app.get("/api/v1/info", tags=["Info"])
async def service_info() -> dict[str, object]:
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "shared_components": ["uploads", "llm_refinement"],
        "features": ["menu_translation", "place_search"],
        "llm_model": settings.openai_model,
        "endpoints": {
            "upload_image": "/api/v1/uploads/image",
            "menu_translation_ocr": "/api/v1/menu-translation/ocr",
            "place_search": "/api/v1/place-search",
            "llm_refine": "/api/v1/llm/refine",
        },
    }


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.exception("Unhandled exception during request processing")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.service_debug else "An error occurred",
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.service_host,
        port=settings.service_port,
        reload=settings.service_debug,
        log_level=settings.log_level.lower(),
    )