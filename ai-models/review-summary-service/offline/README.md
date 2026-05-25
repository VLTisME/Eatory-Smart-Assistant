# Review Summary Offline Pipeline

## 🎯 Mục đích

`offline/` chứa batch pipeline tạo dữ liệu nền cho review summary. Pipeline này đọc review đã clean, gán sentiment, trích xuất keyword, group theo địa điểm, sinh summary text và insert/export dữ liệu.

## 🧩 Trách nhiệm

- Convert input JSON/CSV khi cần.
- Kiểm tra chất lượng dữ liệu input.
- Gán sentiment cho review.
- Trích xuất keyword.
- Group review theo `place_id`.
- Sinh summary text và validation report.
- Insert/update dữ liệu vào PostgreSQL hoặc Supabase-compatible database.
- Xuất artifact để backend fallback và RAG document build sử dụng.

## 🔌 Public API

Public interface là các scripts trong `offline/scripts/`:

- `00_convert_json_to_csv.py`
- `01_check_data.py`
- `02_add_sentiment.py`
- `03_extract_keywords.py`
- `04_group_by_place.py`
- `05_generate_summary_text.py`
- `06_insert_to_postgres.py`
- `check_inserted_data.py`
- `test_db_connection.py`
- `test_query_by_place_id.py`

## 🧠 Thiết kế nội bộ

```text
offline/
|-- scripts/
|-- sql/
|   `-- review_summaries_schema.sql
|-- data/
|   |-- input/
|   |-- intermediate/
|   `-- output/
|-- review_summary_pipeline.png
`-- docker-compose.yml
```

Pipeline:

![Review summary pipeline](review_summary_pipeline.png)

Luồng chạy từ service root `ai-models/review-summary-service`:

```bash
python offline/scripts/00_convert_json_to_csv.py
python offline/scripts/01_check_data.py
python offline/scripts/02_add_sentiment.py
python offline/scripts/03_extract_keywords.py
python offline/scripts/04_group_by_place.py
python offline/scripts/05_generate_summary_text.py
python offline/scripts/06_insert_to_postgres.py
```

Luồng dữ liệu:

```text
offline/data/input
  -> sentiment
  -> keyword extraction
  -> grouped summaries
  -> offline/data/output
  -> database insert / RAG input
```

## 🔗 Dependencies

- Python dependencies trong `../requirements-offline.txt`.
- `DATABASE_URL` tới PostgreSQL/Supabase-compatible database.
- Input reviews trong `offline/data/input/`.
- Runtime review summary service và RAG service dùng output của pipeline này.

## ⚙️ Configuration

Offline scripts đọc `.env` ở service root trước, sau đó đọc optional `offline/.env`.

Biến chính:

- `DATABASE_URL`

Cài dependency:

```bash
cd ai-models/review-summary-service
python3 -m venv .venv-offline
source .venv-offline/bin/activate
pip install -r requirements-offline.txt
```

## 🚀 Ví dụ sử dụng

Kiểm tra DB:

```bash
cd ai-models/review-summary-service
python offline/scripts/test_db_connection.py
```

Kiểm tra input:

```bash
python offline/scripts/01_check_data.py
```

Chạy toàn pipeline theo thứ tự scripts trong phần thiết kế nội bộ.

## 🧪 Testing

Checks nhanh:

```bash
cd ai-models/review-summary-service
python -m py_compile offline/scripts/*.py
python offline/scripts/test_db_connection.py
python offline/scripts/01_check_data.py
```

Output quan trọng:

- `offline/data/intermediate/reviews_with_sentiment.csv`
- `offline/data/intermediate/reviews_with_sentiment_keywords.csv`
- `offline/data/output/review_summaries.json`
- `offline/data/output/review_summaries.csv`
- `offline/data/output/review_summaries_with_text.json`
- `offline/data/output/review_summaries_with_text.csv`
- `offline/data/output/validation_report.json`

## 🧱 Extension guide

Thêm bước batch mới:

1. Đặt script mới trong `offline/scripts/` với prefix số nếu nó thuộc pipeline chính.
2. Ghi rõ input/output file trong script.
3. Giữ output cũ nếu runtime/RAG đang phụ thuộc vào nó.
4. Cập nhật README và validation report nếu thay đổi schema output.

Thêm bảng DB mới:

1. Cập nhật SQL trong `offline/sql/`.
2. Cập nhật insert script.
3. Chạy `check_inserted_data.py` sau khi insert.

## ⚠️ Gotchas

- Scripts phụ thuộc working directory; nên chạy từ `ai-models/review-summary-service`.
- Output lớn có thể không phù hợp để review thủ công trong PR.
- Nếu đổi schema `review_summaries_with_text.json`, RAG build có thể hỏng.
- Sentiment/keyword rule thay đổi sẽ ảnh hưởng trực tiếp tới chất lượng review summary và RAG.
