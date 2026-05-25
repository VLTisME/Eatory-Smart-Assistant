"""RAG retrieval and answer generation engine."""

from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.config import settings
from app.prompts import build_rag_answer_prompt, build_rag_system_prompt
from app.schemas import SourcePlace


logger = logging.getLogger(__name__)


class RagServiceError(RuntimeError):
    """Raised when RAG retrieval or generation cannot be completed."""


def _to_float_or_none(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _build_content_preview(content: str, max_chars: int = 300) -> str:
    if len(content) <= max_chars:
        return content
    return content[:max_chars].rstrip() + "..."


def _source_from_result(doc: Any, score: float) -> SourcePlace:
    metadata = getattr(doc, "metadata", {}) or {}
    return SourcePlace(
        place_id=metadata.get("place_id"),
        place_name=metadata.get("place_name"),
        address=metadata.get("address"),
        district=metadata.get("district"),
        city=metadata.get("city"),
        avg_rating=_to_float_or_none(metadata.get("avg_rating")),
        positive_ratio=_to_float_or_none(metadata.get("positive_ratio")),
        negative_ratio=_to_float_or_none(metadata.get("negative_ratio")),
        score=float(score),
        content_preview=_build_content_preview(getattr(doc, "page_content", "")),
    )


class RagEngine:
    """Thin runtime around Chroma retrieval and OpenAI answer generation."""

    def retrieve(self, query: str, top_k: int = 5) -> list[tuple[Any, float]]:
        vector_db = self._load_vector_db()
        return vector_db.similarity_search_with_score(query=query, k=top_k)

    def build_sources(self, results: list[tuple[Any, float]]) -> list[SourcePlace]:
        return [_source_from_result(doc, score) for doc, score in results]

    def build_context(self, results: list[tuple[Any, float]]) -> str:
        context_parts: list[str] = []
        for index, (doc, score) in enumerate(results, start=1):
            metadata = getattr(doc, "metadata", {}) or {}
            place_name = metadata.get("place_name", "Unknown place")
            page_content = getattr(doc, "page_content", "")
            context_parts.append(
                f"""
[Place {index}]
Name: {place_name}
Similarity score: {score}

{page_content}
""".strip()
            )
        return "\n\n---\n\n".join(context_parts)

    def generate_answer(self, user_query: str, context: str, target_language: str = "vi") -> str:
        if not settings.openai_api_key:
            raise RagServiceError("OPENAI_API_KEY is not configured for RAG generation.")

        try:
            from openai import OpenAI
        except ImportError as exc:  # pragma: no cover - dependency is installed in service env
            raise RagServiceError("The openai package is not installed.") from exc

        client = OpenAI(api_key=settings.openai_api_key)
        response = client.responses.create(
            model=settings.openai_model,
            input=[
                {"role": "system", "content": build_rag_system_prompt(target_language=target_language)},
                {
                    "role": "user",
                    "content": build_rag_answer_prompt(
                        user_query=user_query,
                        context=context,
                        target_language=target_language,
                    ),
                },
            ],
        )
        return response.output_text

    def _load_vector_db(self):
        try:
            from langchain_chroma import Chroma
            from langchain_huggingface import HuggingFaceEmbeddings
        except ImportError as exc:  # pragma: no cover - dependency is installed in service env
            raise RagServiceError("RAG vector-search dependencies are not installed.") from exc

        chroma_dir = Path(settings.rag_chroma_dir)
        if not chroma_dir.exists():
            logger.warning("RAG Chroma directory does not exist: %s", chroma_dir)

        embeddings = HuggingFaceEmbeddings(
            model_name=settings.rag_embedding_model,
            model_kwargs={
                "device": settings.rag_embedding_device,
                "trust_remote_code": True,
            },
            encode_kwargs={"normalize_embeddings": True},
        )
        return Chroma(
            collection_name=settings.rag_collection_name,
            persist_directory=str(chroma_dir),
            embedding_function=embeddings,
        )


@lru_cache
def get_rag_engine() -> RagEngine:
    return RagEngine()
