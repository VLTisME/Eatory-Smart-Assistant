-- ============================================================
-- PHASE 1: MIGRATION — Chuyển cột `type` sang PostgreSQL ENUM
-- Chạy 1 LẦN DUY NHẤT trên pgAdmin (Query Tool) hoặc psql
-- ============================================================

-- Bước 1: Tạo kiểu ENUM mới
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'place_type_enum') THEN
        CREATE TYPE place_type_enum AS ENUM ('food', 'attraction', 'entertainment');
    END IF;
END $$;

-- Bước 2: Chuyển đổi cột `type` từ VARCHAR sang ENUM
-- Giá trị cũ khớp ('food','attraction','entertainment') sẽ được giữ nguyên
-- Giá trị không khớp (hoặc rỗng) sẽ được set thành NULL
ALTER TABLE places 
    ALTER COLUMN type DROP DEFAULT,
    ALTER COLUMN type TYPE place_type_enum 
        USING CASE 
            WHEN type IN ('food', 'attraction', 'entertainment') THEN type::place_type_enum
            ELSE NULL 
        END,
    ALTER COLUMN type SET DEFAULT NULL;
