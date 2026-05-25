# -*- coding: utf-8 -*-
import sys, io
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

"""
push_embeddings.py - Smart Tourism Data Team
=============================================
Day vector embedding tu file .npy len cot 'embedding'
trong bang image_embeddings tren Supabase.

Nguon du lieu (trong archive (1)/):
  - image_index.json     : map idx -> place_id, filename
  - image_embeddings.npy : ma tran (18694, 1024) float32

Chien luoc match:
  image_index['image_id'] = "ChIJxxx_001.jpg"
  Supabase file_path      = ".../smart_tourism/ChIJxxx/ChIJxxx_001.jpg"
   Match qua ten file (stem)

Yeu cau .env:
  SUPABASE_URL=...
  SUPABASE_SERVICE_KEY=...

Cai thu vien:
  pip install supabase python-dotenv numpy tqdm

Chay:
  python push_embeddings.py
"""

import os
import json
import time
import numpy as np
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm

load_dotenv()

# CONFIG

ARCHIVE_DIR = os.getenv("EMBEDDINGS_ARTIFACT_DIR", "./data/artifacts")
IMAGE_INDEX_FILE = os.getenv("IMAGE_INDEX_FILE", "image_index.json")
EMBEDDINGS_FILE = os.getenv("IMAGE_EMBEDDINGS_FILE", "image_embeddings.npy")

BATCH_SIZE = int(os.getenv("EMBEDDINGS_BATCH_SIZE", "50"))
SUPABASE_DELAY = float(os.getenv("SUPABASE_DELAY_SECONDS", "0.3"))
PAGE_SIZE = int(os.getenv("SUPABASE_PAGE_SIZE", "1000"))

CHECKPOINT_FILE = os.getenv("EMBEDDING_CHECKPOINT_FILE", "embedding_checkpoint.json")



def validate_env():
    missing = [v for v in ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"]
               if not os.environ.get(v)]
    if missing:
        print("[ERR] Thieu bien moi truong:", missing)
        raise SystemExit(1)
    print("[OK] Env hop le.")


def load_checkpoint() -> set:
    if Path(CHECKPOINT_FILE).exists():
        with open(CHECKPOINT_FILE, encoding="utf-8") as f:
            data = json.load(f)
        print(f"[*] Checkpoint: {len(data):,} rows da push -> bo qua.")
        return set(data)
    return set()


def save_checkpoint(done: set):
    checkpoint_path = Path(CHECKPOINT_FILE)
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
    with checkpoint_path.open("w", encoding="utf-8") as f:
        json.dump(list(done), f)


def build_embedding_lookup(archive: Path) -> dict:
    """
    Tao dict: filename_stem -> vector list[float]
    Vi du key: "ChIJpVaGYZwpdTERYEjta0eMl_Q_001"
    """
    print("\n[*] Load image_index.json ...")
    with open(archive / IMAGE_INDEX_FILE, encoding="utf-8") as f:
        index = json.load(f)

    print("[*] Load image_embeddings.npy ...")
    embeddings = np.load(archive / EMBEDDINGS_FILE)   # (18694, 1024) float32
    print(f"    Shape: {embeddings.shape}, dtype: {embeddings.dtype}")

    lookup = {}
    for item in index:
        idx       = item["idx"]
        # image_id trong index = "ChIJxxx_001.jpg" -> bo .jpg
        stem      = Path(item["image_id"]).stem       # "ChIJxxx_001"
        vector    = embeddings[idx].tolist()           # list[float] 1024 phan tu
        lookup[stem] = vector

    print(f"[OK] Lookup: {len(lookup):,} embeddings san sang.\n")
    return lookup


def fetch_supabase_rows(supabase: Client) -> list[dict]:
    """
    Fetch TAT CA rows tu image_embeddings (ca nhung row chua co embedding).
    Phan trang de tranh timeout.
    Returns: list[{image_id, file_path}]
    """
    print("[*] Fetch rows tu Supabase ...")
    all_rows = []
    offset   = 0

    while True:
        resp = (
            supabase.table("image_embeddings")
            .select("image_id, file_path")
            .is_("embedding", "null")      # Chi lay rows chua co embedding
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        )
        batch = resp.data or []
        all_rows.extend(batch)
        print(f"    Fetched: {len(all_rows):,} rows ...", end="\r")

        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE

    print(f"\n[OK] Tong: {len(all_rows):,} rows can fill embedding.\n")
    return all_rows


def main():
    print("=" * 60)
    print("  SMART TOURISM - PUSH EMBEDDINGS -> SUPABASE")
    print("=" * 60 + "\n")

    validate_env()

    supabase: Client = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"],
    )
    print("[OK] Ket noi Supabase thanh cong!\n")

    archive = Path(ARCHIVE_DIR)
    lookup  = build_embedding_lookup(archive)

    rows = fetch_supabase_rows(supabase)
    if not rows:
        print("[OK] Tat ca rows da co embedding roi!")
        return

    done = load_checkpoint()

    matched = unmatched = failed = success = 0
    buffer  = []

    print(f"[->] Bat dau push {len(rows):,} rows ...\n")

    for row in tqdm(rows, desc="Push embeddings", unit="row"):
        image_id  = row["image_id"]
        file_path = row.get("file_path", "")

        # Skip neu da push
        if image_id in done:
            continue

        # Lay ten file tu URL Cloudinary hoac file_path
        # URL: .../smart_tourism/ChIJxxx/ChIJxxx_001.jpg
        stem = Path(file_path).stem   # "ChIJxxx_001"

        if stem not in lookup:
            unmatched += 1
            continue

        matched += 1
        buffer.append({
            "image_id":  image_id,
            "embedding": lookup[stem],   # list[float] 1024
        })

        # Flush batch
        if len(buffer) >= BATCH_SIZE:
            try:
                supabase.table("image_embeddings").upsert(
                    buffer, on_conflict="image_id"
                ).execute()
                success += len(buffer)
                for b in buffer:
                    done.add(b["image_id"])
                save_checkpoint(done)
                time.sleep(SUPABASE_DELAY)
            except Exception as e:
                failed += len(buffer)
                print(f"\n[ERR] Batch that bai: {e}")
            finally:
                buffer.clear()

    # Flush batch cuoi
    if buffer:
        try:
            supabase.table("image_embeddings").upsert(
                buffer, on_conflict="image_id"
            ).execute()
            success += len(buffer)
            for b in buffer:
                done.add(b["image_id"])
            save_checkpoint(done)
        except Exception as e:
            failed += len(buffer)
            print(f"\n[ERR] Batch cuoi that bai: {e}")

    print(f"\n{'=' * 60}")
    print(f"  [OK]  Da push    : {success:,} rows")
    print(f"  [~]   Khong match: {unmatched:,} rows (anh khong co embedding)")
    print(f"  [ERR] That bai   : {failed:,} rows")
    print(f"{'=' * 60}")

    print("\n[*] Kiem tra Supabase:")
    try:
        res_total = (supabase.table("image_embeddings")
                     .select("*", count="exact").limit(0).execute())
        res_filled = (supabase.table("image_embeddings")
                      .select("*", count="exact")
                      .not_.is_("embedding", "null")
                      .limit(0).execute())
        print(f"    Tong rows          : {res_total.count:,}")
        print(f"    Rows co embedding  : {res_filled.count:,}")
        print(f"    Rows chua co       : {res_total.count - res_filled.count:,}")
    except Exception as e:
        print(f"    [ERR] {e}")

    print("\n[DONE] Xong! AI Team co the dung cot 'embedding' de vector search.\n")


if __name__ == "__main__":
    main()
