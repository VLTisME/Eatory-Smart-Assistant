# 📸 Image Query Module — Smart Tourism

Module truy xuất ảnh địa điểm từ **Cloudinary CDN** thông qua **Supabase**, phục vụ backend của hệ thống Smart Tourism.

---

## Kiến trúc

```
Local Dataset (.jpg)
       │
       ▼  upload_images_cloudinary.py
Cloudinary CDN
(lưu file ảnh thật)
       │  secure_url
       ▼
Supabase · bảng image_embeddings
┌──────────────────────────────────────────────────────┐
│  image_id (PK) │ place_id (FK) │ file_path (URL)     │
└──────────────────────────────────────────────────────┘
       │
       ▼  query_images.py
Backend API  →  Frontend
```

---

## Yêu cầu

```bash
pip install supabase python-dotenv
```

Tạo file `.env` ở cùng thư mục:

```env
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key>
```

---

## API Reference

### `get_single_image(place_id)`

Trả về **1 ảnh đầu tiên** của địa điểm.

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `place_id` | `str` | ID của địa điểm |

**Returns:** `dict` hoặc `None`

```python
{
  "image_id": "f92d79ea-4eab-...",
  "place_id": "ChIJabc123",
  "file_path": "https://res.cloudinary.com/..."
}
```

---

### `get_batch_images(place_id, limit=10, offset=0)`

Trả về **nhiều ảnh** của địa điểm, có hỗ trợ phân trang.

| Tham số | Kiểu | Mặc định | Mô tả |
|---------|------|----------|-------|
| `place_id` | `str` | — | ID của địa điểm |
| `limit` | `int` | `10` | Số ảnh muốn lấy |
| `offset` | `int` | `0` | Vị trí bắt đầu (để phân trang) |

**Returns:** `list[dict]`

```python
# Trang 1 (ảnh 1–10)
get_batch_images("ChIJabc123", limit=10, offset=0)

# Trang 2 (ảnh 11–20)
get_batch_images("ChIJabc123", limit=10, offset=10)
```

---

### `get_random_image(place_id)`

Trả về **1 ảnh ngẫu nhiên** của địa điểm — mỗi lần gọi cho kết quả khác nhau.

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `place_id` | `str` | ID của địa điểm |

**Returns:** `dict` hoặc `None`

---

## Tích hợp vào project

```python
from query_images import get_single_image, get_batch_images, get_random_image

# Lấy 1 ảnh đại diện
img = get_single_image("ChIJabc123")
print(img["file_path"])  # URL Cloudinary

# Lấy tất cả ảnh (có phân trang)
imgs = get_batch_images("ChIJabc123", limit=10, offset=0)

# Lấy ảnh ngẫu nhiên (dùng cho preview/gợi ý)
img = get_random_image("ChIJabc123")
```

### Ví dụ với FastAPI

```python
from fastapi import FastAPI
from query_images import get_single_image, get_batch_images, get_random_image

app = FastAPI()

@app.get("/api/places/{place_id}/image")
def single_image(place_id: str):
    return get_single_image(place_id) or {"error": "No image found"}

@app.get("/api/places/{place_id}/images")
def batch_images(place_id: str, limit: int = 10, offset: int = 0):
    return get_batch_images(place_id, limit=limit, offset=offset)

@app.get("/api/places/{place_id}/image/random")
def random_image(place_id: str):
    return get_random_image(place_id) or {"error": "No image found"}
```



---

## Chạy demo

```bash
python query_images.py
```

Output mẫu:

```
[HAM 1] get_single_image()
  image_id : f92d79ea-4eab-4528-8a8d-54756f85cbb0
  place_id : ChIJ--gyGFgvdTERalLvAJOJN1k
  URL      : https://res.cloudinary.com/dj8o6k6ol/image/upload/...

[HAM 2] get_batch_images(limit=5)
  Tim thay: 5 anh
  [1] ..._011.jpg  https://res.cloudinary.com/...
  [2] ..._006.jpg  https://res.cloudinary.com/...
  ...

[HAM 3] get_random_image()
  URL      : https://res.cloudinary.com/...  (khác nhau mỗi lần)
```

---

## Lưu ý

- Không commit file `.env` lên GitHub
- Quản lý ảnh trên Cloudinary: [console.cloudinary.com](https://console.cloudinary.com/console/media_library)
