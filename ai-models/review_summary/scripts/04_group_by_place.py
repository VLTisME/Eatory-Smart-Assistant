import json
from collections import Counter
from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]
INPUT_DIR = BASE_DIR / "data" / "input"
INTERMEDIATE_DIR = BASE_DIR / "data" / "intermediate"
OUTPUT_DIR = BASE_DIR / "data" / "output"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


MIN_REVIEWS_PER_PLACE = 60
TOP_K_KEYWORDS = 8


def parse_keywords(keyword_string):
    if pd.isna(keyword_string):
        return []

    keyword_string = str(keyword_string).strip()

    if not keyword_string:
        return []

    return [
        keyword.strip()
        for keyword in keyword_string.split("|")
        if keyword.strip()
    ]


def get_top_keywords(group_df, top_k=TOP_K_KEYWORDS):
    counter = Counter()

    for keyword_string in group_df["keywords"]:
        counter.update(parse_keywords(keyword_string))

    return [
        keyword
        for keyword, _ in counter.most_common(top_k)
    ]


def main():
    places_path = INPUT_DIR / "places.csv"
    reviews_path = INTERMEDIATE_DIR / "reviews_with_sentiment_keywords.csv"

    places_df = pd.read_csv(places_path)
    reviews_df = pd.read_csv(reviews_path)

    summaries = []

    for place_id, group in reviews_df.groupby("place_id"):
        total_reviews_used = len(group)

        if total_reviews_used < MIN_REVIEWS_PER_PLACE:
            continue

        positive_group = group[group["sentiment"] == "positive"]
        neutral_group = group[group["sentiment"] == "neutral"]
        negative_group = group[group["sentiment"] == "negative"]

        positive_count = len(positive_group)
        neutral_count = len(neutral_group)
        negative_count = len(negative_group)

        place_info = places_df[places_df["place_id"] == place_id]

        if place_info.empty:
            place_name = None
            place_type = None
            address = None
            district = None
            city = None
            avg_rating = None
            total_reviews_google = None
            source = None
        else:
            place_row = place_info.iloc[0]
            place_name = place_row.get("name")
            place_type = place_row.get("type")
            address = place_row.get("address")
            district = place_row.get("district")
            city = place_row.get("city")
            avg_rating = place_row.get("avg_rating")
            total_reviews_google = place_row.get("total_reviews")
            source = place_row.get("source")

        summary = {
            "place_id": place_id,
            "place_name": place_name,
            "type": place_type,
            "address": address,
            "district": district,
            "city": city,
            "avg_rating": None if pd.isna(avg_rating) else float(avg_rating),
            "total_reviews_google": None if pd.isna(total_reviews_google) else int(total_reviews_google),
            "source": source,

            "total_reviews_used": int(total_reviews_used),

            "positive_count": int(positive_count),
            "neutral_count": int(neutral_count),
            "negative_count": int(negative_count),

            "positive_ratio": round(positive_count / total_reviews_used, 4),
            "neutral_ratio": round(neutral_count / total_reviews_used, 4),
            "negative_ratio": round(negative_count / total_reviews_used, 4),

            "top_positive_keywords": get_top_keywords(positive_group),
            "top_neutral_keywords": get_top_keywords(neutral_group),
            "top_negative_keywords": get_top_keywords(negative_group),
        }

        summaries.append(summary)

    summaries_df = pd.DataFrame(summaries)

    summaries_df.to_csv(
        OUTPUT_DIR / "review_summaries.csv",
        index=False
    )

    with open(OUTPUT_DIR / "review_summaries.json", "w", encoding="utf-8") as f:
        json.dump(summaries, f, ensure_ascii=False, indent=2)

    print("Group by place_id done.")
    print(f"Total summaries: {len(summaries)}")
    print(summaries_df.head())


if __name__ == "__main__":
    main()