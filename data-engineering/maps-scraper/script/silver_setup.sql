CREATE OR REPLACE PROCEDURE silver.proc_load_places()
LANGUAGE plpgsql
AS $$
DECLARE 
    v_rows INT;
BEGIN
    -- [TRUNCATE]
    TRUNCATE TABLE silver.places;

    -- [INSERT & TRANSFORM]
    INSERT INTO silver.places(
		place_id, name, type, address, district, city, lat, lng, avg_rating, total_reviews, source
    )
SELECT 
	place_id, name, type, address, district, city, lat, lng, avg_rating, total_reviews, source
FROM (
	WITH parsed_data AS (
	    SELECT *, 
	        string_to_array(address, ', ') AS arr
			from public.places
	)
    SELECT DISTINCT on (place_id)
        CAST(NULLIF(TRIM(place_id), '') AS text) AS place_id,
		CAST(NULLIF(TRIM(name), '') AS text) AS name,
		type,
		array_to_string(arr[1 : array_length(arr, 1) - 3], ', ') AS address,
    	arr[array_length(arr, 1) - 2] AS district,
    	REGEXP_REPLACE(arr[array_length(arr, 1) - 1], '\s\d+$', '') AS city,
		cast(nullif(lat, 0.0) as float) as lat,
		cast(nullif(lng, 0.0) as float) as lng,
		cast(nullif(avg_rating, 0.0) as float) as avg_rating,
		nullif(total_reviews, 0.0) as total_reviews,
		source
		from parsed_data
		WHERE NULLIF(TRIM(place_id), '') IS NOT NULL
	) t;
    -- [GET DIAGNOSTICS]
    GET DIAGNOSTICS v_rows = ROW_COUNT;

    -- [LOGGING SUCCESS]

    RAISE NOTICE 'Đã nạp xong bảng silver.places, Số dòng: %', v_rows;

EXCEPTION 
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE WARNING '[ERROR] Lỗi khi nạp silver.places: % (Mã lỗi: %)', SQLERRM, SQLSTATE;
END;
$$;

-----------------------------------------------


CREATE OR REPLACE PROCEDURE silver.proc_load_reviews()
LANGUAGE plpgsql
AS $$
DECLARE 
    v_rows INT;
BEGIN
    -- [TRUNCATE]
    TRUNCATE TABLE silver.reviews;

    -- [INSERT & TRANSFORM]
    INSERT INTO silver.reviews(
		review_id,place_id, text, rating, timestamp, source
    )
SELECT 
	review_id,place_id, text, rating, timestamp, source
FROM (
    SELECT DISTINCT on (text)
		CAST(NULLIF(TRIM(review_id), '') AS text) AS review_id,
        CAST(NULLIF(TRIM(place_id), '') AS text) AS place_id,
		REGEXP_REPLACE(LOWER(text::TEXT), '[^[:alnum:][:space:]]', '', 'g') as text,
		NULLIF(rating, 0) as rating,
		timestamp,
		source
		from public.reviews
	) t;
    -- [GET DIAGNOSTICS]
    GET DIAGNOSTICS v_rows = ROW_COUNT;

    -- [LOGGING SUCCESS]

    RAISE NOTICE 'Đã nạp xong bảng silver.reviews, Số dòng: %', v_rows;

EXCEPTION 
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE WARNING '[ERROR] Lỗi khi nạp silver.reviews: % (Mã lỗi: %)', SQLERRM, SQLSTATE;
END;
$$;

----------------------------------------


select * from silver.clean_reviews;
CREATE OR REPLACE PROCEDURE silver.proc_load_clean_reviews()
LANGUAGE plpgsql
AS $$
DECLARE 
    v_rows INT;
BEGIN
    -- [TRUNCATE]
    TRUNCATE TABLE silver.clean_reviews;

    -- [INSERT & TRANSFORM]
    INSERT INTO silver.clean_reviews(
		place_id, text, rating
    )
SELECT 
	place_id, text, rating
FROM (
    SELECT DISTINCT on (text)
        CAST(NULLIF(TRIM(place_id), '') AS text) AS place_id,
		REGEXP_REPLACE(LOWER(text::TEXT), '[^[:alnum:][:space:]]', '', 'g') as text,
		NULLIF(rating, 0) as rating
		from public.reviews
	) t;
    -- [GET DIAGNOSTICS]
    GET DIAGNOSTICS v_rows = ROW_COUNT;

    -- [LOGGING SUCCESS]

    RAISE NOTICE 'Đã nạp xong bảng silver.clean_reviews, Số dòng: %', v_rows;

EXCEPTION 
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE WARNING '[ERROR] Lỗi khi nạp silver.clean_reviews: % (Mã lỗi: %)', SQLERRM, SQLSTATE;
END;
$$;

