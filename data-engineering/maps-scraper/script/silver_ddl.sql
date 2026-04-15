
create schema if not exists silver;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'place_type_enum'
    ) THEN
        CREATE TYPE place_type_enum AS ENUM (
            'food',
            'attraction',
            'entertainment'
        );
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS silver.places (
    place_id TEXT PRIMARY KEY,
    name TEXT,
    type place_type_enum,
    address TEXT,
    district TEXT,
    city TEXT,
    lat float,
    lng float,
    avg_rating float,
    total_reviews INTEGER,
    source TEXT
);


CREATE TABLE IF NOT EXISTS silver.reviews (
    review_id TEXT PRIMARY KEY,
    place_id TEXT,
    text TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    "timestamp" TIMESTAMP,
    source TEXT,
    FOREIGN KEY (place_id) REFERENCES silver.places(place_id)
);

CREATE TABLE IF NOT EXISTS silver.clean_reviews (
    place_id TEXT,
    text TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (place_id) REFERENCES silver.places(place_id)
);
