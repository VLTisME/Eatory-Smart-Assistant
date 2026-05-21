# Review Summary Service

`review-summary-service` là FastAPI service cho phần LLM online của tính năng tổng quan đánh giá. Backend vẫn sở hữu public route `/api/v1/review-summary`, đọc dữ liệu từ Supabase và gọi service này để sinh hoặc dịch nội dung summary.

Offline pipeline của cùng domain được đặt trong `offline/` để tránh còn một thư mục `review_summary/` riêng gây nhầm lẫn.

## Chức năng

- Sinh review summary từ tên địa điểm, tỷ lệ positive/negative và keyword đã tính trước.
- Dịch summary có sẵn sang tiếng Việt hoặc tiếng Anh.
- Giữ prompt và OpenAI runtime dependency của review-summary.
- Giữ batch/offline scripts xử lý sentiment, keyword, grouping và DB insertion.

## Endpoint

| Method | Path | Mô tả |
| --- | --- | --- |
| `GET` | `/health` | Kiểm tra service còn sống. |
| `POST` | `/v1/review-summary/generate` | Nhận payload review ratio/keyword và `target_language`, trả summary text. |
| `POST` | `/v1/review-summary/translate` | Nhận summary text hiện có và `target_language`, trả bản dịch. |

Nếu `SERVICE_TOKEN` được cấu hình, caller phải gửi `Authorization: Bearer <token>`.

## Cấu trúc

```text
review-summary-service/
|-- app/
|   |-- main.py          # Ứng dụng FastAPI
|   |-- routes.py        # Generate/translate endpoints
|   |-- schemas.py       # Request/response schema
|   |-- service.py       # Điều phối OpenAI
|   |-- prompts.py       # Prompt review summary
|   `-- config.py        # Cấu hình môi trường
|-- offline/
|   |-- scripts/         # Pipeline batch
|   |-- sql/             # Schema/setup SQL
|   `-- data/            # Input/intermediate/output local data
|-- tests/
|-- requirements.txt
|-- requirements-dev.txt
|-- requirements-offline.txt
|-- Dockerfile
`-- .env.example
```

## Biến môi trường

Tạo `.env`:

```bash
cd ai-models/review-summary-service
cp .env.example .env
```

Các biến online quan trọng:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `SERVICE_TOKEN`

Biến offline quan trọng:

- `DATABASE_URL`

Online service và offline pipeline dùng dependency riêng:

- `requirements.txt`: runtime online service.
- `requirements-dev.txt`: test/tooling cho online service.
- `requirements-offline.txt`: batch/offline pipeline.

## Chạy online service

```bash
cd ai-models/review-summary-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload --host localhost --port 8104
```

Swagger:

```text
http://localhost:8104/docs
```

## Chạy offline pipeline

```bash
cd ai-models/review-summary-service
python3 -m venv .venv-offline
source .venv-offline/bin/activate
pip install -r requirements-offline.txt
python offline/scripts/01_check_data.py
```

Xem [offline/README.md](offline/README.md) để biết thứ tự đầy đủ của pipeline.

## Tích hợp backend

Public routes ở backend:

- `GET /api/v1/review-summary`
- `GET /api/v1/review-summary/samples`

Backend gọi service qua:

```env
AI_REVIEW_SUMMARY_SERVICE_URL="http://localhost:8104"
AI_SERVICE_TOKEN=""
AI_SERVICE_TIMEOUT_SECONDS=180
```

Backend vẫn đọc Supabase và cache response. Service này chỉ xử lý phần LLM generate/translate.

## Kiểm thử

```bash
cd ai-models/review-summary-service
python -m pytest -q
```

Kiểm tra nhanh generate:

```bash
curl -X POST http://localhost:8104/v1/review-summary/generate \
  -H "Content-Type: application/json" \
  -d '{"place_name":"Haidilao Hot Pot","positive_ratio":0.97,"negative_ratio":0.02,"positive_keywords":["friendly staff","delicious food"],"negative_keywords":["expensive"],"target_language":"en"}'
```

## Lỗi thường gặp

- Summary tiếng Anh quá ngắn hoặc thiếu chi tiết: kiểm tra prompt, payload keyword/ratio và `target_language`.
- Thiếu `OPENAI_API_KEY`: generate/translate sẽ lỗi.
- Offline data thiếu: backend có thể không có dữ liệu nền để gọi generate.
