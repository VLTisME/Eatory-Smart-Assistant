# Offline Review Summary Data

Thư mục này lưu input, intermediate files và output được sinh bởi offline review-summary pipeline.

Một số file đang được giữ lại để tương thích sau refactor. Về dài hạn, dữ liệu regenerate lớn nên được xem là artifact: không commit vào source changes thông thường, trừ khi đó là sample nhỏ phục vụ test hoặc tài liệu.

## Cấu trúc

```text
data/
|-- input/          # Dữ liệu đầu vào cho pipeline
|-- intermediate/   # File trung gian: sentiment, keyword...
`-- output/         # Summary JSON/CSV và validation report
```

## Output thường gặp

- `output/review_summaries.json`
- `output/review_summaries.csv`
- `output/review_summaries_with_text.json`
- `output/review_summaries_with_text.csv`
- `output/validation_report.json`

`rag-service` có thể dùng `review_summaries_with_text.json` làm input khi build RAG documents.
