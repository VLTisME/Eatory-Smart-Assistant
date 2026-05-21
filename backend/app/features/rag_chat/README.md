# Backend RAG Chat Proxy

Module này expose public RAG routes cho frontend. Backend không load embeddings, Chroma, OpenAI client hoặc prompt RAG; các phần đó thuộc `ai-models/rag-service`.

## Endpoint public

| Method | Path | Hành vi backend |
| --- | --- | --- |
| `POST` | `/api/v1/rag/chat` | Validate request, truyền `message`, `top_k`, `target_language`, `refine` sang `POST /v1/rag/chat`. |
| `POST` | `/api/v1/rag/retrieve` | Validate request, truyền `query` và `top_k` sang `POST /v1/rag/retrieve`. |

## File chính

- `routes.py`: định nghĩa public FastAPI routes.
- `client.py`: HTTP client gọi `rag-service`.
- `schemas.py`: public request/response schema cho frontend contract.

## Backend sở hữu

- Public route compatibility.
- Request validation.
- Error mapping khi AI service unavailable hoặc trả invalid response.
- Truyền language intent từ frontend xuống AI service.

## AI service sở hữu

- Chroma vector DB.
- Embedding model.
- RAG retrieval.
- Prompt và OpenAI answer generation.
- Shared refinement endpoint.

## Biến môi trường backend

```env
AI_RAG_SERVICE_URL="http://localhost:8103"
AI_REFINEMENT_SERVICE_URL="http://localhost:8103"
AI_SERVICE_TIMEOUT_SECONDS=180
AI_SERVICE_TOKEN=""
```

## Hành vi lỗi

- Thiếu `AI_RAG_SERVICE_URL`: backend trả `503`.
- AI service unreachable: backend trả `503`.
- AI service trả 4xx: backend giữ status code đó.
- AI service trả 5xx hoặc invalid JSON: backend trả `502`.
