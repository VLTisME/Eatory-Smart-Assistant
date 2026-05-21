# Backend

`backend/` là public FastAPI API cho frontend. Backend điều phối workflow sản phẩm, xác thực user, đọc/ghi dữ liệu ứng dụng và gọi các AI service nội bộ qua HTTP.

Backend không còn là nơi load model, prompt AI nặng, embedding search hoặc OCR engine.

## Trách nhiệm

Backend sở hữu:

- Public routes dưới `/api/v1/...` cho frontend.
- Firebase token verification.
- Firestore chat/conversation persistence.
- Supabase reads cho địa điểm, ảnh, review và summary data.
- Goong autocomplete, place detail và directions proxy.
- ImageKit upload auth signature.
- Request validation, response shaping và error mapping.
- HTTP clients gọi các AI service nội bộ.

Backend không sở hữu:

- OCR provider hoặc EasyOCR/OpenAI vision flow.
- Torch/Transformers/CLIP model loading.
- Chroma/vector search.
- Prompt RAG, prompt menu, prompt review summary.
- Artifact AI như embeddings, indexes hoặc vector DB.

## Cấu trúc

```text
backend/
|-- app/
|   |-- main.py
|   |-- api/
|   |   |-- router.py
|   |   `-- shared_routes.py
|   |-- clients/
|   |   `-- ai_services.py
|   |-- core/
|   |   |-- auth.py
|   |   |-- config.py
|   |   |-- firebase.py
|   |   `-- supabase.py
|   |-- shared/
|   |   |-- image_upload.py
|   |   |-- refinement.py
|   |   `-- schemas.py
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

## Endpoint public

### Health và metadata

- `GET /`
- `GET /health`
- `GET /api/v1/info`

### Upload và refinement chung

- `POST /api/v1/uploads/image`
- `POST /api/v1/llm/refine`

`/api/v1/llm/refine` proxy sang `AI_REFINEMENT_SERVICE_URL`, mặc định là `rag-service`.

### Dịch menu

- `POST /api/v1/menu-translation/ocr`
- `POST /api/v1/menu-translation/ocr/structured`

Backend validate ảnh upload và proxy sang `AI_MENU_SERVICE_URL`.

### Tìm địa điểm bằng ảnh

- `POST /api/v1/place-search`

Backend validate ảnh upload và proxy sang `AI_PLACE_SEARCH_SERVICE_URL`.

### RAG chatbot

- `POST /api/v1/rag/chat`
- `POST /api/v1/rag/retrieve`

Backend chuyển `target_language` từ frontend sang RAG service để output bám theo ngôn ngữ UI.

### Places và directions

- `GET /api/v1/places/autocomplete`
- `GET /api/v1/places/detail`
- `GET /api/v1/directions`

Các route này là third-party API proxy do backend sở hữu.

### Place data, images và review summary

- `GET /api/v1/place-details`
- `GET /api/v1/place-details/by-city`
- `GET /api/v1/place-details/check-place`
- `GET /api/v1/place-images/single`
- `GET /api/v1/place-images`
- `GET /api/v1/place-images/random`
- `GET /api/v1/review-summary`
- `GET /api/v1/review-summary/samples`

Review summary route đọc dữ liệu từ Supabase, sau đó gọi `AI_REVIEW_SUMMARY_SERVICE_URL` khi cần generate/translate bằng LLM.

### Chat history và ImageKit

- `GET /api/v1/chat/conversations/`
- `POST /api/v1/chat/conversations/`
- `GET /api/v1/chat/conversations/{id}/`
- `POST /api/v1/chat/conversations/{id}/messages/`
- `DELETE /api/v1/chat/conversations/{id}/`
- `GET /api/v1/imagekit/auth`

Các route này cần Firebase authentication.

## Biến môi trường

Tạo `.env`:

```bash
cd backend
cp .env.example .env
```

Biến quan trọng:

- `FIREBASE_SERVICE_ACCOUNT_PATH`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `REST_API_KEY`
- `KIT_URL_ENDPOINT`
- `KIT_PUBLIC_KEY`
- `KIT_PRIVATE_KEY`
- `REVIEW_SUMMARY_PATH`
- `AI_MENU_SERVICE_URL`
- `AI_PLACE_SEARCH_SERVICE_URL`
- `AI_RAG_SERVICE_URL`
- `AI_REFINEMENT_SERVICE_URL`
- `AI_REVIEW_SUMMARY_SERVICE_URL`
- `AI_SERVICE_TIMEOUT_SECONDS`
- `AI_SERVICE_TOKEN`

`REVIEW_SUMMARY_PATH` hiện trỏ tới:

```text
../ai-models/review-summary-service/offline/data/output/review_summaries.json
```

## Chạy local

```bash
cd backend
uv sync --extra dev
uv run uvicorn app.main:app --reload --host localhost --port 8000
```

Swagger:

```text
http://localhost:8000/docs
```

Nếu chạy riêng backend, hãy đảm bảo các AI service liên quan cũng đang chạy ở port tương ứng hoặc cấu hình URL trong `backend/.env`.

## Kiểm thử

```bash
cd backend
uv run pytest -q
```

Test theo feature:

```bash
uv run pytest -q tests/test_place_search_api.py
uv run pytest -q tests/test_review_summary_api.py
uv run pytest -q tests/test_ai_service_contracts.py
```

Kiểm tra syntax nhanh:

```bash
python -m compileall -q app
```

## Ghi chú refactor

- Runtime dependency ở `requirements.txt`.
- Test/tooling dependency ở `requirements-dev.txt` và optional group `dev` trong `pyproject.toml`.
- Backend chỉ giữ AI service URLs/token, không giữ model runtime settings.
- Các README trong `app/features/*/` mô tả rõ ranh giới proxy của từng feature đã tách sang AI service.
