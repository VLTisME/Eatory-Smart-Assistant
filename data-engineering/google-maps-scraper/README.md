# Google Maps Scraper

`google-maps-scraper/` là tool để scrape Google Maps bằng Go/Playwright, post-process bằng Python, lưu dữ liệu vào PostgreSQL local và export JSON/ảnh local.

Hướng dẫn chạy crawl chi tiết nằm ở [usage.md](usage.md).

## Trách nhiệm

Module này sở hữu:

- Tạo và validate query Google Maps.
- Scraping Google Maps bằng Go, Scrapemate và Playwright.
- Lấy metadata địa điểm, review và URL ảnh.
- Lọc dữ liệu địa điểm ăn uống.
- Tải ảnh về local.
- Lưu places, reviews và image metadata vào PostgreSQL.
- Export metadata JSON cho workflow data-engineering.

Module này không sở hữu:

- Route ứng dụng cho frontend.
- AI model inference.
- Supabase application query routes.

## Cấu trúc

```text
google-maps-scraper/
|-- main.go
|-- Dockerfile
|-- docker-compose.yaml
|-- requirements.txt
|-- usage.md
|-- gmaps/
|-- runner/
|-- grid/
|-- deduper/
|-- exiter/
`-- scripts/
    `-- food_pipeline.py
```

## Biến môi trường

DSN mặc định dùng trong command:

```text
postgresql://postgres:postgres@localhost:5432/postgres
```
## Pipeline

![Pipeline](./scraping_pipeline.png)

## Cài đặt

Cài Python dependency:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

Build Docker image scraper:

```bash
docker build -t food-gmaps-scraper .
```

Nếu cần cài Docker từ đầu, xem [usage.md](usage.md).

## Chạy database local

```bash
docker compose up -d postgres pgadmin
```

pgAdmin local:

```text
http://localhost:5050
```

## Chạy scraper

Luồng chạy chính:

```text
query file
  -> Docker Go scraper
  -> raw JSON
  -> Python pipeline
  -> PostgreSQL
  -> metadata JSON và ảnh local
```

Các hàm `crawl_area` và `append_area` được mô tả trong [usage.md](usage.md).

## Output

Output chính gồm:

- Raw JSON từ scraper.
- Metadata JSON.
- Clean reviews JSON nếu export riêng.
- Downloaded images.
- PostgreSQL tables cho places, reviews và image metadata.

## Ghi chú vận hành

- Cần Docker và Playwright browser trong image để scrape thật.
- Nên chạy PostgreSQL local khi phát triển.
- Cần kiểm tra điều khoản sử dụng, rate limit và rủi ro bị chặn trước khi chạy job lớn.

## Credit

Tool được phát triển dựa trên open-source code từ [gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper?fbclid=IwY2xjawR80IlleHRuA2FlbQIxMABicmlkETFOeUZEODVKdE9nTnBQNnhRc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHstNkSqbGAOsgUVoOUaljTU6fKq0frYGfALeDgzynB2vpMBrArmNW0SMutT5_aem_trSLLu1N5MgO2xyCOXEGvw)
