# Backend Place Search Feature

## 🎯 Mục đích

Feature này cung cấp public API tìm địa điểm bằng ảnh cho frontend. Backend sở hữu upload validation và API contract; CLIP embedding, similarity search và refinement thuộc `ai-models/place-search-service`.

## 🧩 Trách nhiệm

- Nhận ảnh upload từ frontend.
- Truyền `target_language` sang AI service.
- Map response địa điểm tương tự về frontend.
- Map lỗi timeout/unavailable từ AI service.

## 🔌 Public API

| Method | Path | Mô tả |
| --- | --- | --- |
| `POST` | `/api/v1/place-search` | Proxy ảnh và `target_language` sang place-search AI service. |

## 🧠 Thiết kế nội bộ

- `routes.py`: FastAPI route.
- `client.py`: HTTP client gọi `place-search-service`.
- `schemas.py`: response schemas cho contract frontend.

Flow:

```text
frontend image upload
  -> backend route
  -> upload validation
  -> place-search AI service
  -> result/error mapping
  -> frontend
```

## 🔗 Dependencies

- `backend/app/shared/image_upload.py`.
- `backend/app/clients/ai_services.py`.
- `AI_PLACE_SEARCH_SERVICE_URL` và optional `AI_SERVICE_TOKEN`.
- `ai-models/place-search-service` là downstream dependency.

## ⚙️ Configuration

Biến backend liên quan:

- `AI_PLACE_SEARCH_SERVICE_URL`
- `AI_SERVICE_TIMEOUT_SECONDS`
- `AI_SERVICE_TOKEN`
- `MAX_UPLOAD_SIZE_MB`

## 🚀 Ví dụ sử dụng

```bash
curl -X POST "http://localhost:8000/api/v1/place-search?target_language=vi" \
  -F "file=@/path/to/food.jpg"
```

## 🧪 Testing

```bash
cd backend
uv run pytest -q tests/test_place_search_api.py
uv run pytest -q tests/test_ai_service_contracts.py
```

Manual smoke: chạy backend + `place-search-service`, upload ảnh thật từ frontend.

## 🧱 Extension guide

Nếu AI service đổi result schema:

1. Cập nhật `schemas.py`.
2. Cập nhật `client.py` để map lỗi/empty results.
3. Cập nhật frontend nếu field mới được hiển thị.
4. Test cả ảnh có kết quả và ảnh nhiễu/không liên quan.

## ⚠️ Gotchas

- Place search service có thể khởi động lâu khi lần đầu tải CLIP model.
- Backend timeout phải đủ dài cho inference ảnh.
- Empty results là trạng thái hợp lệ và cần message rõ ở frontend.
