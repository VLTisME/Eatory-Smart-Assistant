# Backend

## 🎯 Mục đích

`backend/` là FastAPI public API của Eatory Smart Assistant. Module này sở hữu API contract cho frontend, auth, tích hợp dữ liệu và HTTP clients gọi AI services. AI runtime nằm trong `ai-models/`.

## 🧩 Trách nhiệm

- Cung cấp routes public dưới `/api/v1`.
- Xác thực Firebase token cho các luồng cần user context.
- Lưu/đọc chat history bằng Firestore.
- Đọc địa điểm, ảnh và review từ Supabase.
- Proxy Goong autocomplete, place detail và directions.
- Tạo ImageKit upload auth signature.
- Validate upload/request trước khi gọi AI services.
- Chuẩn hóa response/error từ AI services cho frontend.

## 🔌 Public API

Health và metadata:

- `GET /`
- `GET /health`
- `GET /api/v1/info`

AI features:

- `POST /api/v1/menu-translation/ocr`
- `POST /api/v1/menu-translation/ocr/structured`
- `POST /api/v1/place-search`
- `POST /api/v1/rag/chat`
- `POST /api/v1/rag/retrieve`
- `GET /api/v1/review-summary`
- `GET /api/v1/review-summary/samples`

Places, directions và media:

- `GET /api/v1/places/autocomplete`
- `GET /api/v1/places/detail`
- `GET /api/v1/directions`
- `GET /api/v1/place-details`
- `GET /api/v1/place-details/by-city`
- `GET /api/v1/place-details/check-place`
- `GET /api/v1/place-images/single`
- `GET /api/v1/place-images`
- `GET /api/v1/place-images/random`

Chat history, uploads và ImageKit:

- `GET /api/v1/chat/conversations/`
- `POST /api/v1/chat/conversations/`
- `GET /api/v1/chat/conversations/{id}/`
- `POST /api/v1/chat/conversations/{id}/messages/`
- `DELETE /api/v1/chat/conversations/{id}/`
- `POST /api/v1/uploads/image`
- `GET /api/v1/imagekit/auth`

Swagger khi chạy local:

```text
http://localhost:8000/docs
```

## 🧠 Cấu trúc

```text
backend/
|-- app/
|   |-- main.py                 # FastAPI app, middleware, health
|   |-- api/router.py           # include feature routers
|   |-- core/                   # config, Firebase, Supabase, auth
|   |-- clients/ai_services.py  # base HTTP client helpers
|   |-- shared/                 # schemas, upload validation, refinement client
|   `-- features/
|       |-- chat/
|       |-- directions/
|       |-- imagekit/
|       |-- menu_translation/
|       |-- place_details/
|       |-- place_images/
|       |-- place_search/
|       |-- places/
|       |-- rag_chat/
|       `-- review_summary/
|-- tests/
|-- requirements.txt
|-- requirements-dev.txt
|-- pyproject.toml
`-- .env.example
```

Request flow chính:

```text
frontend
  -> backend route
  -> auth/config/upload validation
  -> Supabase/Firebase/Goong/ImageKit hoặc AI service client
  -> normalized response
  -> frontend
```

Các feature lớn có README riêng trong `app/features/*/README.md`.

## 🔗 Dependencies

Backend phụ thuộc vào:

- FastAPI, Pydantic, Uvicorn, HTTPX.
- Firebase Admin SDK.
- Supabase Python client.
- Pillow và `python-multipart` cho upload ảnh.
- Goong REST APIs.
- ImageKit API.
- Internal AI services:
  - `menu-translation-service`
  - `place-search-service`
  - `rag-service`
  - `review-summary-service`

Frontend là consumer chính của backend.

## ⚙️ Configuration

Tạo `.env`:

```bash
cd backend
cp .env.example .env
```

Nhóm biến chính:

- App/API: `APP_NAME`, `APP_VERSION`, `API_PREFIX`, `SERVICE_HOST`, `SERVICE_PORT`, `CORS_ALLOW_ORIGINS`
- Upload: `MAX_UPLOAD_SIZE_MB`
- Firebase: `FIREBASE_SERVICE_ACCOUNT_PATH`
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- Goong: `REST_API_KEY`
- ImageKit: `KIT_URL_ENDPOINT`, `KIT_PUBLIC_KEY`, `KIT_PRIVATE_KEY`
- Review fallback: `REVIEW_SUMMARY_PATH`
- AI services: `AI_MENU_SERVICE_URL`, `AI_PLACE_SEARCH_SERVICE_URL`, `AI_RAG_SERVICE_URL`, `AI_REFINEMENT_SERVICE_URL`, `AI_REVIEW_SUMMARY_SERVICE_URL`, `AI_SERVICE_TIMEOUT_SECONDS`, `AI_SERVICE_TOKEN`

Trong Docker Compose, AI URLs dùng service names như `http://rag-service:8103`. Khi chạy thủ công ngoài Docker, dùng `http://localhost:<port>`.

## 🚀 Ví dụ sử dụng

Chạy local:

```bash
cd backend
uv sync --extra dev
uv run uvicorn app.main:app --reload --host localhost --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

RAG chat qua backend:

```bash
curl -X POST http://localhost:8000/api/v1/rag/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Suggest me sushi places in HCMC","top_k":3,"target_language":"en"}'
```

## 🧪 Testing

```bash
cd backend
uv sync --extra dev
uv run pytest -q
```

Test theo nhóm:

```bash
uv run pytest -q tests/test_ai_service_contracts.py
uv run pytest -q tests/test_place_search_api.py
uv run pytest -q tests/test_review_summary_api.py
```

Compile check:

```bash
python -m compileall -q app
```

## 🧱 Extension guide

Thêm feature backend mới:

1. Tạo folder trong `app/features/<feature_name>/`.
2. Tách `routes.py`, `schemas.py`, `service.py` hoặc `client.py` theo đúng vai trò.
3. Include router trong `app/api/router.py`.
4. Thêm env vars vào `app/core/config.py` và `.env.example` nếu cần.
5. Viết test cho API contract hoặc service logic.
6. Cập nhật README của backend và feature.

Nếu feature gọi AI service mới, backend chỉ giữ HTTP client/contract mapping; model logic vẫn nằm trong `ai-models/`.

