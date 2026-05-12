# -*- coding: utf-8 -*-
import sys, io
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
query_images.py — Smart Tourism | Image Query Module
=====================================================
Script demo truy van anh tu Supabase (URL luu tren Cloudinary).

3 ham chinh:
  1. get_single_image(place_id)   — Lay 1 anh dau tien cua dia diem
  2. get_batch_images(place_id)   — Lay nhieu anh cua dia diem (co phan trang)
  3. get_random_image(place_id)   — Lay 1 anh ngau nhien cua dia diem

Yeu cau trong .env:
  SUPABASE_URL=...
  SUPABASE_SERVICE_KEY=...

Cai thu vien:
  pip install supabase python-dotenv

Chay thu:
  python query_images.py
"""

import os
import random
import json
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ---------------------------------------------------------------------------
# Setup Supabase client
# ---------------------------------------------------------------------------

def _get_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise EnvironmentError(
            "Thieu SUPABASE_URL hoac SUPABASE_SERVICE_KEY trong .env"
        )
    return create_client(url, key)


# ===========================================================================
# HAM 1 — Single image: lay 1 anh dau tien cua place_id
# ===========================================================================

def get_single_image(place_id: str) -> dict | None:
    """
    Tra ve THONG TIN 1 anh dau tien cua dia diem.

    Args:
        place_id: ID cua dia diem (vd: "ChIJabc123")

    Returns:
        dict voi cac truong: image_id, place_id, file_path (Cloudinary URL)
        hoac None neu khong tim thay.

    Vi du:
        img = get_single_image("ChIJ-ceOWWAndTERQ23rPV_yRG0")
        print(img["file_path"])
        # -> https://res.cloudinary.com/dj8o6k6ol/image/upload/...
    """
    supabase = _get_client()

    resp = (
        supabase.table("image_embeddings")
        .select("image_id, place_id, file_path")
        .eq("place_id", place_id)
        .limit(1)
        .execute()
    )

    if resp.data:
        return resp.data[0]
    return None


# ===========================================================================
# HAM 2 — Batch images: lay nhieu anh cua place_id (co phan trang)
# ===========================================================================

def get_batch_images(
    place_id: str,
    limit: int = 10,
    offset: int = 0,
) -> list[dict]:
    """
    Tra ve DANH SACH nhieu anh cua mot dia diem.

    Args:
        place_id : ID cua dia diem
        limit    : So anh muon lay (mac dinh 10, toi da khuyen nghi 50)
        offset   : Vi tri bat dau lay (dung de phan trang, mac dinh 0)

    Returns:
        List cac dict, moi dict co: image_id, place_id, file_path

    Vi du lay trang 1 (anh 1-10):
        imgs = get_batch_images("ChIJabc123", limit=10, offset=0)

    Vi du lay trang 2 (anh 11-20):
        imgs = get_batch_images("ChIJabc123", limit=10, offset=10)
    """
    supabase = _get_client()

    resp = (
        supabase.table("image_embeddings")
        .select("image_id, place_id, file_path")
        .eq("place_id", place_id)
        .order("image_id")          # Dam bao thu tu nhat quan
        .range(offset, offset + limit - 1)
        .execute()
    )

    return resp.data or []


# ===========================================================================
# HAM 3 — Random image: lay 1 anh ngau nhien cua place_id
# ===========================================================================

def get_random_image(place_id: str) -> dict | None:
    """
    Tra ve 1 anh NGAU NHIEN cua mot dia diem.

    Chien luoc:
      - Lay toan bo anh cua place_id (chi lay image_id va file_path)
      - Chon ngau nhien 1 phan tu trong list
      - Phu hop voi use-case "goi y anh" hoac "preview"

    Args:
        place_id: ID cua dia diem

    Returns:
        dict voi: image_id, place_id, file_path
        hoac None neu dia diem khong co anh nao.

    Vi du:
        img = get_random_image("ChIJabc123")
        print(img["file_path"])
    """
    supabase = _get_client()

    # Lay tat ca image_id cua place nay (nhe, khong keo file_path)
    resp = (
        supabase.table("image_embeddings")
        .select("image_id, place_id, file_path")
        .eq("place_id", place_id)
        .execute()
    )

    if not resp.data:
        return None

    return random.choice(resp.data)


# ===========================================================================
# DEMO — Chay thu ca 3 ham
# ===========================================================================

def _demo():
    # Lay place_id co anh tren Cloudinary tu checkpoint de demo
    # (thay bang place_id bat ky trong database cua ban)
    CHECKPOINT_FILE = "cloudinary_results.json"

    demo_place_id = None
    try:
        with open(CHECKPOINT_FILE, encoding="utf-8") as f:
            data = json.load(f)
        # Lay place_id tu URL dau tien trong checkpoint
        # URL format: .../smart_tourism/<place_id>/filename.jpg
        first_url = next(iter(data.values()))
        parts = first_url.split("/")
        # Tim vi tri "smart_tourism" roi lay phan tu tiep theo
        idx = parts.index("smart_tourism")
        demo_place_id = parts[idx + 1]
    except Exception:
        pass

    if not demo_place_id:
        # Fallback: hardcode mot place_id mau
        demo_place_id = "ChIJ-ceOWWAndTERQ23rPV_yRG0"

    print("=" * 65)
    print("  SMART TOURISM — IMAGE QUERY DEMO")
    print("=" * 65)
    print(f"\n  place_id dung de test: {demo_place_id}\n")

    # --- Ham 1: Single image ---
    print("-" * 65)
    print("[HAM 1] get_single_image() — Lay 1 anh dau tien")
    print("-" * 65)
    result1 = get_single_image(demo_place_id)
    if result1:
        print(f"  image_id : {result1['image_id']}")
        print(f"  place_id : {result1['place_id']}")
        print(f"  URL      : {result1['file_path']}")
    else:
        print(f"  [!] Khong tim thay anh nao cho place_id='{demo_place_id}'")
        print("      (Kiem tra lai place_id hoac doi upload xong)")

    # --- Ham 2: Batch images ---
    print("\n" + "─" * 65)
    print("[HAM 2] get_batch_images() — Lay nhieu anh (limit=5)")
    print("-" * 65)
    results2 = get_batch_images(demo_place_id, limit=5, offset=0)
    if results2:
        print(f"  Tim thay: {len(results2)} anh")
        for i, img in enumerate(results2, 1):
            print(f"  [{i}] {img['file_path'].split('/')[-1]}")
            print(f"       {img['file_path']}")
    else:
        print(f"  [!] Khong co anh nao trong batch.")

    # --- Ham 3: Random image ---
    print("\n" + "─" * 65)
    print("[HAM 3] get_random_image() — Lay 1 anh ngau nhien")
    print("-" * 65)
    result3 = get_random_image(demo_place_id)
    if result3:
        print(f"  image_id : {result3['image_id']}")
        print(f"  place_id : {result3['place_id']}")
        print(f"  URL      : {result3['file_path']}")
        print()
        print("  Chay lai -> ra anh khac (random moi lan)!")
    else:
        print(f"  [!] Khong tim thay anh nao.")

    print("\n" + "=" * 65)
    print("  DEMO HOAN THANH")
    print("=" * 65)
    print("""
Cach tich hop vao project chinh (Flask/FastAPI vi du):
  from query_images import get_single_image, get_batch_images, get_random_image

  # GET /api/places/<place_id>/image
  img  = get_single_image(place_id)

  # GET /api/places/<place_id>/images?limit=10&offset=0
  imgs = get_batch_images(place_id, limit=10, offset=0)

  # GET /api/places/<place_id>/image/random
  img  = get_random_image(place_id)
""")


if __name__ == "__main__":
    _demo()