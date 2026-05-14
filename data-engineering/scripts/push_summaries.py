# -*- coding: utf-8 -*-
import sys, io
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

"""
push_summaries.py - Smart Tourism Data Team
=============================================
Day file review_summaries_with_text.json vao bang place_summaries tren Supabase.

Quy trinh:
  1. Doc file JSON
  2. Tinh toan overall_sentiment tu positive_ratio va negative_ratio
  3. Gom top_positive_keywords, neutral, negative vao 1 dict JSONB (top_keywords)
  4. Day tung batch (200 records/lan) de tranh PostgREST payload limit.

Yeu cau .env:
  SUPABASE_URL=...
  SUPABASE_SERVICE_KEY=...

Cai thu vien:
  pip install supabase python-dotenv tqdm

Chay:
  python push_summaries.py
"""

import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm

load_dotenv()

# CONFIG

DATA_FILE = r"D:\HieuLT\TDTT\Tutorial\archive (1)\review_summaries_with_text.json"
BATCH_SIZE = 200     # PostgREST limit thuong bi qua tai o muc tren 200-500
SUPABASE_DELAY = 0.3 # Cho giua cac request



def validate_env():
    missing = [v for v in ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"]
               if not os.environ.get(v)]
    if missing:
        print("[ERR] Thieu bien moi truong:", missing)
        raise SystemExit(1)
    print("[OK] Env hop le.\n")


def compute_overall_sentiment(row: dict) -> str:
    """
    Quy doi tu cac chi so ratio sang chuoi 'positive', 'negative', 'neutral'.
    Uu tien: Neu positive >= negative -> positive. Nguoc lai la negative.
    Neu ca 2 deu = 0 thi la neutral.
    """
    pos = row.get("positive_ratio", 0)
    neg = row.get("negative_ratio", 0)
    
    # Truong hop dac biet neu khong co danh gia nao ro rang
    if pos == 0 and neg == 0:
        return "neutral"
        
    if pos >= neg:
        return "positive"
    else:
        return "negative"


def process_data(raw_data: list) -> list:
    """Map du lieu raw tu JSON sang dung format cua bang place_summaries."""
    processed = []
    
    for row in raw_data:
        # Tinh overall_sentiment
        sentiment = compute_overall_sentiment(row)
        
        # Gom top_keywords thanh JSONB
        top_keywords = {
            "positive": row.get("top_positive_keywords", []),
            "neutral": row.get("top_neutral_keywords", []),
            "negative": row.get("top_negative_keywords", [])
        }
        
        processed.append({
            "place_id": row.get("place_id"),
            "summary_text": row.get("summary_text", ""),
            "overall_sentiment": sentiment,
            "top_keywords": top_keywords
        })
        
    return processed


def push_batch(supabase: Client, batch: list):
    """Upsert 1 batch len Supabase."""
    try:
        supabase.table("place_summaries").upsert(
            batch, on_conflict="place_id"
        ).execute()
        return len(batch), 0
    except Exception as e:
        # Neu loi 1 batch, co the do loi FK (place_id khong ton tai o bang places)
        print(f"\n[ERR] Batch loi: {str(e)[:200]}")
        return 0, len(batch)


def main():
    print("=" * 60)
    print("  SMART TOURISM - PUSH SUMMARIES -> SUPABASE")
    print("=" * 60 + "\n")

    validate_env()

    supabase: Client = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"],
    )
    print("[OK] Ket noi Supabase thanh cong!\n")

    if not Path(DATA_FILE).exists():
        print(f"[ERR] Khong tim thay file data: {DATA_FILE}")
        return

    print(f"[*] Doc file data: {DATA_FILE}")
    with open(DATA_FILE, encoding="utf-8") as f:
        raw_data = json.load(f)
    print(f"[OK] Da doc: {len(raw_data):,} ban ghi.\n")

    print("[*] Map du lieu vao schema cua place_summaries...")
    processed_data = process_data(raw_data)

    ans = input(f"[?] Bat dau day {len(processed_data):,} ban ghi len Supabase? (y/n): ").strip().lower()
    if ans != "y":
        print("Huy.")
        return

    print()
    success = failed = 0
    batch = []
    
    for row in tqdm(processed_data, desc="Pushing Summaries"):
        batch.append(row)
        
        if len(batch) >= BATCH_SIZE:
            s, f = push_batch(supabase, batch)
            success += s
            failed += f
            batch.clear()
            time.sleep(SUPABASE_DELAY)
            
    # Push batch cuoi cung con sot lai
    if batch:
        s, f = push_batch(supabase, batch)
        success += s
        failed += f

    print(f"\n{'=' * 60}")
    print(f"  [OK]  Thanh cong: {success:,} rows")
    print(f"  [ERR] That bai  : {failed:,} rows")
    print(f"{'=' * 60}")
    
    # Verify tren DB
    try:
        res = supabase.table("place_summaries").select("*", count="exact").limit(0).execute()
        print(f"\n[*] Kiem tra tren Supabase: Co tong cong {res.count:,} rows trong bang place_summaries.")
    except Exception as e:
        print(f"\n[ERR] Kiem tra count that bai: {e}")

if __name__ == "__main__":
    main()
