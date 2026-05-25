# Data Engineering

## 🎯 Mục đích

`data-engineering/` chứa scripts nhập liệu, chuẩn hóa và publish dữ liệu cho Eatory Smart Assistant. Module này đưa dữ liệu từ Kaggle/Google Maps/local images vào Supabase, Cloudinary và runtime artifacts cho AI/search.

## 🧩 Trách nhiệm

- Inspect/extract Kaggle hoặc raw dataset.
- Nạp `places` và `clean_reviews` lên Supabase.
- Upload ảnh địa điểm local lên Cloudinary.
- Publish image embeddings metadata và review summaries.
- Crawl Google Maps bằng `google-maps-scraper`.
- Xuất metadata JSON/ảnh local cho các pipeline tiếp theo.

Runtime frontend/backend dùng dữ liệu đã được publish từ các scripts này.

## 🔌 Public API

Public interface là CLI scripts:

- `scripts/inspect_kaggle_data.py`
- `scripts/extract_dataset.py`
- `scripts/kaggle_to_supabase.py`
- `scripts/upload_images_cloudinary.py`
- `scripts/push_embeddings.py`
- `scripts/push_summaries.py`
- `scripts/query_image.py`
- `scripts/query_images.py`

## 🧠 Cấu trúc

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
|-- google-maps-scraper/
|   |-- main.go
|   |-- scripts/food_pipeline.py
|   |-- sql_scripts/
|   |-- docker-compose.yaml
|   |-- Makefile
|   `-- README.md
|-- requirements.txt
`-- .env.example
```

Kaggle/local data flow:

```text
Kaggle/raw files
  -> inspect/extract
  -> kaggle_to_supabase.py
  -> upload_images_cloudinary.py
  -> push_embeddings.py
  -> push_summaries.py
  -> Supabase/Cloudinary/runtime artifacts
```

Google Maps flow:

```text
query file
  -> Go scraper
  -> raw JSON
  -> scripts/food_pipeline.py
  -> PostgreSQL local
  -> gmaps-output/metadata + gmaps-output/images
```

## 🔗 Dependencies

- Python dependencies trong `requirements.txt`.
- Supabase service key.
- Cloudinary credentials.
- Local/Kaggle dataset paths.
- Optional local PostgreSQL cho Google Maps scraper.
- Docker/Go cho `google-maps-scraper`.

Consumers của output:

- Backend đọc Supabase data.
- Place search dùng image artifacts trong root `data/`.
- Review summary/RAG dùng review summary artifacts.

## ⚙️ Configuration

Tạo `.env`:

```bash
cd data-engineering
cp .env.example .env
```

Nhóm biến chính:

- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Local DB: `DATABASE_URL`
- Kaggle/raw data: `KAGGLEHUB_CACHE`, `KAGGLE_ARCHIVE_PATH`, `KAGGLE_DATASET_DIR`, `KAGGLE_PLACES_FILE`, `KAGGLE_REVIEWS_FILE`
- Image ingestion: `LOCAL_IMAGES_ROOT`, `LOCAL_IMAGES_SUBDIR`, `CLOUDINARY_ROOT_FOLDER`
- Artifact publish: `EMBEDDINGS_ARTIFACT_DIR`, `IMAGE_INDEX_FILE`, `IMAGE_EMBEDDINGS_FILE`, `REVIEW_SUMMARIES_FILE`
- Batch tuning: `PLACES_BATCH_SIZE`, `REVIEWS_BATCH_SIZE`, `SUPABASE_BATCH_SIZE`, `SUPABASE_PAGE_SIZE`

## 🚀 Ví dụ sử dụng

Cài đặt:

```bash
cd data-engineering
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Inspect/extract dataset:

```bash
python scripts/inspect_kaggle_data.py
python scripts/extract_dataset.py
```

Nạp place/review records lên Supabase:

```bash
python scripts/kaggle_to_supabase.py
```

Upload ảnh local lên Cloudinary:

```bash
python scripts/upload_images_cloudinary.py
```

Publish artifacts:

```bash
python scripts/push_embeddings.py
python scripts/push_summaries.py
```

Query image metadata local:

```bash
python scripts/query_image.py
python scripts/query_images.py
```

## 🧪 Testing

Python compile check:

```bash
python -m py_compile data-engineering/scripts/*.py data-engineering/google-maps-scraper/scripts/*.py
```

Google Maps scraper Go tests:

```bash
cd data-engineering/google-maps-scraper
go test ./gmaps ./runner ./deduper ./grid ./exiter
```

## 🧱 Extension guide

Thêm script data mới:

1. Đặt script trong `data-engineering/scripts/` nếu nó xử lý dataset/Supabase/Cloudinary chung.
2. Đặt trong `google-maps-scraper/scripts/` nếu nó chỉ phục vụ crawler.
3. Đọc config từ `.env`, không hardcode key/path cá nhân.
4. Ghi rõ input/output và idempotency trong docstring hoặc README.
5. Thêm compile/test command nếu script có dependency đặc biệt.

Thêm artifact mới:

1. Xác định consumer runtime: backend, AI service hay data-only.
2. Đặt output local vào folder đã ignore nếu artifact sinh ra từ pipeline.
3. Cập nhật `.env.example` nếu cần path mới.
4. Cập nhật module README consumer.