# -*- coding: utf-8 -*-
import sys, io
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

"""
upload_images_cloudinary.py - Smart Tourism Data Team (BE)
==========================================================
Upload anh tu dataset Kaggle local -> Cloudinary CDN -> Luu link vao Supabase.

Yeu cau trong file .env:
  SUPABASE_URL=...
  SUPABASE_SERVICE_KEY=...
  CLOUDINARY_CLOUD_NAME=...
  CLOUDINARY_API_KEY=...
  CLOUDINARY_API_SECRET=...

Cai thu vien:
  pip install cloudinary supabase python-dotenv tqdm

Cach chay:
  python upload_images_cloudinary.py
"""

import os
import json
import time
import uuid
import threading
import cloudinary
import cloudinary.uploader
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed


load_dotenv()

# CONFIG

IMAGES_ROOT = os.getenv("LOCAL_IMAGES_ROOT", os.getenv("KAGGLE_DATASET_DIR", "./data/raw/tdtt-ver2"))
IMAGES_SUBDIR = os.getenv("LOCAL_IMAGES_SUBDIR", "images")
CLOUDINARY_ROOT = os.getenv("CLOUDINARY_ROOT_FOLDER", "smart_tourism")

# --- Performance ---
WORKERS = int(os.getenv("CLOUDINARY_UPLOAD_WORKERS", "8"))
SUPABASE_BATCH_SIZE = int(os.getenv("SUPABASE_BATCH_SIZE", "100"))
SUPABASE_DELAY = float(os.getenv("SUPABASE_DELAY_SECONDS", "0.3"))
MAX_FILE_MB = int(os.getenv("MAX_IMAGE_FILE_MB", "25"))
MAX_RETRIES = int(os.getenv("CLOUDINARY_MAX_RETRIES", "3"))
IMG_EXTENSIONS       = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

CHECKPOINT_FILE = os.getenv("CLOUDINARY_CHECKPOINT_FILE", "cloudinary_results.json")
CHECKPOINT_INTERVAL = int(os.getenv("CLOUDINARY_CHECKPOINT_INTERVAL", "50"))

# Thread-safe lock cho checkpoint va buffer
_lock = threading.Lock()


def validate_env():
    required = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY",
                "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]
    missing = [v for v in required if not os.environ.get(v)]
    if missing:
        print("[ERR] Thieu bien moi truong trong .env:")
        for v in missing:
            print(f"   - {v}")
        raise SystemExit(1)
    print("[OK] Bien moi truong hop le.\n")


def setup_cloudinary():
    cloudinary.config(
        cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
        api_key=os.environ["CLOUDINARY_API_KEY"],
        api_secret=os.environ["CLOUDINARY_API_SECRET"],
        secure=True,
    )
    print(f"[OK] Cloudinary: cloud_name = {os.environ['CLOUDINARY_CLOUD_NAME']}\n")


def load_checkpoint() -> dict:
    if Path(CHECKPOINT_FILE).exists():
        with open(CHECKPOINT_FILE, encoding="utf-8") as f:
            data = json.load(f)
        print(f"[*] Checkpoint: {len(data):,} anh da upload -> Bo qua.\n")
        return data
    return {}


def save_checkpoint(results: dict):
    checkpoint_path = Path(CHECKPOINT_FILE)
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
    with checkpoint_path.open("w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)


def get_place_id(img_path: Path, images_dir: Path) -> str:
    try:
        parts = img_path.relative_to(images_dir).parts
        return parts[-2] if len(parts) >= 2 else img_path.stem
    except Exception:
        return img_path.parent.name or img_path.stem


def collect_images(base_path: Path) -> list[dict]:
    images_dir = base_path / IMAGES_SUBDIR if IMAGES_SUBDIR else base_path
    if not images_dir.exists():
        print(f"[ERR] Khong tim thay thu muc anh: {images_dir}")
        raise SystemExit(1)

    print(f"[*] Quet anh trong: {images_dir}")
    result = []
    for img in sorted(images_dir.rglob("*")):
        if not img.is_file():
            continue
        if img.suffix.lower() not in IMG_EXTENSIONS:
            continue
        if img.stat().st_size / (1024 * 1024) > MAX_FILE_MB:
            continue
        result.append({
            "local_path": str(img),
            "place_id":   get_place_id(img, images_dir),
            "image_id":   str(uuid.uuid4()),
            "filename":   img.stem,
        })
    print(f"    Tim thay: {len(result):,} anh hop le\n")
    return result


def upload_one(item: dict) -> tuple[dict | None, str | None]:
    """
    Upload mot anh len Cloudinary.
    Returns: (item, secure_url) hoac (item, None) neu that bai.
    """
    folder    = f"{CLOUDINARY_ROOT}/{item['place_id']}"
    public_id = f"{folder}/{item['filename']}"

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            result = cloudinary.uploader.upload(
                item["local_path"],
                public_id=public_id,
                overwrite=False,
                unique_filename=False,
                resource_type="image",
                timeout=60,
            )
            return item, result["secure_url"]
        except Exception as e:
            err = str(e)
            if "already exists" in err or "resource_already_exists" in err:
                url = (f"https://res.cloudinary.com/{os.environ['CLOUDINARY_CLOUD_NAME']}"
                       f"/image/upload/{public_id}")
                return item, url
            if attempt < MAX_RETRIES:
                time.sleep(attempt * 2)
            else:
                return item, None


def push_to_supabase(supabase: Client, buffer: list[dict]):
    try:
        supabase.table("image_embeddings").upsert(
            buffer, on_conflict="image_id"
        ).execute()
    except Exception as e:
        print(f"\n[ERR] Push Supabase that bai ({len(buffer)} records): {e}")


def main():
    print("=" * 62)
    print("  SMART TOURISM - UPLOAD ANH -> CLOUDINARY -> SUPABASE")
    print(f"  Workers: {WORKERS} threads song song")
    print("=" * 62 + "\n")

    validate_env()
    setup_cloudinary()

    supabase: Client = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"],
    )
    print("[OK] Ket noi Supabase thanh cong!\n")

    all_images = collect_images(Path(IMAGES_ROOT))
    checkpoint = load_checkpoint()
    todo       = [img for img in all_images if img["local_path"] not in checkpoint]

    print(f"[*] Tong cong : {len(all_images):,} anh")
    print(f"    Da upload : {len(checkpoint):,} anh (checkpoint)")
    print(f"    Can upload: {len(todo):,} anh\n")

    if not todo:
        print("[OK] Tat ca anh da duoc upload! Xem cloudinary_results.json\n")
    else:
        ans = input(f"[?] Bat dau upload {len(todo):,} anh voi {WORKERS} threads? (y/n): ").strip().lower()
        if ans != "y":
            print("Huy.")
            return

        # --- Multi-threaded upload ---
        results       = dict(checkpoint)
        supabase_buf  = []
        success = failed = 0
        start_ts = time.time()

        print(f"\n[->] Bat dau upload voi {WORKERS} threads song song...\n")

        with ThreadPoolExecutor(max_workers=WORKERS) as executor:
            futures = {executor.submit(upload_one, item): item for item in todo}

            with tqdm(total=len(todo), desc="Cloudinary", unit="anh", dynamic_ncols=True) as pbar:
                for future in as_completed(futures):
                    item, url = future.result()
                    pbar.update(1)

                    if url is None:
                        failed += 1
                        continue

                    success += 1

                    with _lock:
                        results[item["local_path"]] = url
                        supabase_buf.append({
                            "image_id":  item["image_id"],
                            "place_id":  item["place_id"],
                            "file_path": url,
                        })

                        # Flush Supabase batch
                        if len(supabase_buf) >= SUPABASE_BATCH_SIZE:
                            batch = supabase_buf.copy()
                            supabase_buf.clear()
                            push_to_supabase(supabase, batch)
                            time.sleep(SUPABASE_DELAY)

                        # Save checkpoint
                        if success % CHECKPOINT_INTERVAL == 0:
                            save_checkpoint(results)
                            elapsed = time.time() - start_ts
                            rate = success / elapsed if elapsed > 0 else 0
                            remain = (len(todo) - success - failed) / rate / 3600 if rate > 0 else 0
                            pbar.set_postfix({
                                "ok": success,
                                "err": failed,
                                "~h_left": f"{remain:.1f}",
                            })

        # Flush remaining
        if supabase_buf:
            push_to_supabase(supabase, supabase_buf)
        save_checkpoint(results)

        elapsed = time.time() - start_ts
        mins, secs = divmod(int(elapsed), 60)
        hrs = mins // 60
        mins = mins % 60

        print(f"\n{'=' * 50}")
        print(f"  [OK]  Thanh cong : {success:,} anh")
        print(f"  [ERR] That bai   : {failed:,} anh")
        print(f"  [T]   Thoi gian  : {hrs}h {mins}m {secs}s")
        print(f"  [S]   Checkpoint : {CHECKPOINT_FILE}")
        print(f"{'=' * 50}")

    # Verify Supabase
    print("\n[*] Kiem tra Supabase:")
    try:
        res = supabase.table("image_embeddings").select("*", count="exact").limit(0).execute()
        print(f"    image_embeddings: {res.count:,} ban ghi")
    except Exception as e:
        print(f"    [ERR] {e}")

    cloud = os.environ['CLOUDINARY_CLOUD_NAME']
    print(f"""
[DONE] Hoan thanh!
  - URL anh luu trong cot 'file_path' cua bang image_embeddings
  - Format: https://res.cloudinary.com/{cloud}/image/upload/smart_tourism/<place_id>/<filename>
  - AI Team chay tiep encode_clip.py de fill cot 'embedding'
  - Quan ly anh: https://console.cloudinary.com/console/media_library
""")


if __name__ == "__main__":
    main()
