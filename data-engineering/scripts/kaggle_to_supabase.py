"""
kaggle_to_supabase.py — Smart Tourism Data Team
=========================================================
Script tổng hợp: Tải data từ Kaggle  Ánh xạ sang Schema Supabase  Push lên Cloud.

Yêu cầu:
  1. File .env đã được điền đầy đủ (xem .env.example)
  2. Đã chạy inspect_kaggle_data.py để biết tên file & cột thực tế trong dataset

Cài thư viện:
    pip install kagglehub supabase python-dotenv tqdm

Cách chạy:
    python kaggle_to_supabase.py
"""

import os
import json
import csv
import time
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm

load_dotenv()

# 
#    KHU VỰC CẤU HÌNH — Chỉnh sửa sau khi chạy inspect_kaggle_data.py
# 

# Đường dẫn thư mục dataset đã giải nén trên máy
# (Chạy python extract_dataset.py trước nếu chưa giải nén)
DATASET_LOCAL_PATH = r"D:\HieuLT\TDTT\Tutorial\kaggle_cache\datasets\nagahuy\tdtt-ver2\data"

# --- Tên file JSON/CSV trong dataset (xem kết quả inspect_kaggle_data.py) ---
PLACES_FILE    = "places.json"        # TODO: Điền đúng tên sau khi inspect
REVIEWS_FILE   = "clean_reviews.json" # TODO: Điền đúng tên sau khi inspect

# --- Ánh xạ tên cột: { "tên_cột_trong_kaggle": "tên_cột_trong_supabase" } ---
PLACES_COLUMN_MAP = {
    "place_id"     : "place_id",
    "name"         : "name",
    "type"         : "type",
    "address"      : "address",
    "district"     : "district",
    "city"         : "city",
    "lat"          : "lat",
    "lng"          : "lng",
    "avg_rating"   : "avg_rating",
    "total_reviews": "total_reviews",
    "source"       : "source",
}

REVIEWS_COLUMN_MAP = {
    "place_id" : "place_id",
    "text"     : "text",
    "rating"   : "rating",
    "timestamp": "timestamp",  # Thêm từ data thực tế (có thể NULL)
    "source"   : "source",     # Thêm từ data thực tế (google_maps, ...)
}

# --- Thông số push ---
PLACES_BATCH_SIZE  = 200   # Nhỏ để tránh vượt giới hạn payload PostgREST
REVIEWS_BATCH_SIZE = 500   # Supabase giới hạn ~256KB/request  batch nhỏ cho an toàn
DELAY_SECONDS      = 0.3
MAX_REVIEW_LENGTH  = 2000  # Cắt bớt text để giảm kích thước mỗi batch

# Dùng upsert thay insert: chạy lại script không bị lỗi duplicate key
USE_UPSERT = True

# 
#  Không cần chỉnh sửa phần bên dưới
# 

def validate_env():
    """Kiểm tra tất cả biến môi trường bắt buộc trước khi chạy."""
    missing = [v for v in ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"]
               if not os.environ.get(v)]
    if missing:
        print(" Thiếu các biến môi trường sau trong file .env:")
        for v in missing:
            print(f"   - {v}")
        raise SystemExit(1)
    # Kiểm tra thư mục dataset local
    if not Path(DATASET_LOCAL_PATH).exists():
        print(f" Không tìm thấy thư mục dataset: {DATASET_LOCAL_PATH}")
        print("   Hãy chạy: python extract_dataset.py  trước.")
        raise SystemExit(1)
    print(" Tất cả biến môi trường hợp lệ.\n")


def connect_supabase() -> Client:
    client = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"]
    )
    print(" Kết nối Supabase thành công!\n")
    return client


def get_dataset_path() -> Path:
    """Trả về đường dẫn dataset local (đã giải nén sẵn)."""
    path = Path(DATASET_LOCAL_PATH)
    print(f" Đọc dataset từ local: {path}\n")
    return path


def find_file(base_path: Path, filename: str) -> Path | None:
    """Tìm file trong toàn bộ cây thư mục dataset."""
    results = list(base_path.rglob(filename))
    if not results:
        print(f"  Không tìm thấy '{filename}' trong dataset.")
        return None
    if len(results) > 1:
        print(f"  Nhiều file trùng tên '{filename}' — Dùng: {results[0]}")
    return results[0]


def load_and_map(file_path: Path, column_map: dict, required_key: str = "place_id") -> list[dict]:
    """Đọc file JSON/CSV, ánh xạ cột, lọc dòng lỗi, ép kiểu số."""
    suffix = file_path.suffix.lower()

    if suffix == ".json":
        with open(file_path, encoding="utf-8") as f:
            raw_data = json.load(f)
    elif suffix == ".csv":
        with open(file_path, encoding="utf-8", newline="") as f:
            raw_data = list(csv.DictReader(f))
    else:
        raise ValueError(f"Định dạng file không hỗ trợ: {suffix}")

    mapped, skipped = [], 0
    for row in raw_data:
        new_row = {}
        for src_col, dst_col in column_map.items():
            if src_col not in row:
                continue
            value = row[src_col]

            # Ép kiểu số (CSV đọc mọi thứ thành string)
            if dst_col in ("lat", "lng", "avg_rating"):
                try:    value = float(value)
                except: value = None
            elif dst_col in ("total_reviews", "rating"):
                try:    value = int(float(value))
                except: value = None

            # Cắt bớt text quá dài
            if dst_col == "text" and isinstance(value, str):
                value = value[:MAX_REVIEW_LENGTH]

            new_row[dst_col] = value

        # Bỏ qua dòng thiếu khóa bắt buộc
        if not new_row.get(required_key):
            skipped += 1
            continue

        mapped.append(new_row)

    print(f"    {file_path.name}: {len(mapped):,} bản ghi hợp lệ"
          + (f" (bỏ qua {skipped} dòng thiếu '{required_key}')" if skipped else ""))
    return mapped


def push_to_supabase(
    supabase: Client, table: str, data: list[dict],
    batch_size: int, delay: float, upsert: bool = False
):
    """Đẩy dữ liệu lên Supabase theo mẻ. Hỗ trợ cả insert và upsert."""
    if not data:
        print(f"    Không có dữ liệu để push vào '{table}'.")
        return 0

    total, success, errors = len(data), 0, 0
    action = "upsert" if upsert else "insert"
    print(f"\n {action.upper()} {total:,} bản ghi  '{table}' (batch={batch_size}):")

    with tqdm(total=total, unit="rows") as pbar:
        for i in range(0, total, batch_size):
            batch = data[i : i + batch_size]
            try:
                if upsert:
                    supabase.table(table).upsert(batch).execute()
                else:
                    supabase.table(table).insert(batch).execute()
                success += len(batch)
                pbar.update(len(batch))
                time.sleep(delay)
            except Exception as e:
                errors += len(batch)
                pbar.update(len(batch))
                # In lỗi ngắn gọn, KHÔNG dừng — tiếp tục mẻ tiếp theo
                tqdm.write(f"    Mẻ [{i}:{i+len(batch)}] lỗi: {str(e)[:120]}")
                time.sleep(delay * 2)  # Chờ lâu hơn sau lỗi

    if errors:
        print(f"     Thành công: {success:,}/{total:,}  |  Lỗi: {errors:,} rows")
        print(f"       Thử chạy lại script — upsert sẽ bỏ qua rows đã có sẵn.")
    else:
        print(f"    Thành công: {success:,}/{total:,}")
    return success


def verify_push(supabase: Client):
    """Đếm số dòng trên Supabase sau khi push để xác nhận kết quả."""
    print(" Kiểm tra kết quả trên Supabase:")
    print("-" * 40)
    # Chỉ kiểm tra các bảng đang active
    for table in ["places", "clean_reviews"]:
        try:
            res = supabase.table(table).select("*", count="exact").limit(0).execute()
            count = res.count if res.count is not None else "N/A"
            print(f"    {table:<22}: {count:>6} bản ghi")
        except Exception as e:
            print(f"    {table}: {e}")
    # Bảng chờ AI Team fill
    for table in ["place_summaries", "image_embeddings"]:
        try:
            res = supabase.table(table).select("*", count="exact").limit(0).execute()
            count = res.count if res.count is not None else "N/A"
            print(f"    {table:<22}: {count:>6} bản ghi   AI/Image Team fill sau")
        except Exception as e:
            print(f"    {table}: {e}")
    print()


def confirm(prompt: str) -> bool:
    return input(f"\n {prompt} (y/n): ").strip().lower() == "y"


def main():
    print("=" * 60)
    print("  SMART TOURISM — KAGGLE  SUPABASE PIPELINE")
    print("=" * 60 + "\n")

    # B0: Kiểm tra .env và đường dẫn local
    validate_env()

    # B1: Kết nối Supabase
    supabase = connect_supabase()

    # B2: Lấy đường dẫn dataset local (đã giải nén)
    dataset_path = get_dataset_path()

    # B3: Push Places (phải push TRƯỚC reviews vì reviews có FK  places)
    places_file = find_file(dataset_path, PLACES_FILE)
    if places_file and confirm(f"Push PLACES từ '{places_file.name}'?"):
        places = load_and_map(places_file, PLACES_COLUMN_MAP, required_key="place_id")
        push_to_supabase(supabase, "places", places, PLACES_BATCH_SIZE, DELAY_SECONDS, USE_UPSERT)

    # B4: Push Reviews (sau Places)
    reviews_file = find_file(dataset_path, REVIEWS_FILE)
    if reviews_file and confirm(f"Push REVIEWS từ '{reviews_file.name}'?"):
        reviews = load_and_map(reviews_file, REVIEWS_COLUMN_MAP, required_key="place_id")
        push_to_supabase(supabase, "clean_reviews", reviews, REVIEWS_BATCH_SIZE, DELAY_SECONDS, USE_UPSERT)

    #  Các bước dưới đây chưa triển khai (TODO cho AI Team) 
    # B5: Push Image Embeddings
    #  Chạy riêng: python upload_images_imgur.py  (upload ảnh lên Imgur)
    #  Chạy riêng: python encode_clip.py          (tạo vector CLIP, fill cột embedding)

    # B6: Push Place Summaries (AI-generated summary)
    #  Chưa có script, AI Team sẽ làm sau
    # 

    # B7: Kiểm tra kết quả
    verify_push(supabase)

    print(" Pipeline hoàn tất! Vào Supabase  Table Editor để kiểm tra chi tiết.")


if __name__ == "__main__":
    main()
