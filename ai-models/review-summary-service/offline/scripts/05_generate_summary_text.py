import json
from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = BASE_DIR / "data" / "output"


def format_percent(value):
    return round(float(value) * 100)


def join_keywords(keywords, max_items=5):
    if not keywords:
        return ""

    return ", ".join(keywords[:max_items])


def build_summary_text(item):
    place_name = item.get("place_name") or "Địa điểm này"

    positive_percent = format_percent(item["positive_ratio"])
    neutral_percent = format_percent(item["neutral_ratio"])
    negative_percent = format_percent(item["negative_ratio"])

    positive_keywords = join_keywords(item.get("top_positive_keywords", []))
    negative_keywords = join_keywords(item.get("top_negative_keywords", []))

    sentences = []

    sentences.append(
        f"{place_name} có {positive_percent}% review tích cực, "
        f"{neutral_percent}% trung lập và {negative_percent}% tiêu cực."
    )

    if positive_keywords:
        sentences.append(
            f"Các điểm được nhắc tích cực gồm: {positive_keywords}."
        )

    if negative_keywords:
        sentences.append(
            f"Một số điểm bị nhắc tiêu cực gồm: {negative_keywords}."
        )

    return " ".join(sentences)


def main():
    input_path = OUTPUT_DIR / "review_summaries.json"

    with open(input_path, "r", encoding="utf-8") as f:
        summaries = json.load(f)

    for item in summaries:
        item["summary_text"] = build_summary_text(item)

    with open(OUTPUT_DIR / "review_summaries_with_text.json", "w", encoding="utf-8") as f:
        json.dump(summaries, f, ensure_ascii=False, indent=2)

    pd.DataFrame(summaries).to_csv(
        OUTPUT_DIR / "review_summaries_with_text.csv",
        index=False
    )

    print("Summary text generated.")


if __name__ == "__main__":
    main()