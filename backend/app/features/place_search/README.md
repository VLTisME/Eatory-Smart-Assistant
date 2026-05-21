# Backend Place Search Proxy

Module này giữ public API tìm địa điểm bằng ảnh, trong khi CLIP model, embedding search và refine logic nằm ở `ai-models/place-search-service`.

## Endpoint public

| Method | Path | Hành vi backend |
| --- | --- | --- |
| `POST` | `/api/v1/place-search` | Validate ảnh upload, proxy sang `POST /v1/place-search/by-image`, rồi map empty result về response hiện tại của frontend. |

## Backend sở hữu

- Compatibility của public route.
- Validate upload trước khi proxy.
- Map lỗi HTTP từ AI service.
- Schema response dùng cho tests, OpenAPI và frontend contract.
- Truyền `target_language` từ frontend xuống AI service.

## AI service sở hữu

- CLIP/Torch/Transformers model loading.
- Đọc embedding/noise artifacts từ root `data/`.
- Similarity search và score aggregation.
- Noise detection.
- Optional OpenAI refinement cho kết quả place search.

## Biến môi trường backend

```env
AI_PLACE_SEARCH_SERVICE_URL="http://localhost:8102"
AI_SERVICE_TIMEOUT_SECONDS=180
AI_SERVICE_TOKEN=""
```

Nếu `AI_SERVICE_TOKEN` được set, backend gửi `Authorization: Bearer <token>` sang AI service.
