from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]
INPUT_DIR = BASE_DIR / "data" / "input"
INTERMEDIATE_DIR = BASE_DIR / "data" / "intermediate"

INTERMEDIATE_DIR.mkdir(parents=True, exist_ok=True)


def classify_sentiment(rating: float) -> str:
    if rating >= 4:
        return "positive"
    if rating == 3:
        return "neutral"
    return "negative"


def main():
    input_path = INPUT_DIR / "clean_reviews.csv"
    output_path = INTERMEDIATE_DIR / "reviews_with_sentiment.csv"

    reviews_df = pd.read_csv(input_path)

    reviews_df = reviews_df.dropna(subset=["place_id", "text", "rating"])
    reviews_df["text"] = reviews_df["text"].astype(str).str.strip()
    reviews_df = reviews_df[reviews_df["text"].str.len() >= 5]
    reviews_df = reviews_df[reviews_df["rating"].between(1, 5)]

    reviews_df["sentiment"] = reviews_df["rating"].apply(classify_sentiment)

    reviews_df.to_csv(output_path, index=False)

    print("Sentiment done.")
    print(reviews_df["sentiment"].value_counts())


if __name__ == "__main__":
    main()