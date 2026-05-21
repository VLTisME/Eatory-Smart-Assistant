"""Application service layer for RAG endpoints."""

from __future__ import annotations

import asyncio
import logging

from app.config import settings
from app.rag_engine import RagEngine
from app.refinement import RefinementClient
from app.schemas import RagChatResponse, RagRetrieveResponse


logger = logging.getLogger(__name__)


class RagChatService:
    """Coordinates retrieval, generation, and optional answer refinement."""

    def __init__(self, *, engine: RagEngine, refinement_client: RefinementClient | None = None) -> None:
        self._engine = engine
        self._refinement_client = refinement_client

    async def retrieve(self, *, query: str, top_k: int) -> RagRetrieveResponse:
        results = await asyncio.to_thread(self._engine.retrieve, query, top_k)
        sources = self._engine.build_sources(results)
        return RagRetrieveResponse(query=query, sources=sources)

    async def chat(
        self,
        *,
        message: str,
        top_k: int,
        target_language: str = "vi",
        refine: bool = True,
    ) -> RagChatResponse:
        results = await asyncio.to_thread(self._engine.retrieve, message, top_k)
        if not results:
            no_results_message = (
                settings.rag_no_results_message
                if target_language == "vi"
                else "Sorry, the current data is not enough to answer that question."
            )
            return RagChatResponse(answer=no_results_message, sources=[])

        context = self._engine.build_context(results)
        answer = await asyncio.to_thread(
            self._engine.generate_answer,
            message,
            context,
            target_language,
        )

        if refine and self._refinement_client is not None:
            try:
                answer, duration_ms, _ = await asyncio.to_thread(
                    self._refinement_client.refine,
                    content=answer,
                    context="rag_chat",
                    source_language=target_language,
                    target_language=target_language,
                )
                logger.info("RAG answer refinement completed in %.0fms", duration_ms)
            except Exception:
                logger.exception("RAG answer refinement failed; returning unrefined answer")

        sources = self._engine.build_sources(results)
        return RagChatResponse(answer=answer, sources=sources)
