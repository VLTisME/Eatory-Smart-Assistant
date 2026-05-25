# Menu Translation Service

## 🎯 Mục đích

`menu-translation-service` là FastAPI service xử lý ảnh menu. Service này sở hữu OCR, prompt structuring và output contract cho menu JSON.

## 🧩 Trách nhiệm

- Nhận ảnh menu từ backend dưới dạng multipart upload.
- Validate content type và dung lượng ảnh.
- Chạy OCR bằng OpenAI vision hoặc EasyOCR.
- Chuyển OCR text thành cấu trúc `restaurantInfo` và `categories`.
- Dịch tên món/mô tả theo `target_language`.
- Trả JSON ổn định cho backend/frontend.

Runtime xử lý ảnh trong request hiện tại và trả response JSON cho backend.

## 🔌 Public API

| Method | Path | Mô tả |
| --- | --- | --- |
| `GET` | `/health` | Health check. |
| `POST` | `/v1/menu/ocr` | Nhận field `file`, trả raw OCR text và metadata ảnh. |
| `POST` | `/v1/menu/structured` | Nhận field `file`, query `restaurant_name`, `target_language`, trả menu JSON có cấu trúc. |

Swagger:

```text
http://localhost:8101/docs
```

## 🧠 Cấu trúc

```text
menu-translation-service/
|-- app/
|   |-- main.py            # FastAPI app
|   |-- routes.py          # HTTP routes
|   |-- schemas.py         # Request/response models
|   |-- config.py          # Env config
|   |-- image_upload.py    # Upload validation
|   |-- ocr_engine.py      # OCR provider abstraction
|   |-- menu_pipeline.py   # OCR -> refinement -> structured response
|   |-- refinement.py      # OpenAI structured extraction
|   `-- prompts.py         # Menu prompts
|-- tests/
|-- requirements.txt
|-- requirements-dev.txt
|-- requirements-easyocr.txt
|-- Dockerfile
|-- menu_translation.png
`-- .env.example
```

Pipeline:

![Menu translation pipeline](menu_translation.png)

```text
backend multipart upload
  -> /v1/menu/structured
  -> image validation
  -> OCR provider
  -> OpenAI menu structuring
  -> structured menu JSON
```

Menu translation dùng ngôn ngữ đối ứng với UI do frontend/backend truyền xuống:

- UI `vi` -> `target_language=en`
- UI `en` -> `target_language=vi`

## 🔗 Dependencies

- FastAPI, Pydantic, Uvicorn.
- Pillow và `python-multipart` cho upload ảnh.
- OpenAI cho OCR provider `openai` và menu structuring.
- EasyOCR optional qua `requirements-easyocr.txt`.
- Backend là consumer duy nhất ở runtime.

## ⚙️ Configuration

Tạo `.env`:

```bash
cd ai-models/menu-translation-service
cp .env.example .env
```

Biến chính:

- `SERVICE_HOST`, `SERVICE_PORT`, `CORS_ALLOW_ORIGINS`
- `SERVICE_TOKEN`
- `MAX_UPLOAD_SIZE_MB`
- `OCR_PROVIDER`
- `OCR_LANGUAGES`
- `OCR_GPU`
- `OCR_OPENAI_MODEL`
- `MENU_REFINE_MAX_CHARS`
- `OPENAI_API_KEY`
- `OPENAI_REFINE_MODEL`

`OCR_PROVIDER=openai` là default trong Docker Compose. Nếu dùng EasyOCR, cài thêm `requirements-easyocr.txt`.

## 🚀 Ví dụ sử dụng

Chạy local:

```bash
cd ai-models/menu-translation-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --host localhost --port 8101
```

Gọi structured endpoint:

```bash
curl -X POST "http://localhost:8101/v1/menu/structured?target_language=en&restaurant_name=Demo" \
  -F "file=@/path/to/menu.jpg"
```

## 🧪 Testing

```bash
cd ai-models/menu-translation-service
python -m pytest -q
python -m compileall -q app
```

Test hiện tại tập trung vào API contract và behavior khi dependency AI được mock.

## 🧱 Extension guide

Thêm OCR provider mới:

1. Mở rộng provider selection trong `app/ocr_engine.py`.
2. Thêm env vars cần thiết vào `app/config.py` và `.env.example`.
3. Giữ output OCR text ổn định cho `menu_pipeline.py`.
4. Thêm test API/pipeline cho provider mới bằng mock.

Thêm field menu mới:

1. Cập nhật schema trong `app/schemas.py`.
2. Cập nhật prompt trong `app/prompts.py`.
3. Đảm bảo backend/frontend contract vẫn backward-compatible nếu field là optional.

## ⚠️ Lưu ý

- Ảnh menu mờ, nghiêng hoặc quá nhiều font có thể làm OCR thiếu món/giá.
- OpenAI OCR và OpenAI structuring đều cần `OPENAI_API_KEY`.
- `target_language` dùng `vi` hoặc `en`; frontend truyền ngôn ngữ đối ứng với UI.
- EasyOCR có dependency nặng hơn và có thể cần cấu hình GPU/CPU riêng.
