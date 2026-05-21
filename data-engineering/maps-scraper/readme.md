# Maps Scraper

`maps-scraper/` là tool data-engineering để queue Google Maps URL, scrape metadata địa điểm/review, classify loại địa điểm và ghi kết quả vào PostgreSQL. Đây không phải public backend API cho frontend.

## Trách nhiệm

Module này sở hữu:

- Queue Google Maps URL.
- Scraping bằng Playwright.
- Lưu place/review vào PostgreSQL.
- Classify loại địa điểm cơ bản.
- Docker Compose cho database local của workflow scraping.

Module này không sở hữu:

- Route ứng dụng cho frontend.
- AI model inference.
- Supabase application query routes.
- Firebase Auth hoặc user data.

## Cấu trúc

```text
maps-scraper/
|-- server.py
|-- scraper.py
|-- database.py
|-- models.py
|-- schema.py
|-- classifier.py
|-- docker-compose.yml
|-- requirements.txt
`-- script/
    |-- migrate_enum.sql
    |-- silver_ddl.sql
    `-- silver_setup.sql
```

## Biến môi trường

Biến chính:

- `DATABASE_URL`
- `MAPS_SCRAPER_HOST`, chỉ dùng khi chạy `python server.py`.
- `MAPS_SCRAPER_PORT`, chỉ dùng khi chạy `python server.py`.

Fallback local mặc định:

```text
postgresql://postgres:postgres@localhost:5432/maps_reviews
```

Có thể tham khảo `data-engineering/.env.example` cho cấu hình chung của nhóm data-engineering.

## Cài đặt

Từ root của data-engineering:

```bash
cd data-engineering
pip install -r requirements.txt
playwright install chromium
```

Hoặc chỉ cài scraper:

```bash
cd data-engineering/maps-scraper
pip install -r requirements.txt
playwright install chromium
```

## Chạy database local

```bash
cd data-engineering/maps-scraper
docker compose up -d
```

## Chạy API scraper

```bash
uvicorn server:app --reload --host localhost --port 8201
```

Nếu chạy:

```bash
python server.py
```

port mặc định cũng là `8201`, trừ khi override bằng env.

## Endpoint

`POST /add-url`

Request:

```json
{
  "url": "https://maps.google.com/..."
}
```

Response:

```json
{
  "message": "URL queued",
  "queue_size": 1
}
```

Ví dụ:

```bash
curl -X POST http://localhost:8201/add-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://maps.google.com/..."}'
```

## Ghi chú vận hành

- Cần Playwright browser dependencies để scrape thật.
- Nên chạy với database local khi phát triển.
- Kiểm tra điều khoản sử dụng, rate limit và rủi ro bị chặn trước khi chạy job lớn.
- Không xem dữ liệu scrape tạm thời như source code; lưu output lớn ở artifact/storage phù hợp.
