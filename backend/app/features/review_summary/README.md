# Backend Review Summary

Module này giữ public API review summary, trong khi online LLM generate/translate đã được chuyển sang `ai-models/review-summary-service`.

## Endpoint public

| Method | Path | Hành vi backend |
| --- | --- | --- |
| `GET` | `/api/v1/review-summary` | Đọc keyword/ratio/review data từ Supabase, sau đó gọi AI service để generate hoặc translate khi cần. |
| `GET` | `/api/v1/review-summary/samples` | Đọc sample reviews từ Supabase, không gọi AI service. |

## Backend sở hữu

- Public route compatibility.
- Supabase reads từ `place_summaries` và `clean_reviews`.
- Cache summary response.
- Fallback message khi thiếu dữ liệu hoặc AI service unavailable.
- Truyền `target_language` theo ngôn ngữ UI.

## AI service sở hữu

- Review-summary prompts.
- OpenAI call để sinh summary.
- OpenAI call để dịch summary.
- Parse/cleanup output từ LLM.

## Biến môi trường backend

```env
AI_REVIEW_SUMMARY_SERVICE_URL="http://localhost:8104"
AI_SERVICE_TIMEOUT_SECONDS=180
AI_SERVICE_TOKEN=""
REVIEW_SUMMARY_PATH="../ai-models/review-summary-service/offline/data/output/review_summaries.json"
```

Nếu `AI_SERVICE_TOKEN` được set, backend gửi `Authorization: Bearer <token>` sang AI service.
