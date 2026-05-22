#!/usr/bin/env python3
import argparse
import datetime as dt
import decimal
import hashlib
import json
import re
import shutil
import sys
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

FOOD_QUERY_KEYWORDS = (
    "restaurant",
    "quán ăn",
    "nhà hàng",
    "cafe",
    "coffee",
    "cà phê",
    "bakery",
    "tiệm bánh",
    "tea",
    "trà sữa",
    "bar",
    "pub",
    "bistro",
    "buffet",
    "food",
    "dessert",
    "ice cream",
    "pizza",
    "sushi",
    "bbq",
    "hotpot",
    "lẩu",
    "phở",
    "bún",
    "cơm",
    "bánh mì",
)

FOOD_CATEGORY_KEYWORDS = (
    "restaurant",
    "cafe",
    "coffee shop",
    "bakery",
    "bar",
    "pub",
    "bistro",
    "buffet",
    "fast food",
    "food",
    "food court",
    "dessert",
    "ice cream",
    "pizza",
    "sushi",
    "barbecue",
    "bbq",
    "hot pot",
    "vietnamese restaurant",
    "quán ăn",
    "nhà hàng",
    "cà phê",
    "trà sữa",
    "tiệm bánh",
)

DEFAULT_IMAGE_LIMIT = 15
DEFAULT_IMAGE_SIZE = 1600
DEFAULT_MAX_IMAGE_BYTES = 8 * 1024 * 1024
DEFAULT_MIN_REVIEWS = 60
DEFAULT_MIN_IMAGES = 0
DEFAULT_REVIEW_LIMIT = 60
DEFAULT_MIN_TOTAL_REVIEWS = 100
DEFAULT_MIN_SOURCE_IMAGES = 0
REQUIRED_PLACE_FIELDS = ("place_id", "name", "address", "lat", "lng", "avg_rating", "total_reviews")
SOURCE = "google_maps"


def normalize_text(value):
    text = str(value or "").casefold()
    no_marks = "".join(
        ch for ch in unicodedata.normalize("NFD", text)
        if unicodedata.category(ch) != "Mn"
    )
    return f"{text} {no_marks}"


def matches_any(value, keywords):
    text = str(value or "").casefold()
    no_marks = "".join(
        ch for ch in unicodedata.normalize("NFD", text)
        if unicodedata.category(ch) != "Mn"
    )

    for keyword in keywords:
        keyword_text = str(keyword or "").casefold().strip()
        keyword_no_marks = "".join(
            ch for ch in unicodedata.normalize("NFD", keyword_text)
            if unicodedata.category(ch) != "Mn"
        ).strip()
        if keyword_text and keyword_text in text:
            return True
        if keyword_no_marks and keyword_no_marks in no_marks:
            return True
    return False


def load_queries(args):
    queries = list(args.query or [])
    if args.query_file:
        with Path(args.query_file).open(encoding="utf-8") as fh:
            queries.extend(line.strip() for line in fh if line.strip())
    return queries


def validate_queries(queries):
    invalid = [query for query in queries if not matches_any(query, FOOD_QUERY_KEYWORDS)]
    if invalid:
        for query in invalid:
            print(f"Invalid non-food query: {query}", file=sys.stderr)
        return False
    print(f"Validated {len(queries)} food queries")
    return True


def json_default(value):
    if isinstance(value, (dt.datetime, dt.date)):
        return value.isoformat()
    if isinstance(value, decimal.Decimal):
        return float(value)
    raise TypeError(f"Unsupported JSON value: {type(value).__name__}")


def write_json(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        json.dump(rows, fh, ensure_ascii=False, indent=2, default=json_default)
        fh.write("\n")


def load_raw_entries(path):
    text = Path(path).read_text(encoding="utf-8")
    data = parse_raw_json(text)
    return flatten_raw_entries(data)


def parse_raw_json(text):
    text = text.strip()
    if not text:
        return []

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    items = []
    decoder = json.JSONDecoder()
    index = 0
    length = len(text)

    while index < length:
        while index < length and text[index].isspace():
            index += 1
        if index >= length:
            break
        item, index = decoder.raw_decode(text, index)
        items.append(item)

    return items


def flatten_raw_entries(data):
    if isinstance(data, dict):
        data = data.get("results", data.get("places", []))
    if not isinstance(data, list):
        raise ValueError("Raw JSON must be a list of places")

    entries = []
    for item in data:
        if isinstance(item, dict):
            entries.append(item)
        elif isinstance(item, list):
            entries.extend(entry for entry in item if isinstance(entry, dict))

    return entries


def as_float(value):
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def as_int(value):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def first_value(mapping, *keys):
    for key in keys:
        if isinstance(mapping, dict) and key in mapping and mapping[key] not in (None, ""):
            return mapping[key]
    return None


def is_blank(value):
    return value is None or (isinstance(value, str) and not value.strip())


def stable_id(prefix, *parts):
    payload = "||".join("" if part is None else str(part) for part in parts)
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:32]
    return f"{prefix}_{digest}"


def entry_place_id(entry):
    return (
        first_value(entry, "place_id", "PlaceID")
        or first_value(entry, "cid", "Cid")
        or first_value(entry, "data_id", "DataID")
        or stable_id(
            "place",
            first_value(entry, "title", "Title"),
            first_value(entry, "address", "Address"),
            first_value(entry, "latitude", "Latitude"),
            first_value(entry, "longitude", "longtitude", "Longtitude"),
        )
    )


def entry_categories(entry):
    values = []
    for key in ("category", "Category"):
        value = entry.get(key)
        if isinstance(value, str):
            values.append(value)
    for key in ("categories", "Categories"):
        value = entry.get(key)
        if isinstance(value, list):
            values.extend(str(item) for item in value if item)
        elif isinstance(value, str):
            values.append(value)
    return values


def is_food_place(entry):
    return matches_any(" ".join(entry_categories(entry)), FOOD_CATEGORY_KEYWORDS)


def map_place(entry):
    complete = first_value(entry, "complete_address", "CompleteAddress") or {}
    place_id = entry_place_id(entry)
    return {
        "place_id": place_id,
        "name": first_value(entry, "title", "Title"),
        "type": "food",
        "address": first_value(entry, "address", "Address"),
        "district": first_value(complete, "borough", "Borough", "district", "District"),
        "city": first_value(complete, "city", "City"),
        "lat": as_float(first_value(entry, "latitude", "Latitude")),
        "lng": as_float(first_value(entry, "longitude", "longtitude", "Longitude", "Longtitude")),
        "source": SOURCE,
        "avg_rating": as_float(first_value(entry, "review_rating", "ReviewRating")),
        "total_reviews": as_int(first_value(entry, "review_count", "ReviewCount")),
    }


def missing_required_place_fields(place):
    return [field for field in REQUIRED_PLACE_FIELDS if is_blank(place.get(field))]


def extract_reviews(entry):
    extended = first_value(entry, "user_reviews_extended", "UserReviewsExtended")
    basic = first_value(entry, "user_reviews", "UserReviews")
    reviews = extended if isinstance(extended, list) and extended else basic
    return reviews if isinstance(reviews, list) else []


def clean_review_text(value):
    text = str(value or "").casefold()
    chars = []
    for ch in unicodedata.normalize("NFC", text):
        category = unicodedata.category(ch)
        if category[0] in ("L", "N") or ch.isspace():
            chars.append(ch)
    return re.sub(r"\s+", " ", "".join(chars)).strip()


def raw_review_timestamp(raw):
    return first_value(
        raw,
        "timestamp",
        "Timestamp",
        "date",
        "Date",
        "published_at",
        "PublishedAt",
    )


def map_reviews(place_id, raw_reviews, limit):
    raw_rows = []
    clean_rows = []
    seen = set()
    if limit <= 0:
        return raw_rows, clean_rows

    for raw in raw_reviews:
        if not isinstance(raw, dict):
            continue
        text = first_value(raw, "Description", "description", "Text", "text")
        rating = as_int(first_value(raw, "Rating", "rating"))
        if not text or rating is None or not 1 <= rating <= 5:
            continue

        raw_text = str(text).strip()
        clean_text = clean_review_text(raw_text)
        if not raw_text or not clean_text:
            continue

        reviewer = first_value(raw, "Name", "name", "author_name")
        when = first_value(raw, "When", "when", "relative_time_description")
        dedupe_key = (reviewer, raw_text, rating, when)
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)

        index = len(clean_rows) + 1
        review_id = stable_id("review", place_id, reviewer, raw_text, rating, when, index)
        raw_rows.append({
            "review_id": review_id,
            "place_id": place_id,
            "text": raw_text,
            "rating": rating,
            "timestamp": raw_review_timestamp(raw),
            "source": SOURCE,
        })
        clean_rows.append({
            "review_id": review_id,
            "place_id": place_id,
            "text": clean_text,
            "rating": rating,
            "timestamp": None,
            "source": SOURCE,
        })
        if len(clean_rows) >= limit:
            break
    return raw_rows, clean_rows


def extract_image_urls(entry, limit):
    urls = []
    seen = set()
    images = first_value(entry, "images", "Images") or []
    for item in images:
        url = first_value(item, "image", "Image") if isinstance(item, dict) else str(item)
        if not url or url in seen:
            continue
        seen.add(url)
        urls.append(url)
        if limit and len(urls) >= limit:
            break
    return urls


def extract_review_image_urls(reviews):
    urls = []
    seen = set()
    for review in reviews:
        if not isinstance(review, dict):
            continue
        images = first_value(review, "Images", "images") or []
        if not isinstance(images, list):
            continue
        for item in images:
            url = first_value(item, "image", "Image") if isinstance(item, dict) else str(item)
            if not url or url in seen:
                continue
            seen.add(url)
            urls.append(url)
    return urls


def merge_image_urls(*groups, limit=None):
    urls = []
    seen = set()
    for group in groups:
        for url in group:
            if not url or url in seen:
                continue
            seen.add(url)
            urls.append(url)
            if limit and len(urls) >= limit:
                return urls
    return urls


def high_res_image_url(url, size):
    if size <= 0:
        return url
    if not re.search(r"(googleusercontent\.com|lh\d+\.google)", url):
        return url

    replacement = f"=s{size}"
    updated = re.sub(r"=w\d+-h\d+", replacement, url, count=1)
    if updated != url:
        return updated

    updated = re.sub(r"=s\d+", replacement, url, count=1)
    if updated != url:
        return updated

    if "=" not in url.rsplit("/", 1)[-1]:
        return f"{url}{replacement}"
    return url


def extension_for_content_type(content_type):
    content_type = (content_type or "").split(";")[0].strip().casefold()
    return {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }.get(content_type, ".jpg")


def download_image(url, out_dir, place_id, index, timeout, image_size, max_image_bytes):
    download_url = high_res_image_url(url, image_size)
    request = urllib.request.Request(download_url, headers={"User-Agent": "Mozilla/5.0"})
    abs_tmp = None
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            content_type = response.headers.get("Content-Type", "")
            content_length = as_int(response.headers.get("Content-Length"))
            if max_image_bytes > 0 and content_length and content_length > max_image_bytes:
                raise ValueError(f"image too large: {content_length} bytes")

            extension = extension_for_content_type(content_type)
            rel_path = Path("images") / place_id / f"{place_id}_{index:03d}{extension}"
            abs_path = out_dir / rel_path
            abs_tmp = abs_path.with_name(f"{abs_path.name}.part")
            abs_path.parent.mkdir(parents=True, exist_ok=True)
            size = 0
            with abs_tmp.open("wb") as fh:
                while True:
                    chunk = response.read(1024 * 64)
                    if not chunk:
                        break
                    size += len(chunk)
                    if max_image_bytes > 0 and size > max_image_bytes:
                        raise ValueError(f"image too large: {size} bytes")
                    fh.write(chunk)
            abs_tmp.replace(abs_path)
            return {
                "file_path": rel_path.as_posix(),
                "download_status": "downloaded",
                "content_type": content_type or None,
                "file_size": size,
                "error": None,
            }
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as exc:
        if abs_tmp and abs_tmp.exists():
            abs_tmp.unlink()
        return {
            "file_path": None,
            "download_status": "failed",
            "content_type": None,
            "file_size": None,
            "error": str(exc),
        }


def map_images(image_urls, place_id, out_dir, limit, download, timeout, image_size, max_image_bytes):
    rows = []
    for index, url in enumerate(image_urls[:limit], start=1):
        image_id = stable_id("image", place_id, url, index)
        if download:
            metadata = download_image(url, out_dir, place_id, index, timeout, image_size, max_image_bytes)
        else:
            metadata = {
                "file_path": None,
                "download_status": "skipped",
                "content_type": None,
                "file_size": None,
                "error": None,
            }
        rows.append({
            "image_id": image_id,
            "place_id": place_id,
            "image_url": url,
            **metadata,
            "tags": [],
            "downloaded_at": dt.datetime.now(dt.timezone.utc) if metadata["download_status"] == "downloaded" else None,
        })
    return rows


def connect(dsn):
    try:
        import psycopg
    except ImportError as exc:
        raise SystemExit("Missing dependency. Run: pip install -r requirements.txt") from exc
    return psycopg.connect(dsn)


def ensure_schema(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS places (
            place_id TEXT PRIMARY KEY,
            name TEXT NULL,
            "type" TEXT NULL,
            address TEXT NULL,
            district TEXT NULL,
            city TEXT NULL,
            lat DOUBLE PRECISION NULL,
            lng DOUBLE PRECISION NULL,
            source TEXT NULL,
            avg_rating DOUBLE PRECISION NULL,
            total_reviews INTEGER NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS raw_reviews (
            review_id TEXT PRIMARY KEY,
            place_id TEXT NOT NULL REFERENCES places(place_id) ON DELETE CASCADE,
            text TEXT NULL,
            rating INTEGER NULL,
            "timestamp" TEXT NULL,
            source TEXT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            review_id TEXT PRIMARY KEY,
            place_id TEXT NOT NULL REFERENCES places(place_id) ON DELETE CASCADE,
            text TEXT NULL,
            rating INTEGER NULL,
            "timestamp" TIMESTAMPTZ NULL,
            source TEXT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS images_metadata (
            image_id TEXT PRIMARY KEY,
            place_id TEXT NOT NULL REFERENCES places(place_id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            file_path TEXT NULL,
            download_status TEXT NOT NULL,
            content_type TEXT NULL,
            file_size BIGINT NULL,
            error TEXT NULL,
            tags JSONB NULL,
            downloaded_at TIMESTAMPTZ NULL
        )
    """)
    conn.execute('ALTER TABLE places ADD COLUMN IF NOT EXISTS "type" TEXT NULL')
    conn.execute("ALTER TABLE raw_reviews ADD COLUMN IF NOT EXISTS text TEXT NULL")
    conn.execute("ALTER TABLE raw_reviews ADD COLUMN IF NOT EXISTS rating INTEGER NULL")
    conn.execute('ALTER TABLE raw_reviews ADD COLUMN IF NOT EXISTS "timestamp" TEXT NULL')
    conn.execute("ALTER TABLE raw_reviews ADD COLUMN IF NOT EXISTS source TEXT NULL")
    conn.execute("ALTER TABLE images_metadata ADD COLUMN IF NOT EXISTS file_path TEXT NULL")
    conn.execute("ALTER TABLE images_metadata ADD COLUMN IF NOT EXISTS tags JSONB NULL")
    conn.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = 'raw_reviews'
                  AND column_name = 'raw'
            ) THEN
                EXECUTE 'ALTER TABLE raw_reviews ALTER COLUMN raw DROP NOT NULL';
            END IF;
        END $$;
    """)
    conn.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = 'images_metadata'
                  AND column_name = 'local_path'
            ) THEN
                EXECUTE 'UPDATE images_metadata SET file_path = local_path WHERE file_path IS NULL';
            END IF;
        END $$;
    """)
    conn.commit()


def reset_tables(conn):
    conn.execute("TRUNCATE images_metadata, reviews, raw_reviews, places")
    conn.commit()


def reset_output_files(out_dir):
    images_dir = out_dir / "images"
    if images_dir.exists():
        shutil.rmtree(images_dir)

    metadata_dir = out_dir / "metadata"
    for name in ("places.json", "raw_reviews.json", "clean_reviews.json", "images_metadata.json"):
        path = metadata_dir / name
        if path.exists():
            path.unlink()


def insert_rows(conn, places, raw_reviews, clean_reviews, images):
    from psycopg.types.json import Jsonb

    for row in places:
        conn.execute("""
            INSERT INTO places
                (place_id, name, "type", address, district, city, lat, lng, source, avg_rating, total_reviews)
            VALUES
                (%(place_id)s, %(name)s, %(type)s, %(address)s, %(district)s, %(city)s, %(lat)s, %(lng)s, %(source)s, %(avg_rating)s, %(total_reviews)s)
            ON CONFLICT (place_id) DO NOTHING
        """, row)

    for row in raw_reviews:
        conn.execute("""
            INSERT INTO raw_reviews (review_id, place_id, text, rating, "timestamp", source)
            VALUES (%(review_id)s, %(place_id)s, %(text)s, %(rating)s, %(timestamp)s, %(source)s)
            ON CONFLICT (review_id) DO NOTHING
        """, row)

    for row in clean_reviews:
        conn.execute("""
            INSERT INTO reviews (review_id, place_id, text, rating, "timestamp", source)
            VALUES (%(review_id)s, %(place_id)s, %(text)s, %(rating)s, %(timestamp)s, %(source)s)
            ON CONFLICT (review_id) DO NOTHING
        """, row)

    for row in images:
        params = {**row, "tags": Jsonb(row["tags"])}
        conn.execute("""
            INSERT INTO images_metadata
                (image_id, place_id, image_url, file_path, download_status, content_type, file_size, error, tags, downloaded_at)
            VALUES
                (%(image_id)s, %(place_id)s, %(image_url)s, %(file_path)s, %(download_status)s, %(content_type)s, %(file_size)s, %(error)s, %(tags)s, %(downloaded_at)s)
            ON CONFLICT (image_id) DO NOTHING
        """, params)

    conn.commit()


def load_existing_place_ids(dsn):
    with connect(dsn) as conn:
        ensure_schema(conn)
        with conn.cursor() as cur:
            cur.execute("SELECT place_id FROM places")
            return {row[0] for row in cur.fetchall()}


def import_raw(args):
    if args.review_limit < args.min_reviews:
        print("--review-limit must be greater than or equal to --min-reviews", file=sys.stderr)
        return 2

    queries = load_queries(args)
    if queries and not validate_queries(queries):
        return 2

    entries = load_raw_entries(args.raw)
    out_dir = Path(args.out)
    if not args.append:
        reset_output_files(out_dir)

    food_entries = [entry for entry in entries if is_food_place(entry)]
    existing_place_ids = load_existing_place_ids(args.dsn) if args.append else set()

    places = []
    raw_reviews = []
    clean_reviews = []
    images = []
    seen_places = set()
    skipped = {}

    def skip(reason):
        skipped[reason] = skipped.get(reason, 0) + 1

    for entry in food_entries:
        place = map_place(entry)
        missing = missing_required_place_fields(place)
        if missing:
            skip("missing required fields")
            continue

        if place["place_id"] in seen_places:
            skip("duplicate place")
            continue
        seen_places.add(place["place_id"])

        if place["place_id"] in existing_place_ids:
            skip("existing place")
            continue

        if place["total_reviews"] <= args.min_total_reviews:
            skip("not enough total reviews")
            continue

        reviews = extract_reviews(entry)
        listing_image_urls = extract_image_urls(entry, None)
        review_image_urls = extract_review_image_urls(reviews) if args.include_review_images else []
        image_urls = merge_image_urls(listing_image_urls, review_image_urls, limit=args.image_limit)
        if len(image_urls) <= args.min_source_images:
            skip("not enough source images")
            continue

        raw_rows, clean_rows = map_reviews(place["place_id"], reviews, args.review_limit)
        if len(clean_rows) < args.min_reviews:
            skip("not enough clean reviews")
            continue

        image_rows = map_images(
            image_urls,
            place["place_id"],
            out_dir,
            args.image_limit,
            not args.no_download_images,
            args.timeout,
            args.image_size,
            args.max_image_bytes,
        )
        downloaded_images = sum(1 for row in image_rows if row["download_status"] == "downloaded")
        if not args.no_download_images and downloaded_images < args.min_images:
            skip("not enough downloaded images")
            continue

        places.append(place)
        raw_reviews.extend(raw_rows)
        clean_reviews.extend(clean_rows)
        images.extend(image_rows)

    with connect(args.dsn) as conn:
        ensure_schema(conn)
        if not args.append:
            reset_tables(conn)
        insert_rows(conn, places, raw_reviews, clean_reviews, images)

    print(f"Imported {len(places)} food places")
    print(f"Imported {len(raw_reviews)} raw reviews")
    print(f"Imported {len(clean_reviews)} clean reviews")
    print(f"Processed {len(images)} images")
    if skipped:
        details = ", ".join(f"{count} {reason}" for reason, count in sorted(skipped.items()))
        print(f"Skipped {details}")
    return 0


def fetch_rows(conn, sql):
    from psycopg.rows import dict_row
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql)
        return [dict(row) for row in cur.fetchall()]


def export_json(args):
    out_dir = Path(args.out)
    with connect(args.dsn) as conn:
        ensure_schema(conn)
        places = fetch_rows(conn, """
            SELECT
                place_id,
                name,
                COALESCE("type", 'food') AS type,
                address,
                district,
                city,
                lat,
                lng,
                avg_rating,
                total_reviews,
                source
            FROM places
            ORDER BY name NULLS LAST, place_id
        """)
        raw_reviews = fetch_rows(conn, """
            SELECT review_id, place_id, text, rating, "timestamp", source
            FROM raw_reviews
            ORDER BY place_id, review_id
        """)
        images = fetch_rows(conn, """
            SELECT image_id, place_id, file_path, COALESCE(tags, '[]'::jsonb) AS tags
            FROM images_metadata
            WHERE file_path IS NOT NULL
            ORDER BY place_id, image_id
        """)

    metadata_dir = out_dir / "metadata"
    clean_reviews_path = metadata_dir / "clean_reviews.json"
    if clean_reviews_path.exists():
        clean_reviews_path.unlink()
    write_json(metadata_dir / "places.json", places)
    write_json(metadata_dir / "raw_reviews.json", raw_reviews)
    write_json(metadata_dir / "images_metadata.json", images)
    print(f"Exported JSON files to {metadata_dir}")
    return 0


def validate_counts(args):
    failed = False
    with connect(args.dsn) as conn:
        rows = fetch_rows(conn, """
            SELECT
                p.place_id,
                p.name,
                p.total_reviews,
                COUNT(DISTINCT r.review_id) AS clean_reviews,
                COUNT(DISTINCT i.image_id) FILTER (WHERE i.download_status = 'downloaded') AS downloaded_images
            FROM places p
            LEFT JOIN reviews r ON r.place_id = p.place_id
            LEFT JOIN images_metadata i ON i.place_id = p.place_id
            GROUP BY p.place_id, p.name, p.total_reviews
            ORDER BY p.name NULLS LAST, p.place_id
        """)
    for row in rows:
        if (
            row["total_reviews"] <= args.min_total_reviews
            or row["clean_reviews"] < args.min_reviews
            or row["downloaded_images"] < args.min_images
        ):
            failed = True
            print(
                "Validation failed: "
                f"{row['name'] or row['place_id']} has "
                f"{row['total_reviews']} total reviews, "
                f"{row['clean_reviews']} clean reviews and "
                f"{row['downloaded_images']} downloaded images",
                file=sys.stderr,
            )
    if not rows:
        print("Validation failed: no food places found", file=sys.stderr)
        return False
    if not failed:
        print("Validation passed")
    return not failed


def run_all(args):
    status = import_raw(args)
    if status != 0:
        return status
    status = export_json(args)
    if status != 0:
        return status
    return 0 if validate_counts(args) else 1


def add_query_args(parser):
    parser.add_argument("--query", action="append", help="Food query to validate")
    parser.add_argument("--query-file", help="File with one query per line")


def add_db_args(parser):
    parser.add_argument("--dsn", required=True, help="Postgres DSN")
    parser.add_argument("--out", default="gmaps-output", help="Output directory")


def add_import_args(parser):
    parser.add_argument("--raw", required=True, help="Raw JSON from the Go scraper")
    parser.add_argument("--image-limit", type=int, default=DEFAULT_IMAGE_LIMIT)
    parser.add_argument("--image-size", type=int, default=DEFAULT_IMAGE_SIZE, help="Requested Google image size in pixels; use 0 to keep scraper URLs")
    parser.add_argument("--max-image-bytes", type=int, default=DEFAULT_MAX_IMAGE_BYTES, help="Skip images larger than this many bytes; use 0 to disable")
    parser.add_argument("--include-review-images", action="store_true", help="Add image URLs attached to reviews after listing images")
    parser.add_argument("--timeout", type=float, default=30.0, help="Image download timeout in seconds")
    parser.add_argument("--append", action="store_true", help="Append without updating existing rows")
    image_download = parser.add_mutually_exclusive_group()
    image_download.add_argument(
        "--download-images",
        dest="no_download_images",
        action="store_false",
        default=False,
        help="Download listing images to the output directory",
    )
    image_download.add_argument(
        "--no-download-images",
        dest="no_download_images",
        action="store_true",
        help="Store image URLs without downloading files",
    )
    parser.add_argument("--min-reviews", type=int, default=DEFAULT_MIN_REVIEWS)
    parser.add_argument("--min-images", type=int, default=DEFAULT_MIN_IMAGES)
    parser.add_argument("--review-limit", type=int, default=DEFAULT_REVIEW_LIMIT)
    parser.add_argument("--min-total-reviews", type=int, default=DEFAULT_MIN_TOTAL_REVIEWS)
    parser.add_argument("--min-source-images", type=int, default=DEFAULT_MIN_SOURCE_IMAGES)


def build_parser():
    parser = argparse.ArgumentParser(description="Food-only Google Maps post-processing pipeline")
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate_parser = subparsers.add_parser("validate-query", help="Validate food-only queries")
    add_query_args(validate_parser)
    validate_parser.set_defaults(func=lambda args: 0 if validate_queries(load_queries(args)) else 2)

    import_parser = subparsers.add_parser("import", help="Import raw scraper JSON into Postgres")
    add_query_args(import_parser)
    add_db_args(import_parser)
    add_import_args(import_parser)
    import_parser.set_defaults(func=import_raw)

    export_parser = subparsers.add_parser("export", help="Export typed JSON files from Postgres")
    add_db_args(export_parser)
    export_parser.set_defaults(func=export_json)

    run_parser = subparsers.add_parser("run-all", help="Import raw JSON, export files, and validate counts")
    add_query_args(run_parser)
    add_db_args(run_parser)
    add_import_args(run_parser)
    run_parser.set_defaults(func=run_all)

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    if args.command == "validate-query" and not load_queries(args):
        print("No queries provided", file=sys.stderr)
        return 2
    try:
        return args.func(args)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
