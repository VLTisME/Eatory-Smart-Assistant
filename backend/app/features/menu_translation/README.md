# Backend Menu Translation Feature

## 🎯 Mục đích

Feature này cung cấp public API dịch menu từ ảnh cho frontend. Backend sở hữu upload validation, public route và response mapping; AI OCR/LLM logic thuộc `ai-models/menu-translation-service`.

## 🧩 Trách nhiệm

- Nhận ảnh menu từ frontend.
- Chuyển `restaurant_name` và `target_language` sang AI service.
- Map lỗi AI service thành lỗi backend dễ hiểu.
- Giữ public API ổn định cho frontend.

## 🔌 Public API

| Method | Path | Mô tả |
| --- | --- | --- |
| `POST` | `/api/v1/menu-translation/ocr` | Proxy ảnh sang raw OCR endpoint của AI service. |
| `POST` | `/api/v1/menu-translation/ocr/structured` | Proxy ảnh, `restaurant_name` và `target_language` sang structured endpoint. |

## 🧠 Thiết kế nội bộ

- `routes.py`: FastAPI routes và request parsing.
- `client.py`: HTTP client gọi `menu-translation-service`.
- `schemas.py`: response schemas cho backend/frontend contract.

Flow:

```text
frontend upload
  -> backend route
  -> upload/request validation
  -> menu AI service
  -> normalized response
  -> frontend
```

## 🔗 Dependencies

- `backend/app/shared/image_upload.py` cho upload validation.
- `backend/app/clients/ai_services.py` cho HTTP client behavior chung.
- `AI_MENU_SERVICE_URL` và optional `AI_SERVICE_TOKEN`.
- `ai-models/menu-translation-service` là downstream dependency.

## ⚙️ Configuration

Biến backend liên quan:

- `AI_MENU_SERVICE_URL`
- `AI_SERVICE_TIMEOUT_SECONDS`
- `AI_SERVICE_TOKEN`
- `MAX_UPLOAD_SIZE_MB`

## 🚀 Ví dụ sử dụng

```bash
curl -X POST "http://localhost:8000/api/v1/menu-translation/ocr/structured?target_language=en" \
  -F "file=@/path/to/menu.jpg"
```

## 🧪 Testing

```bash
cd backend
uv run pytest -q tests/test_ai_service_contracts.py
```

Khi test thủ công, chạy backend và `menu-translation-service`, sau đó upload ảnh menu từ frontend.

## 🧱 Extension guide

Nếu AI service thêm field response:

1. Cập nhật `schemas.py`.
2. Cập nhật `client.py` nếu cần map field mới.
3. Giữ field optional nếu frontend cũ vẫn dùng contract cũ.
4. Cập nhật frontend rendering nếu field được hiển thị.

## ⚠️ Gotchas

- Menu translation output language là ngôn ngữ đối ứng với UI, nhưng backend chỉ nhận `target_language` đã được frontend tính.
- Upload quá lớn hoặc sai content type nên bị chặn trước khi gọi AI service.
- Khi AI service down, frontend sẽ thấy lỗi "Menu translation AI service is unavailable.".
