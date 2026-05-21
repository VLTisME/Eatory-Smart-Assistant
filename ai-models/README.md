# AI Models

Thư mục `ai-models/` chứa toàn bộ phần AI runtime và AI pipeline của Eatory. Sau refactor, backend chỉ gọi các service trong thư mục này qua HTTP; backend không import trực tiếp model code, prompt hoặc logic vector search.

## Trách nhiệm

`ai-models/` sở hữu:

- OCR và trích xuất menu có cấu trúc.
- CLIP model, embedding search và noise detection cho tìm địa điểm bằng ảnh.
- RAG retrieval, Chroma vector DB, prompt trả lời chatbot và shared refinement.
- Prompt sinh/dịch review summary.
- Dependency nặng liên quan đến AI như OpenAI SDK, Torch, Transformers, Chroma, EasyOCR.
- Artifact AI và hướng dẫn regenerate artifact.
- Test và schema contract ở cấp AI service.

`ai-models/` không sở hữu:

- Public route cho frontend.
- Firebase Auth hoặc Firestore chat history.
- Goong proxy.
- ImageKit auth signature.
- Supabase application route dùng trực tiếp cho UI.

## Module hiện tại

```text
ai-models/
|-- menu-translation-service/   # OCR ảnh menu và trích xuất menu có cấu trúc
|-- place-search-service/       # Tìm địa điểm bằng ảnh với CLIP và embedding artifacts
|   `-- research/               # Notebook nghiên cứu/prototype CLIP, không phải runtime
|-- rag-service/                # RAG retrieval/chat và shared LLM refinement
`-- review-summary-service/     # Online review summary service
    `-- offline/                # Batch pipeline sentiment/keyword/grouping/DB insert
```

## Service và cổng mặc định

| Service | Port | Vai trò |
| --- | --- | --- |
| `menu-translation-service` | `8101` | OCR menu và trả JSON món ăn/danh mục. |
| `place-search-service` | `8102` | Load CLIP, đọc embedding artifact và tìm địa điểm bằng ảnh. |
| `rag-service` | `8103` | Vector retrieval, sinh câu trả lời chatbot và refinement endpoint. |
| `review-summary-service` | `8104` | Sinh/dịch nội dung tổng quan đánh giá. |

Backend mặc định chạy ở `8000`, frontend ở `5173`.

## Chạy một AI service

Mỗi service có `.env.example`, `requirements.txt`, `requirements-dev.txt`, Dockerfile và README riêng. Ví dụ:

```bash
cd ai-models/rag-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload --host localhost --port 8103
```

Nếu chạy bằng Docker Compose ở root repo, các service được build và gọi theo service name trong `docker-compose.yml`.

## Quy ước môi trường

Mỗi AI service giữ `.env` riêng:

- `menu-translation-service/.env`: OCR provider, OpenAI key/model, service token.
- `place-search-service/.env`: CLIP model, đường dẫn embedding/index, Supabase fallback, OpenAI refine.
- `rag-service/.env`: OpenAI model, Chroma path, embedding model/device.
- `review-summary-service/.env`: OpenAI model, service token và biến offline pipeline.

Backend chỉ cần URL và token để gọi service:

```env
AI_MENU_SERVICE_URL="http://localhost:8101"
AI_PLACE_SEARCH_SERVICE_URL="http://localhost:8102"
AI_RAG_SERVICE_URL="http://localhost:8103"
AI_REFINEMENT_SERVICE_URL="http://localhost:8103"
AI_REVIEW_SUMMARY_SERVICE_URL="http://localhost:8104"
AI_SERVICE_TOKEN=""
```

## Artifact

Artifact AI không nên bị trộn lẫn với source code thường:

- Root `data/` hiện chứa artifact runtime cho place search.
- `rag-service/chroma_db/` là Chroma vector DB hiện tại.
- `rag-service/rag_documents.json` được sinh từ review summary output.
- `review-summary-service/offline/data/` chứa dữ liệu offline batch.
- Notebook nghiên cứu nằm trong `place-search-service/research/` và bị loại khỏi runtime Docker image.

Khi thêm artifact mới, hãy thêm README ngắn mô tả artifact đến từ đâu, dùng bởi service nào và cách regenerate.

## Kiểm thử

Chạy test cho từng service:

```bash
cd ai-models/menu-translation-service
python -m pytest -q
```

Lặp lại pattern trên cho `place-search-service`, `rag-service` và `review-summary-service`. Không dùng virtualenv của backend để chạy AI test vì dependency đã tách riêng.

## Tài liệu chi tiết

- [Menu translation service](menu-translation-service/README.md)
- [Place search service](place-search-service/README.md)
- [Place search research](place-search-service/research/README.md)
- [RAG service](rag-service/README.md)
- [Review summary service](review-summary-service/README.md)
- [Review summary offline pipeline](review-summary-service/offline/README.md)
