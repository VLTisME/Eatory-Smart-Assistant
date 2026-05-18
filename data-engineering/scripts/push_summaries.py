import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

DATA_FILE = r"D:\HieuLT\TDTT\Tutorial\archive (1)\review_summaries_with_text.json"
BATCH_SIZE = 200
SUPABASE_DELAY = 0.3

def validate_env():
    missing = [v for v in ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"]
               if not os.environ.get(v)]
    if missing:
        print("[ERR] Thieu bien moi truong:", missing)
        raise SystemExit(1)
    print("[OK] Env hop le.\n")

def push_batch(supabase: Client, batch: list):
    try:
        supabase.table("place_summaries").upsert(
            batch, on_conflict="place_id"
        ).execute()
        return len(batch), 0
    except Exception as e:
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

    print("[*] Bat dau day truc tiep json object len Supabase (1:1 schema mapping)...")

    success = failed = 0
    batch = []
    total = len(raw_data)
    
    for i, row in enumerate(raw_data):
        batch.append(row)
        
        if len(batch) >= BATCH_SIZE:
            s, f = push_batch(supabase, batch)
            success += s
            failed += f
            batch.clear()
            print(f"   [{i+1}/{total}] rows xu ly...", end='\r')
            time.sleep(SUPABASE_DELAY)
            
    if batch:
        s, f = push_batch(supabase, batch)
        success += s
        failed += f

    print(f"\n{'=' * 60}")
    print(f"  [OK]  Thanh cong: {success:,} rows")
    print(f"  [ERR] That bai  : {failed:,} rows")
    print(f"{'=' * 60}")
    
    try:
        res = supabase.table("place_summaries").select("*", count="exact").limit(0).execute()
        print(f"\n[*] Kiem tra tren Supabase: Co tong cong {res.count:,} rows trong bang place_summaries.")
    except Exception as e:
        print(f"\n[ERR] Kiem tra count that bai: {e}")

if __name__ == "__main__":
    main()
