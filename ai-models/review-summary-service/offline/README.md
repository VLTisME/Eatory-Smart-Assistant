# Review Summary Offline Pipeline

`offline/` chứa batch pipeline cho domain review summary. Pipeline này xử lý dữ liệu review đã clean, gán sentiment, trích xuất keyword, group theo `place_id`, sinh summary text và insert/update dữ liệu vào PostgreSQL hoặc Supabase-compatible database.

Online review-summary generation/translation nằm ở `../app`. Offline pipeline chỉ chuẩn bị dữ liệu nền và publish output.

## Trách nhiệm

Offline pipeline sở hữu:

- Sentiment labeling cho review.
- Keyword extraction.
- Aggregation theo địa điểm.
- Sinh summary text từ dữ liệu đã tiền xử lý.
- SQL schema cho review summaries.
- Script insert/update generated summary records.

Offline pipeline không sở hữu:

- Public `/api/v1/review-summary` route.
- Backend auth hoặc request handling.
- UI formatting.
- Online OpenAI generate/translate endpoint.
- Chat history hoặc RAG runtime.

## Cấu trúc

```text
review-summary-service/offline/
|-- scripts/
|   |-- 00_convert_json_to_csv.py
|   |-- 01_check_data.py
|   |-- 02_add_sentiment.py
|   |-- 03_extract_keywords.py
|   |-- 04_group_by_place.py
|   |-- 05_generate_summary_text.py
|   |-- 06_insert_to_postgres.py
|   |-- check_inserted_data.py
|   |-- test_db_connection.py
|   `-- test_query_by_place_id.py
|-- sql/
|   `-- review_summaries_schema.sql
|-- data/
|   |-- input/
|   |-- intermediate/
|   `-- output/
`-- docker-compose.yml
```

## Biến môi trường

Offline scripts load `.env` ở service root trước, sau đó load optional `offline/.env`.

Biến quan trọng:

- `DATABASE_URL`

Tạo `.env` ở service root:

```bash
cd ai-models/review-summary-service
cp .env.example .env
```

## Cài đặt

Dependency offline được tách khỏi online runtime:

```bash
cd ai-models/review-summary-service
python3 -m venv .venv-offline
source .venv-offline/bin/activate
pip install -r requirements-offline.txt
```

## Chạy database local

```bash
cd ai-models/review-summary-service/offline
docker compose up -d
```

## Thứ tự pipeline

Chạy từ `ai-models/review-summary-service`.

1. Convert JSON input sang CSV nếu cần:

   ```bash
   python offline/scripts/00_convert_json_to_csv.py
   ```

2. Kiểm tra chất lượng input:

   ```bash
   python offline/scripts/01_check_data.py
   ```

3. Gán sentiment:

   ```bash
   python offline/scripts/02_add_sentiment.py
   ```

4. Trích xuất keyword:

   ```bash
   python offline/scripts/03_extract_keywords.py
   ```

5. Group review theo địa điểm:

   ```bash
   python offline/scripts/04_group_by_place.py
   ```

6. Sinh summary text:

   ```bash
   python offline/scripts/05_generate_summary_text.py
   ```

7. Insert/update database:

   ```bash
   python offline/scripts/06_insert_to_postgres.py
   ```

## Output

Output thường gặp:

- `offline/data/intermediate/reviews_with_sentiment.csv`
- `offline/data/intermediate/reviews_with_sentiment_keywords.csv`
- `offline/data/output/review_summaries.json`
- `offline/data/output/review_summaries.csv`
- `offline/data/output/review_summaries_with_text.json`
- `offline/data/output/review_summaries_with_text.csv`
- `offline/data/output/validation_report.json`

Một số file output đang được giữ để tương thích. Mục tiêu dài hạn là chỉ commit sample nhỏ hoặc README, còn dữ liệu đầy đủ được regenerate hoặc lấy từ storage.

## Liên hệ với backend và RAG

- Backend có thể đọc fallback từ `offline/data/output/review_summaries.json`.
- `rag-service/build_documents.py` có thể dùng `offline/data/output/review_summaries_with_text.json` làm input fallback.
- Online review-summary service trong `../app` chỉ xử lý generate/translate bằng LLM, không chạy batch pipeline.

## Kiểm tra nhanh

```bash
cd ai-models/review-summary-service
python offline/scripts/test_db_connection.py
python offline/scripts/01_check_data.py
```
