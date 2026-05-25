# Backend Review Summary Feature

## 🎯 Mục đích

Feature này cung cấp public API tổng quan đánh giá cho frontend. Backend sở hữu Supabase reads, fallback/cache behavior và API contract; LLM generate/translate thuộc `ai-models/review-summary-service`.

## 🧩 Trách nhiệm

- Nhận `place_id` và `target_language` từ frontend.
- Đọc review summary/review samples từ Supabase.
- Dùng offline fallback file khi cần.
- Gọi review-summary AI service để generate hoặc translate.
- Trả summary đã localize cho frontend.

## 🔌 Public API

| Method | Path | Mô tả |
| --- | --- | --- |
| `GET` | `/api/v1/review-summary` | Trả review summary theo `place_id` và `target_language`. |
| `GET` | `/api/v1/review-summary/samples` | Trả sample reviews từ Supabase. |

## 🧠 Thiết kế nội bộ

- `routes.py`: FastAPI routes.
- `service.py`: Supabase reads, cache/fallback behavior.
- `client.py`: HTTP client gọi `review-summary-service`.
- `schemas.py`: response schemas.

Flow:

```text
frontend place details
  -> backend review-summary route
  -> Supabase place_summaries / clean_reviews
  -> review-summary AI service when needed
  -> localized summary
  -> frontend
```

## 🔗 Dependencies

- Supabase `place_summaries` / `clean_reviews`.
- `REVIEW_SUMMARY_PATH` fallback JSON.
- `AI_REVIEW_SUMMARY_SERVICE_URL`.
- `AI_SERVICE_TIMEOUT_SECONDS` và optional `AI_SERVICE_TOKEN`.
- `ai-models/review-summary-service` là downstream dependency.

## ⚙️ Configuration

Biến backend liên quan:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `REVIEW_SUMMARY_PATH`
- `AI_REVIEW_SUMMARY_SERVICE_URL`
- `AI_SERVICE_TIMEOUT_SECONDS`
- `AI_SERVICE_TOKEN`

## 🚀 Ví dụ sử dụng

```bash
curl "http://localhost:8000/api/v1/review-summary?place_id=<place_id>&target_language=vi"
```

Lấy sample reviews:

```bash
curl "http://localhost:8000/api/v1/review-summary/samples?place_id=<place_id>&limit=5"
```

## 🧪 Testing

```bash
cd backend
uv run pytest -q tests/test_review_summary_api.py
uv run pytest -q tests/test_ai_service_contracts.py
```

Manual smoke: mở một place có dữ liệu, đổi UI Vietnamese/English và kiểm tra summary đổi ngôn ngữ.

## 🧱 Extension guide

Thêm nguồn dữ liệu summary mới:

1. Cập nhật `service.py` để đọc nguồn mới.
2. Giữ fallback hiện tại nếu nguồn mới không có dữ liệu.
3. Cập nhật schema nếu response có field mới.
4. Test place có summary, place thiếu summary và place không tồn tại.

## ⚠️ Gotchas

- Summary quality phụ thuộc dữ liệu offline review summary và keyword ratios.
- English/Vietnamese output cần test riêng vì prompt có thể sinh độ dài khác nhau.
- Nếu Supabase thiếu dữ liệu, backend có thể dùng fallback file nhưng dữ liệu có thể cũ.
