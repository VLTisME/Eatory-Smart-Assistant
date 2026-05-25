# Google Maps Scraper

## 🎯 Mục đích

`google-maps-scraper/` là pipeline crawl Google Maps cho dữ liệu địa điểm ăn uống. Module này dùng Go scraper để lấy raw data, dùng Python để lọc/post-process, lưu vào PostgreSQL local và export metadata/ảnh cho các pipeline tiếp theo.

Hướng dẫn chạy crawl theo khu vực nằm ở [usage.md](usage.md).

## 🧩 Trách nhiệm

- Tạo query Google Maps theo khu vực.
- Crawl metadata địa điểm, review và URL ảnh bằng Go/Playwright.
- Lọc địa điểm thuộc nhóm ăn uống.
- Append raw data vào PostgreSQL local.
- Tải ảnh địa điểm về local.
- Export metadata JSON gồm places, reviews và images metadata.

Output từ module này được dùng tiếp bởi các scripts publish trong `data-engineering/scripts/`.

## 🔌 Public API

Public interface là CLI/Makefile:

- Go entrypoint: `main.go`
- Python post-processing: `scripts/food_pipeline.py`
- Makefile:
  - `make help`
  - `make build`
  - `make docker`
  - `make db-up`
  - `make db-down`
  - `make python-check`
  - `make test-go`
  - `make clean`

## 🧠 Cấu trúc

```text
google-maps-scraper/
|-- main.go                 # Entry point Go scraper
|-- gmaps/                  # Google Maps scraping logic
|-- runner/                 # Job runner
|-- grid/                   # Grid/bounding-box crawling
|-- deduper/                # Deduplicate jobs/results
|-- exiter/                 # Exit/inactivity handling
|-- scripts/
|   `-- food_pipeline.py    # Validate query, filter food places, append/export data
|-- sql_scripts/            # SQL clean/setup scripts
|-- docker-compose.yaml     # Postgres + pgAdmin local
|-- Dockerfile              # Scraper image
|-- Makefile                # Build/test helper commands
|-- requirements.txt        # Python post-processing dependencies
|-- usage.md                # Step-by-step crawl guide
`-- scraping_pipeline.png
```

Pipeline:

```text
query file
  -> Docker Go scraper
  -> gmaps-output/raw/<slug>.json
  -> python scripts/food_pipeline.py run-all
  -> PostgreSQL local
  -> gmaps-output/metadata/*.json
  -> gmaps-output/images/<place_id>/*.jpg
```

Output:

```text
gmaps-output/
|-- queries/
|   `-- <slug>.txt
|-- raw/
|   `-- <slug>.json
|-- images/
|   `-- <place_id>/
|       `-- <place_id>_001.jpg
`-- metadata/
    |-- places.json
    |-- raw_reviews.json
    `-- images_metadata.json
```

## 🔗 Dependencies

- Docker để build/run scraper image.
- Go toolchain nếu chạy Go tests/build trực tiếp.
- Python dependencies trong `requirements.txt` cho `food_pipeline.py`.
- PostgreSQL local từ `docker-compose.yaml`.
- pgAdmin optional để inspect dữ liệu.

## ⚙️ Configuration

PostgreSQL local:

```text
postgresql://postgres:postgres@localhost:5432/postgres
```

pgAdmin mặc định:

```text
URL: http://localhost:5050
Email: admin@example.com
Password: admin
```

Generated output như `gmaps-output/`, `postgres-data/`, `pgadmin-data/`, images và raw exports đã được ignore trong Git.

## 🚀 Ví dụ sử dụng

Cài Python dependencies:

```bash
cd data-engineering/google-maps-scraper
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Build Go scraper image:

```bash
docker build -t food-gmaps-scraper .
```

Hoặc dùng Makefile:

```bash
make docker
```

Chạy PostgreSQL/pgAdmin local:

```bash
docker compose up -d postgres pgadmin
```

Đọc guide đầy đủ:

```bash
sed -n '1,220p' usage.md
```

## 🧪 Testing

Python compile check:

```bash
python -m py_compile scripts/food_pipeline.py
```

Go package tests:

```bash
go test ./gmaps ./runner ./deduper ./grid ./exiter
```

Makefile shortcuts:

```bash
make python-check
make test-go
```

## 🧱 Extension guide

Thêm bước post-processing:

1. Thêm subcommand hoặc function vào `scripts/food_pipeline.py`.
2. Đảm bảo input/output nằm trong `gmaps-output/`.
3. Nếu cần SQL mới, đặt trong `sql_scripts/`.
4. Cập nhật `usage.md` nếu bước đó thuộc crawl workflow chính.

Thêm khu vực crawl mới:

1. Tạo query file trong `gmaps-output/queries/`.
2. Dùng slug rõ nghĩa theo khu vực.
3. Chạy validate query trước khi crawl.
4. Export metadata và ảnh sau khi append raw data.