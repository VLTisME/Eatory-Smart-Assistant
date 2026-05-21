# Menu Translation Service

`menu-translation-service` là FastAPI service độc lập cho tính năng dịch menu từ ảnh. Backend nhận request public từ frontend, validate upload, rồi proxy sang service này. Toàn bộ OCR provider, OpenAI vision/refinement và prompt menu nằm trong service này.

## Chức năng

- Nhận ảnh menu từ multipart upload.
- Chạy OCR bằng OpenAI vision hoặc EasyOCR.
- Chuẩn hóa text OCR nhiễu thành JSON có cấu trúc.
- Trả thông tin nhà hàng, danh mục, món ăn, giá, mô tả và ngôn ngữ đích.
- Hỗ trợ `target_language` để frontend quyết định output menu là tiếng Việt hoặc tiếng Anh.

Với UX hiện tại, menu translation dùng ngôn ngữ ngược với UI:

- UI tiếng Việt -> output menu tiếng Anh.
- UI tiếng Anh -> output menu tiếng Việt.

## Endpoint

| Method | Path | Mô tả |
| --- | --- | --- |
| `GET` | `/health` | Kiểm tra service còn sống. |
| `POST` | `/v1/menu/ocr` | Nhận multipart field `file`, trả raw OCR text và metadata ảnh. |
| `POST` | `/v1/menu/structured` | Nhận multipart field `file`, trả menu JSON có cấu trúc. Hỗ trợ query `restaurant_name` và `target_language`. |

Nếu `SERVICE_TOKEN` được cấu hình, caller phải gửi:

```http
Authorization: Bearer <token>
```

## Cấu trúc

```text
menu-translation-service/
|-- app/
|   |-- main.py          # Ứng dụng FastAPI
|   |-- routes.py        # OCR và structured endpoints
|   |-- schemas.py       # Request/response schema
|   |-- service.py       # Luồng OCR -> structured output
|   |-- ocr.py           # Lớp trừu tượng cho OCR provider
|   |-- prompts.py       # Prompt menu
|   `-- config.py        # Cấu hình môi trường
|-- tests/
|-- requirements.txt
|-- requirements-dev.txt
|-- Dockerfile
`-- .env.example
```

## Biến môi trường

Tạo `.env`:

```bash
cd ai-models/menu-translation-service
cp .env.example .env
```

Các biến quan trọng:

- `OPENAI_API_KEY`: cần cho OpenAI OCR/refinement flow.
- `OCR_PROVIDER`: `openai` hoặc `easyocr`.
- `OCR_LANGUAGES`: danh sách ngôn ngữ OCR khi dùng EasyOCR.
- `OCR_GPU`: bật/tắt GPU cho EasyOCR.
- `OCR_OPENAI_MODEL`: model vision OCR.
- `OPENAI_REFINE_MODEL`: model refine/structured output.
- `MENU_REFINE_MAX_CHARS`: giới hạn text OCR đưa vào prompt.
- `SERVICE_TOKEN`: token nội bộ nếu muốn bảo vệ service.

## Chạy local

```bash
cd ai-models/menu-translation-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload --host localhost --port 8101
```

Swagger:

```text
http://localhost:8101/docs
```

## Tích hợp backend

Public routes ở backend:

- `POST /api/v1/menu-translation/ocr`
- `POST /api/v1/menu-translation/ocr/structured`

Backend gọi service qua:

```env
AI_MENU_SERVICE_URL="http://localhost:8101"
AI_SERVICE_TOKEN=""
AI_SERVICE_TIMEOUT_SECONDS=180
```

Frontend không gọi trực tiếp service này.

## Kiểm thử

```bash
cd ai-models/menu-translation-service
python -m pytest -q
```

Kiểm tra nhanh OCR structured:

```bash
curl -X POST "http://localhost:8101/v1/menu/structured?target_language=en" \
  -F "file=@/path/to/menu.jpg"
```

## Lỗi thường gặp

- Thiếu `OPENAI_API_KEY`: OpenAI OCR/refinement sẽ lỗi.
- Dùng `OCR_PROVIDER=easyocr` lần đầu: dependency/model có thể tải lâu.
- `SERVICE_TOKEN` không khớp với backend: backend sẽ nhận lỗi unauthorized từ AI service.
