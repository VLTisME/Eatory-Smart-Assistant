# Data Engineering

`data-engineering/` chứa các workflow nhập liệu, scraping, upload, migration và publish artifact cho Eatory dataset. Đây là vùng dành cho batch jobs và tooling dữ liệu, không phải runtime API cho frontend.

## Trách nhiệm

Data Engineering sở hữu:

- Inspect/extract raw dataset.
- Nạp Kaggle dataset vào Supabase.
- Upload ảnh địa điểm lên Cloudinary.
- Push image embeddings.
- Push review summaries.
- Google Maps scraping.
- Script setup/migration database cho ingestion workflow.

Data Engineering không sở hữu:

- Public backend route cho frontend.
- AI model inference runtime.
- OpenAI prompt orchestration.
- Firebase Auth hoặc chat history.
- Contract response của backend application API.

## Cấu trúc

```text
data-engineering/
|-- scripts/
|   |-- extract_dataset.py
|   |-- inspect_kaggle_data.py
|   |-- kaggle_to_supabase.py
|   |-- upload_images_cloudinary.py
|   |-- push_embeddings.py
|   |-- push_summaries.py
|   |-- query_image.py
|   `-- query_images.py
|-- maps-scraper/
|   |-- server.py
|   |-- scraper.py
|   |-- database.py
|   |-- models.py
|   |-- schema.py
|   |-- classifier.py
|   |-- docker-compose.yml
|   `-- script/
|-- requirements.txt
`-- .env.example
```

## Biến môi trường

Tạo `.env`:

```bash
cd data-engineering
cp .env.example .env
```

Các biến thường dùng:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `DATABASE_URL`
- `KAGGLE_ARCHIVE_PATH`
- `KAGGLE_DATASET_DIR`
- `EMBEDDINGS_ARTIFACT_DIR`
- `REVIEW_SUMMARIES_FILE`

Các script trong repo dùng `SUPABASE_SERVICE_KEY`. Cloudinary credential thuộc về data-engineering, không đặt trong backend nếu chỉ dùng cho ingestion.

## Cài đặt

```bash
cd data-engineering
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Nếu dùng Playwright scraper:

```bash
playwright install chromium
```

## Luồng pipeline gợi ý

1. Inspect hoặc extract raw data:

   ```bash
   python scripts/inspect_kaggle_data.py
   python scripts/extract_dataset.py
   ```

2. Push place và review records lên Supabase:

   ```bash
   python scripts/kaggle_to_supabase.py
   ```

3. Upload ảnh local lên Cloudinary và lưu URL/file path:

   ```bash
   python scripts/upload_images_cloudinary.py
   ```

4. Push image embeddings:

   ```bash
   python scripts/push_embeddings.py
   ```

5. Push review summaries:

   ```bash
   python scripts/push_summaries.py
   ```

Trước khi chạy trên database dùng chung, đọc lại từng script vì nhiều script có thao tác upsert/write.

## Tables thường được chạm tới

- `scripts/kaggle_to_supabase.py`: ghi `places`, `clean_reviews`; đọc count ở `places`, `clean_reviews`, `place_summaries`, `image_embeddings`.
- `scripts/upload_images_cloudinary.py`: upload ảnh lên Cloudinary và upsert metadata vào `image_embeddings`.
- `scripts/push_embeddings.py`: đọc/upsert embedding vào `image_embeddings`.
- `scripts/push_summaries.py`: upsert `place_summaries`.
- `scripts/query_image.py`, `scripts/query_images.py`: tooling đọc `image_embeddings`.

## Maps scraper

Maps scraper nằm trong `maps-scraper/`, dùng để queue Google Maps URL, scrape place/review metadata, classify place type và lưu vào PostgreSQL.

Chạy database local:

```bash
cd data-engineering/maps-scraper
docker compose up -d
```

Chạy API scraper:

```bash
uvicorn server:app --reload --host localhost --port 8201
```

Queue một URL:

```bash
curl -X POST http://localhost:8201/add-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://maps.google.com/..."}'
```

## Artifact policy

Generated datasets, checkpoints, upload reports và large embeddings không nên commit trừ khi là sample nhỏ có chủ đích.

Pattern đề xuất:

- Lưu output local dưới `data-engineering/artifacts/` hoặc `data-engineering/data/`.
- Viết README mô tả cách regenerate.
- Dùng external storage cho artifact lớn cần chia sẻ.

Các path local thường được ignore:

- `data-engineering/artifacts/`
- `data-engineering/data/`
- `data-engineering/kaggle_cache/`
- `data-engineering/maps-scraper/chrome_user_data_*/`
