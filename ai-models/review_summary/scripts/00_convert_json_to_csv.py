# Convert JSON data to CSV

import json
from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
INPUT_DIR = BASE_DIR / "data" / "input"


def main():
    # places
    places_json_path = INPUT_DIR / "places.json"
    with open(places_json_path, "r", encoding="utf-8") as f:
        places = json.load(f)

    places_df = pd.DataFrame(places)

    # Data mới thiếu cột "type" → thêm vào với giá trị None
    if "type" not in places_df.columns:
        places_df["type"] = None

    place_cols = [
        "place_id", "name", "type", "address", "district",
        "city", "lat", "lng", "avg_rating", "total_reviews", "source",
    ]
    places_df = places_df[place_cols]
    places_df.to_csv(INPUT_DIR / "places.csv", index=False)
    print(f"Converted places.json -> places.csv ({len(places_df)} rows)")

    # clean_reviews
    reviews_json_path = INPUT_DIR / "clean_reviews.json"
    with open(reviews_json_path, "r", encoding="utf-8") as f:
        reviews = json.load(f)

    reviews_df = pd.DataFrame(reviews)
    review_cols = ["place_id", "text", "rating"]
    reviews_df = reviews_df[review_cols]
    reviews_df.to_csv(INPUT_DIR / "clean_reviews.csv", index=False)
    print(f"Converted clean_reviews.json -> clean_reviews.csv ({len(reviews_df)} rows)")

    print("Done. CSV files ready for pipeline.")


if __name__ == "__main__":
    main()