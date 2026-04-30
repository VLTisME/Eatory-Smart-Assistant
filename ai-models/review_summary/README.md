# Review Summary Model

Pipeline xử lý dữ liệu review để tạo summary theo từng `place_id`, phục vụ backend truy vấn nhanh khi người dùng chọn một địa điểm/quán ăn.

## Chức năng chính

- Kiểm tra dữ liệu đầu vào từ `clean_reviews.csv` và `places.csv`.
- Gắn nhãn sentiment theo `rating`:
  - `4–5`: positive
  - `3`: neutral
  - `1–2`: negative
- Trích xuất keyword bằng KeyBERT với model multilingual.
- Gom nhóm review theo `place_id`.
- Tạo summary text ngắn gọn cho từng địa điểm.
- Lưu kết quả cuối cùng vào PostgreSQL.