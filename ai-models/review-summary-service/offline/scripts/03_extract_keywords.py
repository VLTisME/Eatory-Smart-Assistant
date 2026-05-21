from pathlib import Path

import pandas as pd
from keybert import KeyBERT
from tqdm import tqdm


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

# Checkpoint: lưu mỗi 5000 reviews để không mất tiến độ nếu crash
CHECKPOINT_EVERY = 5000


def extract_keywords_with_keybert(model: KeyBERT, text: str, top_k: int = 5) -> list[str]:
    if not isinstance(text, str) or not text.strip():
        return []

    keywords = model.extract_keywords(
        text,
        keyphrase_ngram_range=(2, 3),
        stop_words=VIETNAMESE_STOPWORDS,
        top_n=top_k,
        use_mmr=True,
        diversity=0.5,
    )

    return [keyword for keyword, score in keywords]


def main():
    input_path = INTERMEDIATE_DIR / "reviews_with_sentiment.csv"
    output_path = INTERMEDIATE_DIR / "reviews_with_sentiment_keywords.csv"
    checkpoint_path = INTERMEDIATE_DIR / "keywords_checkpoint.csv"

    reviews_df = pd.read_csv(input_path)
    reviews_df["text"] = reviews_df["text"].fillna("").astype(str)

    # Kiểm tra checkpoint: nếu đã chạy dở thì tiếp tục
    start_index = 0

    if checkpoint_path.exists():
        checkpoint_df = pd.read_csv(checkpoint_path)
        processed_count = len(checkpoint_df)

        if processed_count < len(reviews_df):
            print(f"Tim thay checkpoint: {processed_count}/{len(reviews_df)} reviews da xu ly.")
            print(f"Tiep tuc tu review thu {processed_count}...")

            # Gán kết quả đã xử lý vào cột keywords
            reviews_df["keywords"] = ""
            reviews_df.loc[:processed_count - 1, "keywords"] = checkpoint_df["keywords"].values
            start_index = processed_count
        else:
            print(f"Checkpoint da hoan tat ({processed_count} reviews). Ghi file output...")
            reviews_df["keywords"] = checkpoint_df["keywords"].values
            reviews_df.to_csv(output_path, index=False)
            print("Keyword extraction with KeyBERT done.")
            print(reviews_df[["place_id", "text", "sentiment", "keywords"]].head())
            return
    else:
        reviews_df["keywords"] = ""

    # Load model lên GPU
    print("Loading KeyBERT model...")

    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    if device == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        from sentence_transformers import SentenceTransformer
        sentence_model = SentenceTransformer(MODEL_NAME, device=device)
        kw_model = KeyBERT(model=sentence_model)
    else:
        print("Khong tim thay GPU, dung CPU (se cham hon).")
        kw_model = KeyBERT(model=MODEL_NAME)

    # Extract keywords với progress bar + checkpoint
    total = len(reviews_df)
    print(f"Extracting keywords... ({start_index}/{total} -> {total})")

    for i in tqdm(range(start_index, total), initial=start_index, total=total, desc="Keywords"):
        text = reviews_df.at[i, "text"]
        keywords = extract_keywords_with_keybert(model=kw_model, text=text, top_k=5)
        reviews_df.at[i, "keywords"] = "|".join(keywords)

        # Lưu checkpoint mỗi CHECKPOINT_EVERY reviews
        if (i + 1) % CHECKPOINT_EVERY == 0:
            reviews_df.iloc[:i + 1].to_csv(checkpoint_path, index=False)
            tqdm.write(f"  Checkpoint saved: {i + 1}/{total}")

    # Ghi output cuối cùng
    reviews_df.to_csv(output_path, index=False)

    # Xoá file checkpoint
    if checkpoint_path.exists():
        checkpoint_path.unlink()
        print("Checkpoint file removed.")

    print("Keyword extraction with KeyBERT done.")
    print(reviews_df[["place_id", "text", "sentiment", "keywords"]].head())


if __name__ == "__main__":
    main()
