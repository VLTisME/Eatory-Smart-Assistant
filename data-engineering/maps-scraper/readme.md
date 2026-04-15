# Maps Scraper

Tool này nhận URL Google Maps qua API, scrape metadata địa điểm và review, rồi lưu vào PostgreSQL.

## Run

```bash
docker compose up -d
uvicorn server:app --reload
```

Queue một URL:

```bash
curl -X POST http://localhost:8000/add-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://maps.google.com/..."}'
```

Cần Playwright, PostgreSQL và `DATABASE_URL` hợp lệ nếu không dùng cấu hình mặc định.
