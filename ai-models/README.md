# AI Models

## 🎯 Mục đích

`ai-models/` chứa các AI services của Eatory Smart Assistant: OCR/LLM prompts, CLIP image search, RAG retrieval/generation, refinement dùng chung và review summary generation. Backend sử dụng các service này qua HTTP.

## 🔌 Public API

Các service nội bộ và port mặc định:

| Service | Port | API chính |
| --- | --- | --- |
| `menu-translation-service` | `8101` | `/v1/menu/ocr`, `/v1/menu/structured` |
| `place-search-service` | `8102` | `/v1/place-search/by-image` |
| `rag-service` | `8103` | `/v1/rag/chat`, `/v1/rag/retrieve`, `/v1/refinement/refine` |
| `review-summary-service` | `8104` | `/v1/review-summary/generate`, `/v1/review-summary/translate` |

Mỗi service cũng có:

- `GET /health`
- Swagger tại `http://localhost:<port>/docs` khi chạy local.

## 🧠 Cấu trúc

```text
ai-models/
|-- menu-translation-service/
|   |-- app/
|   `-- menu_translation.png
|-- place-search-service/
|   |-- app/
|   |-- research/
|   `-- place_search.png
|-- rag-service/
|   |-- app/
|   |-- build_documents.py
|   |-- build_vector_db.py
|   |-- rag_pipeline.png
|   |-- rag_documents.json
|   `-- chroma_db/
`-- review-summary-service/
    |-- app/
    `-- offline/
```

Runtime flow:

```text
backend AI client
  -> FastAPI AI service
  -> model/artifact/OpenAI call
  -> typed JSON response
  -> backend response mapping
```

Artifact flow:

```text
data-engineering hoặc offline scripts
  -> JSON/embedding/vector artifacts
  -> AI service runtime
```

Mỗi service giữ cấu trúc `app/main.py`, `app/routes.py`, `app/schemas.py`, `app/config.py` để runtime, env vars và dependency nằm cùng module.

## 🔗 Dependencies

AI services phụ thuộc vào:

- FastAPI, Pydantic, Uvicorn cho service API.
- OpenAI cho menu structuring, RAG generation/refinement và review summary.
- Hugging Face model downloads/cache cho CLIP và embedding model.
- ChromaDB cho RAG vector store.
- Supabase optional enrichment cho place search.
- Root `data/` artifacts cho place search.
- Review summary offline output cho RAG document build.

Backend là consumer runtime chính của các AI services.

## ⚙️ Configuration

Mỗi service có `.env.example` riêng:

```bash
cp ai-models/menu-translation-service/.env.example ai-models/menu-translation-service/.env
cp ai-models/place-search-service/.env.example ai-models/place-search-service/.env
cp ai-models/rag-service/.env.example ai-models/rag-service/.env
cp ai-models/review-summary-service/.env.example ai-models/review-summary-service/.env
```

Arguments:

- App/service: `SERVICE_HOST`, `SERVICE_PORT`, `CORS_ALLOW_ORIGINS`, `SERVICE_TOKEN`
- OpenAI: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_REFINE_MODEL`
- Hugging Face: `HF_TOKEN`, `HF_HUB_DISABLE_XET`
- Artifact paths: `PLACE_SEARCH_*`, `RAG_CHROMA_DIR`, `RAG_COLLECTION_NAME`

Nếu service đặt `SERVICE_TOKEN`, backend phải đặt `AI_SERVICE_TOKEN` trùng giá trị.

## 🚀 Ví dụ

Chạy một service, ví dụ RAG:

```bash
cd ai-models/rag-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload --host localhost --port 8103
```

Health check:

```bash
curl http://localhost:8103/health
```

## 🧪 Testing

```bash
cd ai-models/menu-translation-service
python -m pytest -q
```

Áp dụng cùng pattern cho:

- `place-search-service`
- `rag-service`
- `review-summary-service`

Compile check tất cả AI apps:

```bash
python -m compileall -q ai-models/menu-translation-service/app ai-models/place-search-service/app ai-models/rag-service/app ai-models/review-summary-service/app
```

## 🧱 Extension guide

Thêm AI service mới:

1. Tạo folder `ai-models/<feature>-service/`.
2. Giữ layout `app/main.py`, `app/routes.py`, `app/schemas.py`, `app/config.py`.
3. Tạo `requirements.txt`, `requirements-dev.txt`, `Dockerfile`, `.env.example`.
4. Expose `GET /health` và API route versioned dưới `/v1`.
5. Thêm service vào `docker-compose.yml`.
6. Thêm backend feature client để frontend vẫn chỉ gọi backend.
7. Viết README cho service theo template module.

Chỉ tạo shared package cho utility/contract ổn định, ví dụ common response schemas hoặc auth token helpers.

## ⚠️ Lưu ý

- Lần đầu chạy place search/RAG có thể tải model lớn từ Hugging Face.
- Docker Compose dùng volume `huggingface_cache` để tránh tải lại model.
- Root `data/` hiện vẫn là nguồn artifact runtime cho place search.
- `rag-service/chroma_db/` phải khớp với `rag_documents.json` và embedding model.
- Frontend gọi backend; backend gọi AI services.

## 📚 README chi tiết

- [Menu translation service](menu-translation-service/README.md)
- [Place search service](place-search-service/README.md)
- [Place search research](place-search-service/research/README.md)
- [RAG service](rag-service/README.md)
- [Review summary service](review-summary-service/README.md)
- [Review summary offline pipeline](review-summary-service/offline/README.md)
