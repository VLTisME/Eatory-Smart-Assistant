"""RAG chatbot service — business logic layer.

Wraps ai-models/rag/query_rag.py (the core RAG pipeline) and exposes
clean async functions for the route handlers. All reusable helpers
from the original ai-models/rag/api.py are consolidated here.
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys
from functools import lru_cache
from pathlib import Path
from typing import Any, List, Optional

from app.core.config import settings
from app.features.rag_chat.schemas import SourcePlace

# Add the ai-models/rag directory to sys.path so we can import query_rag
_RAG_DIR = Path(__file__).resolve().parents[4] / "ai-models" / "rag"
if str(_RAG_DIR) not in sys.path:
    sys.path.insert(0, str(_RAG_DIR))

logger = logging.getLogger(__name__)


# ── Internal helpers (ported from ai-models/rag/api.py) ──

def _to_float_or_none(value: Any) -> Optional[float]:
    """Safely cast a value to float, returning None on failure."""
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _build_content_preview(content: str, max_chars: int = 300) -> str:
    """Truncate long content with ellipsis."""
    if len(content) <= max_chars:
        return content
    return content[:max_chars].rstrip() + "..."


def _build_sources(results: list) -> List[SourcePlace]:
    """Convert raw Chroma results to SourcePlace schema instances."""
    sources = []
    for doc, score in results:
        metadata = doc.metadata
        sources.append(
            SourcePlace(
                place_id=metadata.get("place_id"),
                place_name=metadata.get("place_name"),
                address=metadata.get("address"),
                district=metadata.get("district"),
                city=metadata.get("city"),
                avg_rating=_to_float_or_none(metadata.get("avg_rating")),
                positive_ratio=_to_float_or_none(metadata.get("positive_ratio")),
                negative_ratio=_to_float_or_none(metadata.get("negative_ratio")),
                score=float(score),
                content_preview=_build_content_preview(doc.page_content),
            )
        )
    return sources


# ── OpenAI API key bridging ──

def _ensure_openai_api_key() -> None:
    """Bridge the backend's .env settings to os.environ for the openai library.

    pydantic-settings loads OPENAI_API_KEY into settings.openai_api_key,
    but the openai Python SDK reads os.environ["OPENAI_API_KEY"] directly.
    """
    if not os.environ.get("OPENAI_API_KEY") and settings.openai_api_key:
        os.environ["OPENAI_API_KEY"] = settings.openai_api_key


# ── Lazy RAG module loader ──

@lru_cache(maxsize=1)
def _get_rag_module():
    """Lazily import query_rag to avoid loading heavy embedding models at startup."""
    _ensure_openai_api_key()
    # noinspection PyUnresolvedReferences
    import query_rag  # type: ignore[import-untyped]
    return query_rag


# ── Public service functions ──

async def rag_chat(message: str, top_k: int = 5) -> dict:
    """Run the full RAG pipeline: retrieve → build context → OpenAI answer.

    Returns a dict with 'answer' (str) and 'sources' (list of dicts).
    """
    try:
        _ensure_openai_api_key()
        rag = _get_rag_module()

        results = await asyncio.to_thread(rag.retrieve, message, top_k)

        if not results:
            return {
                "answer": "Mình chưa tìm thấy địa điểm phù hợp trong dữ liệu hiện tại.",
                "sources": [],
            }

        context = rag.build_context(results)
        answer = await asyncio.to_thread(rag.ask_openai, message, context)

        # Refine the answer using the LLM refinement layer
        try:
            from app.shared.refinement import get_refinement_client
            refinement_client = get_refinement_client()
            refined_answer, duration_ms, _ = refinement_client.refine(
                content=answer,
                context="rag_chat",
                source_language="vi",
                target_language="vi",
            )
            logger.info("RAG chat refinement completed in %.0fms", duration_ms)
            answer = refined_answer
        except Exception as exc:
            logger.error("Error during RAG chat refinement: %s", exc)

        sources = _build_sources(results)

        return {
            "answer": answer,
            "sources": [s.model_dump() for s in sources],
        }
    except Exception:
        logger.exception("RAG pipeline error")
        raise


async def rag_retrieve(query: str, top_k: int = 5) -> dict:
    """Retrieve top-k places via vector search only (no OpenAI call).

    Returns a dict with 'query' (str) and 'sources' (list of dicts).
    """
    try:
        _ensure_openai_api_key()
        rag = _get_rag_module()

        results = await asyncio.to_thread(rag.retrieve, query, top_k)
        sources = _build_sources(results)

        return {
            "query": query,
            "sources": [s.model_dump() for s in sources],
        }
    except Exception:
        logger.exception("RAG retrieve error")
        raise
