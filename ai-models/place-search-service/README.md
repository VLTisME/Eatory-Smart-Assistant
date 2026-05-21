# Place Search Service

`place-search-service` là FastAPI service cho tính năng tìm địa điểm bằng ảnh. Service này load CLIP model, đọc embedding artifacts cục bộ, phát hiện ảnh nhiễu và trả danh sách địa điểm phù hợp cho backend.

Backend giữ route public `/api/v1/place-search`; frontend không gọi service này trực tiếp.

## Chức năng

- Validate ảnh upload.
- Load CLIP image model.
- Đọc embedding/index/noise artifact từ root `data/`.
- Tính similarity giữa ảnh người dùng và ảnh địa điểm.
- Gộp kết quả theo `place_id`.
- Lấy tên/địa chỉ từ Supabase, fallback về `data/places.json`.
- Refine output bằng OpenAI nếu được bật.
- Hỗ trợ `target_language` để nội dung refine theo tiếng Việt hoặc tiếng Anh.

## Endpoint

| Method | Path | Mô tả |
| --- | --- | --- |
| `GET` | `/health` | Kiểm tra service còn sống và artifact/model readiness. |
| `POST` | `/v1/place-search/by-image` | Nhận multipart field `file`, trả `results` theo contract của backend/frontend. Hỗ trợ query `target_language`. |

Nếu `SERVICE_TOKEN` được cấu hình, caller phải gửi:

```http
Authorization: Bearer <token>
```

## Cấu trúc

```text
place-search-service/
|-- app/
|   |-- main.py          # Ứng dụng FastAPI
|   |-- routes.py        # Place-search endpoint
|   |-- schemas.py       # Request/response schema
|   |-- service.py       # Orchestration: image -> embedding -> results
|   |-- embeddings.py    # Artifact loading và similarity search
|   |-- refinement.py    # Refine bằng OpenAI nếu bật
|   |-- prompts.py       # Prompt refine kết quả
|   `-- config.py        # Cấu hình môi trường
|-- research/
|   `-- clip_pipeline.ipynb
|-- tests/
|-- requirements.txt
|-- requirements-dev.txt
|-- Dockerfile
`-- .env.example
```

## Artifact bắt buộc

Phase hiện tại vẫn giữ artifact runtime ở root `data/` để tránh thay đổi Docker/runtime path:

```text
data/
|-- image_embeddings.npy
|-- image_index.json
|-- places.json
|-- noise_embeddings.npy
`-- noise_index.json
```

Biến đường dẫn mặc định:

```env
PLACE_SEARCH_EMBEDDINGS_PATH="data/image_embeddings.npy"
PLACE_SEARCH_INDEX_PATH="data/image_index.json"
PLACE_SEARCH_PLACES_PATH="data/places.json"
PLACE_SEARCH_NOISE_EMBEDDINGS_PATH="data/noise_embeddings.npy"
PLACE_SEARCH_NOISE_INDEX_PATH="data/noise_index.json"
```

Các path này được resolve từ root repo trước, sau đó từ service folder. Nếu thiếu artifact, service có thể start lỗi hoặc trả kết quả rỗng.

## Biến môi trường

Tạo `.env`:

```bash
cd ai-models/place-search-service
cp .env.example .env
```

Các biến quan trọng:

- `PLACE_SEARCH_MODEL_NAME`: CLIP model.
- `PLACE_SEARCH_TOP_K`: số kết quả nội bộ.
- `PLACE_SEARCH_MIN_SIMILARITY`: ngưỡng similarity.
- `PLACE_SEARCH_NOISE_THRESHOLD`: ngưỡng phát hiện ảnh nhiễu.
- `PLACE_SEARCH_DEVICE`: `cpu`, `cuda` hoặc cấu hình tương ứng.
- `HF_TOKEN`, `HF_HUB_DISABLE_XET`: phục vụ tải model Hugging Face nếu cần.
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`: dùng để enrich địa điểm.
- `OPENAI_API_KEY`, `OPENAI_REFINE_MODEL`: dùng cho refine output.
- `SERVICE_TOKEN`: token nội bộ nếu muốn bảo vệ service.

## Chạy local

```bash
cd ai-models/place-search-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload --host localhost --port 8102
```

Lần chạy đầu có thể lâu vì CLIP model cần được tải/cache.

Swagger:

```text
http://localhost:8102/docs
```

## Tích hợp backend

Public route ở backend:

- `POST /api/v1/place-search`

Backend gọi service qua:

```env
AI_PLACE_SEARCH_SERVICE_URL="http://localhost:8102"
AI_SERVICE_TOKEN=""
AI_SERVICE_TIMEOUT_SECONDS=180
```

## Nghiên cứu

Notebook nghiên cứu/prototype nằm ở `research/`. Thư mục này không thuộc runtime FastAPI service và được loại khỏi Docker image. Không đưa notebook hoặc checkpoint nghiên cứu vào luồng request production.

## Kiểm thử

```bash
cd ai-models/place-search-service
python -m pytest -q
```

Kiểm tra nhanh:

```bash
curl -X POST "http://localhost:8102/v1/place-search/by-image?target_language=vi" \
  -F "file=@/path/to/place-image.jpg"
```

## Lỗi thường gặp

- Cache Hugging Face không tăng hoặc tải model đứng lâu: kiểm tra mạng, `HF_TOKEN`, `HF_HUB_DISABLE_XET` và volume cache trong Docker.
- Thiếu root `data/`: service không có embedding/index để search.
- Supabase key thiếu: service vẫn có thể fallback một phần qua `places.json`, nhưng enrichment có thể kém hơn.
