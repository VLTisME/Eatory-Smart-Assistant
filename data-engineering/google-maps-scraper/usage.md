# Food Google Maps Scraper Usage

Tài liệu này chỉ giữ các bước cần thiết để chạy pipeline scrape quán ăn uống theo từng khu vực:

1. Cài Docker, Python và dependency.
2. Start Postgres bằng Docker Compose.
3. Build image scraper.
4. Crawl raw JSON theo từng quận/khu vực.
5. Append raw JSON vào Postgres và export metadata.

## 1. Cài Python dependency

Chạy tại thư mục repo này:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

## 2. Start Postgres và build scraper

Start Postgres và pgAdmin:

```bash
docker compose up -d postgres pgadmin
```

Build image scraper:

```bash
docker build -t food-gmaps-scraper .
```

DSN mặc định cho pipeline:

```text
postgresql://postgres:postgres@localhost:5432/postgres
```

pgAdmin nếu cần xem DB:

```text
URL: http://localhost:5050
Email: admin@example.com
Password: admin
```

Khi register server trong pgAdmin:

```text
Host name/address: postgres
Port: 5432
Maintenance database: postgres
Username: postgres
Password: postgres
```

## 3. Khai báo script crawl

Khai báo các hàm dưới đây trong terminal hiện tại:

```bash
export DEPTH=10
export GRID_CELL=1.4
export CONCURRENCY=3

crawl_area() {
  slug="$1"
  area="$2"
  bbox="$3"

  mkdir -p gmaps-output/queries gmaps-output/raw

  cat > "gmaps-output/queries/${slug}.txt" <<EOF
quán ăn nhà hàng cơm phở bún bánh mì ở ${area} #!#${slug}_meal
cafe cà phê quán nước coffee ở ${area} #!#${slug}_cafe_drink
trà sữa tiệm bánh bakery dessert kem ở ${area} #!#${slug}_sweet_drink
lẩu nướng bbq buffet sushi pizza ở ${area} #!#${slug}_dining
EOF

  python scripts/food_pipeline.py validate-query \
    --query-file "gmaps-output/queries/${slug}.txt" || return 2

  docker run --rm \
    -v gmaps-playwright-cache:/opt \
    -v "$PWD/gmaps-output:/out" \
    food-gmaps-scraper \
    -input "/out/queries/${slug}.txt" \
    -results "/out/raw/${slug}.json" \
    -json \
    -extra-reviews \
    -depth "$DEPTH" \
    -c "$CONCURRENCY" \
    -lang vi \
    -region VN \
    -grid-bbox "$bbox" \
    -grid-cell "$GRID_CELL" \
    -zoom 17 \
    -exit-on-inactivity 20m || return 1
}
```

## 4. Khai báo script append raw vào Postgres

Hàm này đọc file `gmaps-output/raw/<slug>.json`, append quán mới vào Postgres, tải ảnh và export metadata JSON.

```bash
append_area() {
  slug="$1"

  python scripts/food_pipeline.py run-all \
    --raw "gmaps-output/raw/${slug}.json" \
    --dsn "postgresql://postgres:postgres@localhost:5432/postgres" \
    --out gmaps-output \
    --query-file "gmaps-output/queries/${slug}.txt" \
    --min-reviews 60 \
    --review-limit 60 \
    --min-total-reviews 80 \
    --download-images \
    --image-limit 15 \
    --image-size 1600 \
    --max-image-bytes 8388608 \
    --include-review-images \
    --timeout 10 \
    --min-source-images 10 \
    --min-images 10 \
    --append || return 1
}
```

## 5. Crawl và append từng quận/khu vực

```bash
# Quận 1, TP.HCM
crawl_area "quan_1_hcmc" "Quận 1 Thành phố Hồ Chí Minh" "10.753522,106.672782,10.793739,106.710120"
append_area "quan_1_hcmc"
```

```bash
# Quận 3, TP.HCM
crawl_area "quan_3_hcmc" "Quận 3 Thành phố Hồ Chí Minh" "10.771637,106.660335,10.795790,106.689780"
append_area "quan_3_hcmc"
```

```bash
# Quận 5, TP.HCM
crawl_area "quan_5_hcmc" "Quận 5 Thành phố Hồ Chí Minh" "10.746193,106.650481,10.765427,106.686997"
append_area "quan_5_hcmc"
```

```bash
# Quận 10, TP.HCM
crawl_area "quan_10_hcmc" "Quận 10 Thành phố Hồ Chí Minh" "10.756368,106.644554,10.788186,106.675245"
append_area "quan_10_hcmc"
```

```bash
# Bình Dương
crawl_area "binh_duong_old_province" "Bình Dương" "10.864755,106.324811,11.505376,106.963605"
append_area "binh_duong_old_province"
```

```bash
# Thành phố Thủ Đức, TP.HCM
crawl_area "tp_thu_duc_current" "Thành phố Thủ Đức Thành phố Hồ Chí Minh" "10.741676,106.692236,10.903333,106.881266"
append_area "tp_thu_duc_current"
```

## Ghi chú clean data sau khi append

Sau khi raw data đã được append vào PostgreSQL, sử dụng các script trong folder `sql_scripts/` để clean data, tạo bảng/tầng dữ liệu cần dùng và export kết quả về local.

Luồng xử lý tổng quát:

```text
raw data in PostgreSQL
  -> run SQL scripts in sql_scripts/
  -> clean/transform tables
  -> export cleaned data to local JSON
```

## 6. Output

Sau khi append, output nằm trong:

```text
gmaps-output/
  raw/
    <slug>.json
  queries/
    <slug>.txt
  images/
    <place_id>/
      <place_id>_001.jpg
  metadata/
    places.json
    raw_reviews.json
    images_metadata.json
```

`places.json`, `raw_reviews.json`, và `images_metadata.json` luôn được export từ Postgres.
