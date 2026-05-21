import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


BASE_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR / ".env")

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise ValueError("Không tìm thấy DATABASE_URL trong service .env hoặc offline/.env")

engine = create_engine(database_url)

with engine.connect() as conn:
    total = conn.execute(
        text("SELECT COUNT(*) FROM review_summaries")
    ).scalar()

    print("Total rows in review_summaries:", total)

    rows = conn.execute(
        text("""
            SELECT
                place_id,
                place_name,
                total_reviews_used,
                positive_ratio,
                neutral_ratio,
                negative_ratio,
                top_positive_keywords,
                top_negative_keywords,
                summary_text
            FROM review_summaries
            LIMIT 5
        """)
    ).fetchall()

    for row in rows:
        print("-" * 80)
        print("place_id:", row.place_id)
        print("place_name:", row.place_name)
        print("total_reviews_used:", row.total_reviews_used)
        print("positive_ratio:", row.positive_ratio)
        print("neutral_ratio:", row.neutral_ratio)
        print("negative_ratio:", row.negative_ratio)
        print("top_positive_keywords:", row.top_positive_keywords)
        print("top_negative_keywords:", row.top_negative_keywords)
        print("summary_text:", row.summary_text)
