from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from query_rag import ask_openai, build_context, retrieve


app = FastAPI(
    title="Food Places RAG Service",
    version="1.0.0",
)


class RetrieveRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=10)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=10)


class SourcePlace(BaseModel):
    place_id: Optional[str] = None
    place_name: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    avg_rating: Optional[float] = None
    positive_ratio: Optional[float] = None
    negative_ratio: Optional[float] = None
    score: float
    content_preview: str


class RetrieveResponse(BaseModel):
    query: str
    sources: List[SourcePlace]


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourcePlace]


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {
        "status": "ok",
        "service": "rag-service",
    }


def to_float_or_none(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def build_content_preview(content: str, max_chars: int = 300) -> str:
    if len(content) <= max_chars:
        return content

    return content[:max_chars].rstrip() + "..."


def build_sources(results) -> List[SourcePlace]:
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
                avg_rating=to_float_or_none(metadata.get("avg_rating")),
                positive_ratio=to_float_or_none(metadata.get("positive_ratio")),
                negative_ratio=to_float_or_none(metadata.get("negative_ratio")),
                score=float(score),
                content_preview=build_content_preview(doc.page_content),
            )
        )

    return sources


@app.post("/rag/retrieve", response_model=RetrieveResponse)
def rag_retrieve(request: RetrieveRequest) -> RetrieveResponse:
    try:
        results = retrieve(
            query=request.query,
            top_k=request.top_k,
        )

        sources = build_sources(results)

        return RetrieveResponse(
            query=request.query,
            sources=sources,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rag/chat", response_model=ChatResponse)
def rag_chat(request: ChatRequest) -> ChatResponse:
    try:
        results = retrieve(
            query=request.message,
            top_k=request.top_k,
        )

        if not results:
            return ChatResponse(
                answer="Mình chưa tìm thấy địa điểm phù hợp trong dữ liệu hiện tại.",
                sources=[],
            )

        context = build_context(results)
        answer = ask_openai(
            user_query=request.message,
            context=context,
        )

        sources = build_sources(results)

        return ChatResponse(
            answer=answer,
            sources=sources,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))