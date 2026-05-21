# Backend Menu Translation Proxy

Module này giữ public API dịch menu mà frontend đang dùng, nhưng toàn bộ OCR và xử lý menu đã được chuyển sang `ai-models/menu-translation-service`.

## Endpoint public

| Method | Path | Hành vi backend |
| --- | --- | --- |
| `POST` | `/api/v1/menu-translation/ocr` | Validate ảnh upload, sau đó proxy sang `POST /v1/menu/ocr` của menu AI service. |
| `POST` | `/api/v1/menu-translation/ocr/structured` | Validate ảnh upload, proxy sang `POST /v1/menu/structured` với `restaurant_name` và `target_language`. |

## Backend sở hữu

- Compatibility của public route.
- Validate upload trước khi gọi AI service.
- Map lỗi HTTP từ AI service về response phù hợp.
- Schema response dùng cho OpenAPI và backend tests.

## AI service sở hữu

- OCR provider.
- OpenAI vision call.
- Prompt menu.
- OCR-to-structured-menu pipeline.
- Dependency nặng như EasyOCR.

## Biến môi trường backend

```env
AI_MENU_SERVICE_URL="http://localhost:8101"
AI_SERVICE_TIMEOUT_SECONDS=180
AI_SERVICE_TOKEN=""
```

Nếu `AI_SERVICE_TOKEN` được set, backend gửi `Authorization: Bearer <token>` sang AI service.
