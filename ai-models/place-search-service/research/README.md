# Place Search Research

## 🎯 Mục đích

`research/` chứa notebook nghiên cứu cho CLIP pipeline và image embeddings của place search.

## 🧩 Trách nhiệm

- Ghi lại thử nghiệm tạo embeddings ảnh.
- Kiểm tra model, preprocessing, similarity và noise filtering.
- Làm nguồn tham khảo khi regenerate artifacts cho root `data/`.

## 🔌 Public API

Không có API runtime. File chính hiện tại:

- `clip_pipeline.ipynb`: notebook thử nghiệm CLIP embedding pipeline.

## 🧠 Thiết kế nội bộ

Luồng nghiên cứu:

```text
dataset / sample images
  -> notebook preprocessing
  -> model embedding experiments
  -> similarity/noise analysis
  -> artifact generation notes
  -> stable runtime logic trong app/
```

Runtime place search dùng artifacts sinh ra từ pipeline ổn định trong `data/`.

## 🔗 Dependencies

Notebook phụ thuộc vào môi trường local/research, model CLIP và dataset ảnh. Runtime service phụ thuộc vào artifacts đã sinh ra, không phụ thuộc notebook.

## ⚙️ Configuration

Không có `.env` riêng. Nếu notebook cần key/path, dùng config local hoặc ghi rõ trong notebook cell trước khi chạy.

## 🚀 Ví dụ sử dụng

Mở notebook từ service folder:

```bash
cd ai-models/place-search-service
jupyter notebook research/clip_pipeline.ipynb
```

## 🧪 Testing

Không có automated tests cho notebook. Sau khi dùng notebook để sinh artifacts, smoke test bằng:

```bash
cd ai-models/place-search-service
python -m pytest -q
```

Sau đó chạy API `/v1/place-search/by-image` với ảnh thật.

## 🧱 Extension guide

Khi thêm notebook mới:

1. Đặt trong `research/`.
2. Ghi rõ dataset, model version và output artifacts.
3. Không để runtime service import code từ notebook.
4. Nếu logic đã ổn định, chuyển sang script/service code có test.

## ⚠️ Gotchas

- Notebook dễ chứa path tuyệt đối; kiểm tra trước khi commit.
- Model version phải khớp với embeddings runtime.
- Artifact migration từ notebook sang `data/` cần được test bằng service thật.
