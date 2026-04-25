from pathlib import Path

import pandas as pd
from keybert import KeyBERT


BASE_DIR = Path(__file__).resolve().parents[1]
INTERMEDIATE_DIR = BASE_DIR / "data" / "intermediate"

# Dùng model multilingual vì review là tiếng Việt.
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

VIETNAMESE_STOPWORDS = [
    "là", "và", "có", "của", "cho", "một", "các", "rất", "quá",
    "thì", "mà", "này", "đó", "ở", "với", "được", "không",
    "nhưng", "nên", "cũng", "vẫn", "đã", "đang", "sẽ", "em",
    "anh", "chị", "mình", "tôi", "bạn", "quán", "nhiều", "lắm",
    "hơi", "khá", "nha", "luôn", "rồi", "đây", "kia"
]


def extract_keywords_with_keybert(model: KeyBERT, text: str, top_k: int = 5) -> list[str]:
    if not isinstance(text, str) or not text.strip():
        return []

    keywords = model.extract_keywords(
        text,
        keyphrase_ngram_range=(1, 2),
        stop_words=VIETNAMESE_STOPWORDS,
        top_n=top_k,
        use_mmr=True,
        diversity=0.5,
    )

    return [keyword for keyword, score in keywords]


def main():
    input_path = INTERMEDIATE_DIR / "reviews_with_sentiment.csv"
    output_path = INTERMEDIATE_DIR / "reviews_with_sentiment_keywords.csv"

    reviews_df = pd.read_csv(input_path)
    reviews_df["text"] = reviews_df["text"].fillna("").astype(str)

    print("Loading KeyBERT model...")
    kw_model = KeyBERT(model=MODEL_NAME)

    print("Extracting keywords...")
    reviews_df["keywords"] = reviews_df["text"].apply(
        lambda text: "|".join(
            extract_keywords_with_keybert(
                model=kw_model,
                text=text,
                top_k=5
            )
        )
    )

    reviews_df.to_csv(output_path, index=False)

    print("Keyword extraction with KeyBERT done.")
    print(reviews_df[["place_id", "text", "sentiment", "keywords"]].head())


if __name__ == "__main__":
    main()