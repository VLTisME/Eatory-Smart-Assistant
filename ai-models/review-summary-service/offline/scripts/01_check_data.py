import json
from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]
INPUT_DIR = BASE_DIR / "data" / "input"
OUTPUT_DIR = BASE_DIR / "data" / "output"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def main():
    places_path = INPUT_DIR / "places.csv"
    clean_reviews_path = INPUT_DIR / "clean_reviews.csv"

    places_df = pd.read_csv(places_path)
    reviews_df = pd.read_csv(clean_reviews_path)

    required_place_columns = {
        "place_id",
        "name",
        "address",
        "district",
        "city",
        "avg_rating",
        "total_reviews",
    }

    required_review_columns = {
        "place_id",
        "text",
        "rating",
    }

    missing_place_columns = required_place_columns - set(places_df.columns)
    missing_review_columns = required_review_columns - set(reviews_df.columns)

    if missing_place_columns:
        raise ValueError(f"places.csv thiếu cột: {missing_place_columns}")

    if missing_review_columns:
        raise ValueError(f"clean_reviews.csv thiếu cột: {missing_review_columns}")

    total_reviews = len(reviews_df)
    total_places = places_df["place_id"].nunique()

    missing_place_id = reviews_df["place_id"].isna().sum()
    missing_text = reviews_df["text"].isna().sum()
    rating_numeric = pd.to_numeric(reviews_df["rating"], errors="coerce")
    missing_rating = rating_numeric.isna().sum()

    invalid_rating = (
        rating_numeric.notna()
        & ~rating_numeric.between(1, 5)
    ).sum()

    reviews_per_place = (
        reviews_df
        .groupby("place_id")
        .size()
        .reset_index(name="review_count")
        .sort_values("review_count")
    )

    places_under_60 = reviews_per_place[
        reviews_per_place["review_count"] < 60
    ]

    rating_distribution = (
        rating_numeric
        .dropna()
        .value_counts()
        .sort_index()
        .to_dict()
    )

    report = {
        "total_places": int(total_places),
        "total_reviews": int(total_reviews),
        "missing_place_id": int(missing_place_id),
        "missing_text": int(missing_text),
        "missing_rating": int(missing_rating),
        "invalid_rating": int(invalid_rating),
        "places_with_reviews": int(reviews_df["place_id"].nunique()),
        "places_under_60_reviews": int(len(places_under_60)),
        "rating_distribution": {
            str(k): int(v)
            for k, v in rating_distribution.items()
        },
        "places_under_60_detail": places_under_60.to_dict(orient="records"),
    }

    with open(OUTPUT_DIR / "validation_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print("Check data done.")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()