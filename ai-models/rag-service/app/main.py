"""FastAPI app for the RAG AI service."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.rag_engine import get_rag_engine
from app.refinement import RefinementError, get_refinement_client
from app.routes import router


logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm lightweight clients and report artifact configuration."""

    logger.info("Starting %s", settings.app_name)
    logger.info("RAG Chroma directory: %s", settings.rag_chroma_dir)
    logger.info("RAG embedding model: %s", settings.rag_embedding_model)

    try:
        await asyncio.to_thread(get_rag_engine)
    except Exception:
        logger.exception("RAG engine initialization failed; first request may fail or be slower")

    try:
        await asyncio.to_thread(get_refinement_client)
    except RefinementError:
        logger.warning("OPENAI_API_KEY is not configured; generation/refinement endpoints will fail until it is set")
    except Exception:
        logger.exception("Refinement warm-up failed; first refinement request may be slower")

    yield
    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    description="RAG retrieval, recommendation generation, and shared LLM refinement service.",
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/", tags=["Root"])
async def root() -> dict[str, object]:
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "openapi": "/openapi.json",
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
