"""
inspect_kaggle_data.py — Smart Tourism Data Team
=========================================================
Bước 0: Khám phá cấu trúc dataset Kaggle đã tải về máy.
Chạy script này TRƯỚC để biết mình có gì trước khi push.

Hỗ trợ 2 chế độ:
  - Chế độ 1 (Mặc định): Đọc từ thư mục local đã giải nén sẵn
  - Chế độ 2 (--download): Tải mới từ Kaggle qua kagglehub

Cách chạy:
    python inspect_kaggle_data.py                         # Đọc local
    python inspect_kaggle_data.py --download              # Tải mới từ Kaggle
    python inspect_kaggle_data.py --path "D:\\custom\\dir" # Chỉ định thư mục khác

Cài thư viện (chỉ cần nếu dùng --download):
    pip install kagglehub
"""

import os
import sys
import json
import csv
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()

DATASET_ID = "nagahuy/tdtt-ver2"

# Đường dẫn mặc định tới thư mục data đã giải nén
DEFAULT_LOCAL_PATH = os.getenv("KAGGLE_DATASET_DIR", "./data/raw/tdtt-ver2")


def get_dataset_path() -> Path:
    """Xác định đường dẫn dataset dựa trên tham số dòng lệnh."""
    args = sys.argv[1:]

    # Chế độ 2: Tải từ Kaggle
    if "--download" in args:
        os.environ["KAGGLEHUB_CACHE"] = os.getenv("KAGGLEHUB_CACHE", os.path.join(os.getcwd(), "kaggle_cache"))
        import kagglehub
        print(f" Đang tải dataset từ Kaggle: {DATASET_ID} ...")
        path = Path(kagglehub.dataset_download(DATASET_ID))
        print(f" Dataset tải về tại: {path}\n")
        return path

    # Chế độ chỉ định path thủ công
    if "--path" in args:
        idx = args.index("--path")
        if idx + 1 < len(args):
            custom = Path(args[idx + 1])
            if custom.exists():
                return custom
            else:
                print(f" Đường dẫn không tồn tại: {custom}")
                sys.exit(1)

    # Chế độ 1 (Mặc định): Đọc từ local
    local = Path(DEFAULT_LOCAL_PATH)
    if local.exists():
        print(f" Dùng dữ liệu local: {local}\n")
        return local

    # Không tìm thấy dữ liệu local
    print(" Chưa có dữ liệu local!")
    print(f"   Đường dẫn kiểm tra: {DEFAULT_LOCAL_PATH}")
    print()
    print("   Hướng giải quyết:")
    print("     1. Chạy  python extract_dataset.py  để giải nén dataset đã tải")
    print("     2. Hoặc: python inspect_kaggle_data.py --download  (tải mới từ Kaggle)")
    print("     3. Hoặc: python inspect_kaggle_data.py --path \"D:\\duong\\dan\\khac\"")
    sys.exit(1)


def inspect_json(file: Path, base_path: Path):
    """In thông tin chi tiết của 1 file JSON."""
    print(f"\n FILE JSON: {file.relative_to(base_path)}")
    print("-" * 40)
    try:
        with open(file, encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, list):
            print(f"  Tổng số bản ghi : {len(data):,}")
            if data:
                first = data[0]
                print(f"  Các key (cột)   : {list(first.keys())}")
                print(f"  Dòng đầu tiên   :")
                for k, v in first.items():
                    print(f"    - {k}: {repr(v)[:100]}")
                # Hiển thị thêm dòng thứ 2 nếu có (để so sánh dữ liệu)
                if len(data) > 1:
                    print(f"  Dòng thứ hai    :")
                    for k, v in data[1].items():
                        print(f"    - {k}: {repr(v)[:100]}")
        elif isinstance(data, dict):
            print(f"  Các key gốc: {list(data.keys())}")
            # Hiển thị giá trị của từng key nếu không quá dài
            for k, v in data.items():
                preview = repr(v)[:120]
                print(f"    - {k}: {preview}")

    except MemoryError:
        print(f"    File quá lớn để load hết vào RAM, đọc 3 dòng đầu bằng streaming...")
        try:
            # Đọc streaming cho file JSON lớn (dạng array)
            with open(file, encoding="utf-8") as f:
                content = f.read(8192)  # Đọc 8KB đầu
            print(f"  8KB đầu file:\n{content[:500]}")
        except Exception as e2:
            print(f"   Vẫn không đọc được: {e2}")
    except Exception as e:
        print(f"   Không đọc được: {e}")


def inspect_csv(file: Path, base_path: Path):
    """In thông tin chi tiết của 1 file CSV."""
    print(f"\n FILE CSV: {file.relative_to(base_path)}")
    print("-" * 40)
    try:
        with open(file, encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        print(f"  Tổng số dòng    : {len(rows):,}")
        print(f"  Số cột          : {len(reader.fieldnames or [])}")
        print(f"  Các cột (header): {reader.fieldnames}")
        if rows:
            print(f"  Dòng đầu tiên   :")
            for k, v in rows[0].items():
                print(f"    - {k}: {repr(v)[:100]}")

    except Exception as e:
        print(f"   Không đọc được: {e}")


# 

print("=" * 60)
print("  BƯỚC 0 — KHÁM PHÁ CẤU TRÚC KAGGLE DATASET")
print("=" * 60 + "\n")

path = get_dataset_path()

#  1. In cây thư mục (giới hạn 300 mục để tránh tràn Terminal) 
print(" CÂY THƯ MỤC (tối đa 300 mục):")
print("-" * 50)
count = 0
MAX_TREE_ITEMS = 300
all_items = sorted(Path(path).rglob("*"))
total_items = len(all_items)

for item in all_items:
    if count >= MAX_TREE_ITEMS:
        print(f"\n    ... và {total_items - MAX_TREE_ITEMS:,} mục khác (đã ẩn bớt)")
        break
    depth = len(item.relative_to(path).parts) - 1
    indent = "    " * min(depth, 4)
    if item.is_dir():
        print(f"{indent} {item.name}/")
    else:
        size_kb = item.stat().st_size / 1024
        print(f"{indent} {item.name}  ({size_kb:.1f} KB)")
    count += 1

#  2. Khám phá JSON 
print("\n\n NỘI DUNG MẪU TỪNG FILE JSON:")
print("=" * 60)
json_files = sorted(Path(path).rglob("*.json"))
if json_files:
    for file in json_files:
        inspect_json(file, path)
else:
    print("  Không tìm thấy file JSON nào.")

#  3. Khám phá CSV 
print("\n\n NỘI DUNG MẪU TỪNG FILE CSV:")
print("=" * 60)
csv_files = sorted(Path(path).rglob("*.csv"))
if csv_files:
    for file in csv_files:
        inspect_csv(file, path)
else:
    print("  Không tìm thấy file CSV nào.")

#  4. Thống kê ảnh theo thư mục + xem mẫu metadata ảnh 
print("\n\n  THỐNG KÊ ẢNH:")
print("=" * 60)
img_extensions = {".jpg", ".jpeg", ".png", ".webp"}
img_dirs: dict[str, list] = {}

for file in Path(path).rglob("*"):
    if file.suffix.lower() in img_extensions:
        folder = str(file.parent.relative_to(path))
        if folder not in img_dirs:
            img_dirs[folder] = []
        img_dirs[folder].append(file)

if img_dirs:
    for folder, files in sorted(img_dirs.items()):
        print(f"\n   {folder or '.'}: {len(files):,} ảnh")
        # Hiện tên 5 file đầu làm mẫu
        for f in files[:5]:
            size_kb = f.stat().st_size / 1024
            print(f"      - {f.name}  ({size_kb:.1f} KB)")
        if len(files) > 5:
            print(f"      ... và {len(files) - 5:,} ảnh khác")

    total_imgs = sum(len(v) for v in img_dirs.values())
    print(f"\n   Tổng cộng: {total_imgs:,} ảnh trong {len(img_dirs)} thư mục")
else:
    print("  Không tìm thấy ảnh nào.")

#  5. Kiểm tra thư mục metadata ảnh (nếu có) 
print("\n\n METADATA ẢNH (thư mục 'metadata' hoặc file images_metadata.json):")
print("=" * 60)
meta_candidates = list(Path(path).rglob("*metadata*.json")) + \
                  list(Path(path).rglob("metadata/*.json"))
# Loại trùng
seen = set()
meta_files = []
for f in meta_candidates:
    if f not in seen:
        seen.add(f)
        meta_files.append(f)

if meta_files:
    for mf in meta_files:
        inspect_json(mf, path)
else:
    print("  Không tìm thấy file metadata ảnh riêng biệt.")
    print("  (Metadata ảnh có thể đã được nhúng sẵn trong tên file hoặc thư mục)")

#  6. Tóm tắt cuối 
print("\n" + "=" * 60)
print("   KHÁM PHÁ HOÀN TẤT")
print("=" * 60)
print(f"\n   Đường dẫn gốc dataset : {path}")
print(f"   Số file JSON          : {len(json_files)}")
print(f"   Số file CSV           : {len(csv_files)}")
total_imgs = sum(len(v) for v in img_dirs.values()) if img_dirs else 0
print(f"    Tổng số ảnh           : {total_imgs:,}")
print("\n   Lưu lại thông tin trên để cấu hình kaggle_to_supabase.py\n")
