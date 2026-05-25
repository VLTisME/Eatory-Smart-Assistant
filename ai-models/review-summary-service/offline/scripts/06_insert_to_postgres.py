import json
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = BASE_DIR / "data" / "output"
SQL_DIR = BASE_DIR / "sql"


def main():
    load_dotenv(BASE_DIR.parent / ".env")
    load_dotenv(BASE_DIR / ".env")

    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise ValueError("Thiếu DATABASE_URL trong service .env hoặc offline/.env")

    engine = create_engine(database_url)

    schema_sql = (SQL_DIR / "review_summaries_schema.sql").read_text(
        encoding="utf-8"
    )

    with engine.begin() as conn:
        conn.execute(text(schema_sql))

    output_path = OUTPUT_DIR / "review_summaries_with_text.json"

    with open(output_path, "r", encoding="utf-8") as f:
        summaries = json.load(f)

    upsert_sql = text("""
        INSERT INTO review_summaries (
            place_id,
            place_name,
            type,
            address,
            district,
            city,
            avg_rating,
            total_reviews_google,
            source,
            total_reviews_used,
            positive_count,
            neutral_count,
            negative_count,
            positive_ratio,
            neutral_ratio,
            negative_ratio,
            top_positive_keywords,
            top_neutral_keywords,
            top_negative_keywords,
            summary_text,
            updated_at
        )
        VALUES (
            :place_id,
            :place_name,
            :type,
            :address,
            :district,
            :city,
            :avg_rating,
            :total_reviews_google,
            :source,
            :total_reviews_used,
            :positive_count,
            :neutral_count,
            :negative_count,
            :positive_ratio,
            :neutral_ratio,
            :negative_ratio,
            CAST(:top_positive_keywords AS JSONB),
            CAST(:top_neutral_keywords AS JSONB),
            CAST(:top_negative_keywords AS JSONB),
            :summary_text,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (place_id)
        DO UPDATE SET
            place_name = EXCLUDED.place_name,
            type = EXCLUDED.type,
            address = EXCLUDED.address,
            district = EXCLUDED.district,
            city = EXCLUDED.city,
            avg_rating = EXCLUDED.avg_rating,
            total_reviews_google = EXCLUDED.total_reviews_google,
            source = EXCLUDED.source,
            total_reviews_used = EXCLUDED.total_reviews_used,
            positive_count = EXCLUDED.positive_count,
            neutral_count = EXCLUDED.neutral_count,
            negative_count = EXCLUDED.negative_count,
            positive_ratio = EXCLUDED.positive_ratio,
            neutral_ratio = EXCLUDED.neutral_ratio,
            negative_ratio = EXCLUDED.negative_ratio,
            top_positive_keywords = EXCLUDED.top_positive_keywords,
            top_neutral_keywords = EXCLUDED.top_neutral_keywords,
            top_negative_keywords = EXCLUDED.top_negative_keywords,
            summary_text = EXCLUDED.summary_text,
            updated_at = CURRENT_TIMESTAMP;
    """)

    with engine.begin() as conn:
        for item in summaries:
            conn.execute(
                upsert_sql,
                {
                    "place_id": item.get("place_id"),
                    "place_name": item.get("place_name"),
                    "type": item.get("type"),
                    "address": item.get("address"),
                    "district": item.get("district"),
                    "city": item.get("city"),
                    "avg_rating": item.get("avg_rating"),
                    "total_reviews_google": item.get("total_reviews_google"),
                    "source": item.get("source"),
                    "total_reviews_used": item.get("total_reviews_used"),
                    "positive_count": item.get("positive_count"),
                    "neutral_count": item.get("neutral_count"),
                    "negative_count": item.get("negative_count"),
                    "positive_ratio": item.get("positive_ratio"),
                    "neutral_ratio": item.get("neutral_ratio"),
                    "negative_ratio": item.get("negative_ratio"),
                    "top_positive_keywords": json.dumps(
                        item.get("top_positive_keywords", []),
                        ensure_ascii=False,
                    ),
                    "top_neutral_keywords": json.dumps(
                        item.get("top_neutral_keywords", []),
                        ensure_ascii=False,
                    ),
                    "top_negative_keywords": json.dumps(
                        item.get("top_negative_keywords", []),
                        ensure_ascii=False,
                    ),
                    "summary_text": item.get("summary_text"),
                },
            )

    print(f"Inserted/updated {len(summaries)} review summaries into PostgreSQL.")


if __name__ == "__main__":
    main()
