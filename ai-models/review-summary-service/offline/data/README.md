# Offline Review Summary Data

## 🎯 Mục đích

`offline/data/` lưu input, intermediate files và output artifacts của review summary offline pipeline.

## 🧩 Trách nhiệm

- Lưu dữ liệu đầu vào đã clean trong `input/`.
- Lưu file trung gian sentiment/keyword trong `intermediate/`.
- Lưu summary artifacts và validation report trong `output/`.
- Cung cấp `review_summaries_with_text.json` cho RAG document build.

## 🔌 Public API

Không có HTTP API. Public interface là các file output:

- `output/review_summaries.json`
- `output/review_summaries.csv`
- `output/review_summaries_with_text.json`
- `output/review_summaries_with_text.csv`
- `output/validation_report.json`

## 🧠 Thiết kế nội bộ

```text
data/
|-- input/          # Dữ liệu đầu vào
|-- intermediate/   # Sentiment, keyword và file trung gian
`-- output/         # Summary JSON/CSV và validation report
```

Luồng dữ liệu:

```text
input raw/clean reviews
  -> offline/scripts
  -> intermediate sentiment/keyword files
  -> output review summaries
  -> backend fallback hoặc RAG document build
```

## 🔗 Dependencies

- Producer: `offline/scripts/*.py`.
- Consumer: backend review summary fallback và `ai-models/rag-service/build_documents.py`.

## ⚙️ Configuration

Cấu hình pipeline nằm ở service root `.env` và optional `offline/.env`.

## 🚀 Ví dụ sử dụng

Build lại output bằng offline pipeline:

```bash
cd ai-models/review-summary-service
python offline/scripts/01_check_data.py
python offline/scripts/02_add_sentiment.py
python offline/scripts/03_extract_keywords.py
python offline/scripts/04_group_by_place.py
python offline/scripts/05_generate_summary_text.py
```

## 🧪 Testing

Kiểm tra input/output bằng scripts:

```bash
cd ai-models/review-summary-service
python offline/scripts/01_check_data.py
python offline/scripts/check_inserted_data.py
```

## 🧱 Extension guide

Khi thêm output mới:

1. Ghi file vào `output/` nếu đó là artifact cuối.
2. Ghi vào `intermediate/` nếu chỉ dùng giữa các bước pipeline.
3. Cập nhật README này nếu artifact mới được module khác sử dụng.

## ⚠️ Gotchas

- File output có thể lớn; tránh mở bằng editor nếu máy yếu.
- `review_summaries_with_text.json` đang là input quan trọng cho RAG.
- Nếu xóa output local, cần chạy lại pipeline trước khi build RAG documents.
