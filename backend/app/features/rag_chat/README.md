# Backend RAG Chat Feature

## 🎯 Mục đích

Feature này cung cấp public RAG routes cho chatbot. Backend sở hữu API contract, validation và error mapping; retrieval/generation logic thuộc `ai-models/rag-service`.

## 🧩 Trách nhiệm

- Nhận message/query từ frontend.
- Truyền `top_k`, `target_language` và `refine` sang RAG service.
- Trả answer và sources cho frontend.
- Map fallback/unavailable errors.

## 🔌 Public API

| Method | Path | Mô tả |
| --- | --- | --- |
| `POST` | `/api/v1/rag/chat` | Gửi `message`, `top_k`, `target_language`, `refine` sang RAG service. |
| `POST` | `/api/v1/rag/retrieve` | Gửi `query`, `top_k` sang RAG retrieve endpoint. |

## 🧠 Thiết kế nội bộ

- `routes.py`: FastAPI routes.
- `client.py`: HTTP client gọi `rag-service`.
- `schemas.py`: request/response schemas.

Flow:

```text
frontend chat message
  -> backend RAG route
  -> request validation
  -> RAG AI service
  -> answer + sources
  -> frontend
```

## 🔗 Dependencies

- `AI_RAG_SERVICE_URL`
- `AI_REFINEMENT_SERVICE_URL`
- `AI_SERVICE_TIMEOUT_SECONDS`
- Optional `AI_SERVICE_TOKEN`
- `ai-models/rag-service` là downstream dependency.

## ⚙️ Configuration

Biến backend liên quan:

- `AI_RAG_SERVICE_URL`
- `AI_REFINEMENT_SERVICE_URL`
- `AI_SERVICE_TIMEOUT_SECONDS`
- `AI_SERVICE_TOKEN`

## 🚀 Ví dụ sử dụng

```bash
curl -X POST http://localhost:8000/api/v1/rag/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Suggest me natural vibe coffees at Thu Duc","top_k":3,"target_language":"en","refine":true}'
```

## 🧪 Testing

```bash
cd backend
uv run pytest -q tests/test_ai_service_contracts.py
```

Manual smoke: hỏi chatbot bằng Vietnamese và English, kiểm tra answer language, sources và fallback message.

## 🧱 Extension guide

Thêm option request mới:

1. Cập nhật `schemas.py`.
2. Cập nhật `client.py` để forward field xuống RAG service.
3. Cập nhật RAG service schema.
4. Cập nhật frontend API client nếu option là user-facing.

## ⚠️ Gotchas

- RAG service chỉ trả lời tốt trong phạm vi `chroma_db/` đã build.
- `target_language` cần được frontend truyền đúng để answer không bị hardcoded Vietnamese.
- Saved chat history nằm ở feature `chat`, không nằm ở `rag_chat`.
