# RAG Service - Eatory Smart Assistant

Chatbot tư vấn ăn uống tại TP.HCM, sử dụng Retrieval-Augmented Generation (RAG) để gợi ý địa điểm dựa trên dữ liệu review thực tế từ Google Maps.

## Cấu trúc thư mục

```
rag/
├── rules.py                          # Rules phân loại quán + extract signals
├── build_documents.py                # Build RAG documents từ review data
├── build_vector_db.py                # Tạo ChromaDB vector database
├── query_rag.py                      # Query RAG + gọi OpenAI
├── api.py                            # FastAPI endpoints
├── requirements.txt                  # Dependencies
├── rag_documents.json                # (generated) Output bước 1
└── chroma_db/                        # (generated) Vector database
```

## Setup

### 1. Cài dependencies

```bash
cd ai-models/rag
pip install -r requirements.txt
```

### 2. Set API key

```bash
export OPENAI_API_KEY="sk-..."
```

Hoặc tạo file `.env`:

```
OPENAI_API_KEY=sk-...
```

## Chạy Pipeline

### Bước 1: Build documents

```bash
python build_documents.py
```

Input: `review_summaries_with_text.json` (tự tìm ở `rag/` hoặc fallback sang `review_summary/data/output/`)

Output: `rag_documents.json` — 2371 documents, mỗi document chứa content (text mô tả quán) và metadata (categories, items, aspects, price...).

### Bước 2: Build vector database

```bash
python build_vector_db.py
```

Input: `rag_documents.json`

Output: `chroma_db/` — ChromaDB vector database dùng model embedding `AITeamVN/Vietnamese_Embedding`.

**Lưu ý:**
- Nếu máy có GPU NVIDIA, sửa `device` trong `build_vector_db.py` thành `"cuda"`.
- Nếu chạy local quá lâu, có thể đẩy lên Kaggle chạy rồi tải `chroma_db/` về.
- Model backup nhẹ hơn: `bkai-foundation-models/vietnamese-bi-encoder`.

### Bước 3: Test query (CLI)

```bash
python query_rag.py
```

Nhập câu hỏi bằng tiếng Việt, hệ thống sẽ retrieve top-5 quán phù hợp và gọi OpenAI trả lời.

### Bước 4: Chạy API server

```bash
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

Swagger docs: `http://localhost:8000/docs`

---

## API Endpoints

### `GET /health`

Kiểm tra service có đang chạy không.

**Response:**

```json
{
  "status": "ok",
  "service": "rag-service"
}
```

**cURL:**

```bash
curl http://localhost:8000/health
```

---

### `POST /rag/retrieve`

Retrieve top-k địa điểm phù hợp (chỉ vector search, không gọi OpenAI).

**Request:**

```json
{
  "query": "quán sushi review tốt",
  "top_k": 5
}
```

| Field   | Type   | Required | Default | Mô tả                     |
|---------|--------|----------|---------|----------------------------|
| `query` | string | Yes      | —       | Câu hỏi tìm kiếm          |
| `top_k` | int    | No       | 5       | Số kết quả trả về (1-10)   |

**Response:**

```json
{
  "query": "quán sushi review tốt",
  "sources": [
    {
      "place_id": "ChIJ...",
      "place_name": "Matsuri Yaki Restaurant",
      "address": "178 Pasteur, Sài Gòn, Hồ Chí Minh",
      "district": "Sài Gòn",
      "city": "Hồ Chí Minh",
      "avg_rating": 4.6,
      "positive_ratio": 0.9,
      "negative_ratio": 0.0667,
      "score": 0.23,
      "content_preview": "Tên: Matsuri Yaki Restaurant..."
    }
  ]
}
```

**cURL:**

```bash
curl -X POST http://localhost:8000/rag/retrieve \
  -H "Content-Type: application/json" \
  -d '{"query": "quán cà phê yên tĩnh quận 1", "top_k": 3}'
```

---

### `POST /rag/chat`

Chatbot hoàn chỉnh: retrieve documents + gọi OpenAI trả lời tự nhiên.

**Request:**

```json
{
  "message": "Gợi ý cho tôi quán sushi review tốt ở Sài Gòn",
  "top_k": 3
}
```

| Field     | Type   | Required | Default | Mô tả                         |
|-----------|--------|----------|---------|--------------------------------|
| `message` | string | Yes      | —       | Câu hỏi của user              |
| `top_k`   | int    | No       | 5       | Số documents retrieve (1-10)   |

**Response:**

```json
{
  "answer": "Dựa trên dữ liệu review, mình gợi ý cho bạn mấy quán sushi sau...",
  "sources": [
    {
      "place_id": "ChIJ...",
      "place_name": "Matsuri Yaki Restaurant",
      "address": "178 Pasteur, Sài Gòn, Hồ Chí Minh",
      "district": "Sài Gòn",
      "city": "Hồ Chí Minh",
      "avg_rating": 4.6,
      "positive_ratio": 0.9,
      "negative_ratio": 0.0667,
      "score": 0.23,
      "content_preview": "Tên: Matsuri Yaki Restaurant..."
    }
  ]
}
```

**cURL:**

```bash
curl -X POST http://localhost:8000/rag/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "quán nào ngon rẻ ở quận 3", "top_k": 3}'
```

---

## Ví dụ câu hỏi

- "Quán cà phê yên tĩnh để làm việc ở quận 1?"
- "Gợi ý quán sushi review tốt ở Sài Gòn"
- "Quán nào ngon mà giá rẻ ở quận 3?"
- "Nhà hàng nào phù hợp đi ăn nhóm 10 người?"
- "Quán nướng BBQ nào được review tốt?"

## Lưu ý

- `query_rag.py` đang dùng model `gpt-5.5`. Nếu chưa có access, sửa `OPENAI_MODEL` thành `gpt-4o` hoặc model phù hợp.
- `rag_documents.json` và `chroma_db/` là file generated, không cần commit lên git.
- Đảm bảo `OPENAI_API_KEY` được set trước khi chạy bước 3 và 4.
