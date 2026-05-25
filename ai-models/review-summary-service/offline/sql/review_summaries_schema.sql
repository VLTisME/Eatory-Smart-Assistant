CREATE TABLE IF NOT EXISTS review_summaries (
    place_id TEXT PRIMARY KEY,
    place_name TEXT,
    type TEXT,
    address TEXT,
    district TEXT,
    city TEXT,

    avg_rating DOUBLE PRECISION,
    total_reviews_google INTEGER,
    source TEXT,
    total_reviews_used INTEGER NOT NULL,

    positive_count INTEGER NOT NULL,
    neutral_count INTEGER NOT NULL,
    negative_count INTEGER NOT NULL,

    positive_ratio DOUBLE PRECISION NOT NULL,
    neutral_ratio DOUBLE PRECISION NOT NULL,
    negative_ratio DOUBLE PRECISION NOT NULL,

    top_positive_keywords JSONB,
    top_neutral_keywords JSONB,
    top_negative_keywords JSONB,

    summary_text TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);