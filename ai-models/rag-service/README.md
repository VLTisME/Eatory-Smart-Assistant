# RAG Service

`rag-service` sở hữu chatbot gợi ý địa điểm theo dữ liệu review, vector retrieval, sinh câu trả lời bằng OpenAI và shared refinement endpoint. Backend giữ public API ổn định ở `/api/v1/rag/...` và `/api/v1/llm/refine`, sau đó gọi service này qua HTTP.

## Chức năng

- Build document cho RAG từ review-summary output.
- Build và query Chroma vector database.
- Retrieve địa điểm liên quan đến query của người dùng.
- Sinh câu trả lời tự nhiên bằng OpenAI.
- Hỗ trợ `target_language` để trả lời bằng tiếng Việt hoặc tiếng Anh.
- Cung cấp endpoint refinement dùng chung cho các feature cần làm sạch/chuyển ngữ nội dung.

## Endpoint

| Method | Path | Mô tả |
| --- | --- | --- |
| `GET` | `/health` | Kiểm tra service còn sống. |
| `POST` | `/v1/rag/retrieve` | Vector search, trả source places, không sinh answer dài. |
| `POST` | `/v1/rag/chat` | Retrieve + generate answer. Hỗ trợ `target_language`, `top_k`, `refine`. |
| `POST` | `/v1/refinement/refine` | Refine/chuyển ngữ nội dung dùng chung. |

Ví dụ body chat:

```json
{
  "message": "Suggest me natural vibe coffees at Thu Duc",
  "top_k": 5,
  "target_language": "en",
  "refine": true
}
```

Nếu `SERVICE_TOKEN` được cấu hình, caller phải gửi `Authorization: Bearer <token>`.

## Cấu trúc

```text
rag-service/
|-- app/
|   |-- main.py          # Ứng dụng FastAPI
|   |-- routes.py        # RAG và refinement endpoints
|   |-- schemas.py       # Request/response schema
|   |-- rag_engine.py    # Chroma retrieval và OpenAI generation
|   |-- service.py       # Điều phối luồng RAG
|   |-- refinement.py    # HTTP client refinement dùng chung
|   |-- prompts.py       # RAG/refinement prompts
|   `-- config.py        # Cấu hình môi trường
|-- build_documents.py   # Sinh rag_documents.json
|-- build_vector_db.py   # Sinh chroma_db/
|-- query_rag.py         # Công cụ kiểm tra nhanh qua CLI
|-- rules.py             # Rule-based signal extraction khi build documents
|-- tests/
|-- requirements.txt
|-- requirements-dev.txt
|-- Dockerfile
|-- rag_documents.json   # Artifact được sinh
`-- chroma_db/           # Artifact vector DB được sinh
```

## Biến môi trường

Tạo `.env`:

```bash
cd ai-models/rag-service
cp .env.example .env
```

Các biến quan trọng:

- `OPENAI_API_KEY`: cần cho generation/refinement.
- `OPENAI_MODEL`: model sinh câu trả lời RAG.
- `OPENAI_REFINE_MODEL`: model refinement.
- `RAG_CHROMA_DIR`: đường dẫn Chroma DB, mặc định `chroma_db`.
- `RAG_COLLECTION_NAME`: tên collection.
- `RAG_EMBEDDING_MODEL`: model embedding cho Chroma.
- `RAG_EMBEDDING_DEVICE`: `cpu`, `cuda` hoặc cấu hình tương ứng.
- `RAG_NO_RESULTS_MESSAGE`: fallback khi retrieve không có nguồn phù hợp.
- `HF_TOKEN`, `HF_HUB_DISABLE_XET`: dùng khi embedding model cần tải từ Hugging Face.
- `SERVICE_TOKEN`: token nội bộ nếu muốn bảo vệ service.

## Chạy local

```bash
cd ai-models/rag-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload --host localhost --port 8103
```

Swagger:

```text
http://localhost:8103/docs
```

## Build artifact RAG

Build documents:

```bash
cd ai-models/rag-service
python build_documents.py
```

Input lookup order:

- `ai-models/rag-service/review_summaries_with_text.json`
- fallback: `ai-models/review-summary-service/offline/data/output/review_summaries_with_text.json`

Output:

- `ai-models/rag-service/rag_documents.json`

Build vector DB:

```bash
python build_vector_db.py
```

Output:

- `ai-models/rag-service/chroma_db/`

## Tích hợp backend

Public routes ở backend:

- `POST /api/v1/rag/chat`
- `POST /api/v1/rag/retrieve`
- `POST /api/v1/llm/refine`

Backend gọi service qua:

```env
AI_RAG_SERVICE_URL="http://localhost:8103"
AI_REFINEMENT_SERVICE_URL="http://localhost:8103"
AI_SERVICE_TOKEN=""
AI_SERVICE_TIMEOUT_SECONDS=180
```

Frontend truyền `target_language` cho RAG thông qua backend để câu trả lời bám theo ngôn ngữ UI.

## Kiểm tra nhanh

Retrieve:

```bash
curl -X POST http://localhost:8103/v1/rag/retrieve \
  -H "Content-Type: application/json" \
  -d '{"query":"quan ca phe yen tinh quan 1","top_k":3}'
```

Chat:

```bash
curl -X POST http://localhost:8103/v1/rag/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Suggest me natural vibe coffees at Thu Duc","top_k":3,"target_language":"en"}'
```

Refinement:

```bash
curl -X POST http://localhost:8103/v1/refinement/refine \
  -H "Content-Type: application/json" \
  -d '{"content":"Pho bo 50000 VND","context":"generic","source_language":"vi","target_language":"en"}'
```

## Kiểm thử

```bash
cd ai-models/rag-service
python -m pytest -q
```

## Lỗi thường gặp

- Thiếu `chroma_db/`: retrieve không có nguồn hoặc service báo artifact chưa sẵn sàng.
- Query ngoài phạm vi dữ liệu: service có thể trả câu trả lời fallback thay vì gợi ý chính xác.
- Thiếu `OPENAI_API_KEY`: chat/refinement lỗi, retrieve vẫn có thể chạy nếu vector DB và embedding model sẵn sàng.
