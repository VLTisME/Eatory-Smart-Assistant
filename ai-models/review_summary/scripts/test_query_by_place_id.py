import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


BASE_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BASE_DIR / ".env")

database_url = os.getenv("DATABASE_URL")
engine = create_engine(database_url)


def get_review_summary(place_id: str):
    query = text("""
        SELECT
            place_id,
            place_name,
            address,
            district,
            city,
            avg_rating,
            total_reviews_used,
            positive_ratio,
            neutral_ratio,
            negative_ratio,
            top_positive_keywords,
            top_neutral_keywords,
            top_negative_keywords,
            summary_text
        FROM review_summaries
        WHERE place_id = :place_id
    """)

    with engine.connect() as conn:
        row = conn.execute(query, {"place_id": place_id}).mappings().first()

    return row


if __name__ == "__main__":
    test_place_id = "0621e39bf9eaf732b3e52d83034a3821"

    result = get_review_summary(test_place_id)

    if result is None:
        print("Không tìm thấy review summary cho place_id này")
    else:
        print(dict(result))