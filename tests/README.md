# Tests

## 🎯 Mục đích

`tests/` ở root là tài liệu kiểm thử cấp repo. Automated tests thật nằm gần module mà chúng kiểm tra, ví dụ `backend/tests/` hoặc `ai-models/*-service/tests/`.

## 🧩 Trách nhiệm

- Ghi rõ CI hiện tại đang kiểm tra gì.
- Ghi checklist smoke test thủ công cho full stack.
- Tổng hợp lệnh test sâu theo từng module.
- Giúp developer mới hiểu khi nào cần chạy pytest/lint/Go tests.

## 🔌 Public API

Public interface của module này là workflow kiểm thử:

- CI workflow: `.github/workflows/ci.yml`
- Manual full-stack smoke test bằng Docker Compose.
- Module-specific commands cho backend, frontend, AI services và data-engineering.

## 🧠 Cấu trúc

CI hiện tại chạy smoke checks cấp repo.

CI chạy:

```text
pull request / push
  -> docker compose config
  -> Python compile checks
  -> frontend npm ci + build
```

`pytest`, `npm run lint` và Go tests được chạy thủ công theo module liên quan.

## 🔗 Dependencies

- Docker Compose cho config check và full-stack smoke test.
- Python 3.11 cho compile checks và pytest.
- Node.js 22/npm cho frontend build.
- Go toolchain nếu muốn chạy Google Maps scraper tests.
- External API keys và runtime artifacts nếu chạy manual feature smoke test.

## ⚙️ Configuration

CI dùng `.github/workflows/ci.yml`. Manual smoke test cần các file `.env` đã tạo theo root README.

## 🚀 Ví dụ sử dụng

Full-stack smoke test:

```bash
docker compose up --build
docker compose ps
```

Mở frontend:

```text
http://localhost:5173
```

Checklist:

- Đổi ngôn ngữ ở homepage sang Vietnamese và English.
- Mở main map page, kiểm tra UI đúng ngôn ngữ.
- Dùng menu translation với ảnh menu thật.
- Dùng place search với ảnh món ăn.
- Hỏi RAG/chatbot bằng tiếng Việt và tiếng Anh.
- Mở review summary của một địa điểm có dữ liệu.
- Xem log backend và AI services nếu frontend báo lỗi.

## 🧪 Testing

Backend:

```bash
cd backend
uv sync --extra dev
uv run pytest -q
```

Contract tests backend-to-AI:

```bash
cd backend
uv run pytest -q tests/test_ai_service_contracts.py
```

Frontend:

```bash
cd frontend
npm install
npm run lint
npm run build
```

AI service, ví dụ RAG:

```bash
cd ai-models/rag-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
python -m pytest -q
```

Data engineering:

```bash
python -m py_compile data-engineering/scripts/*.py data-engineering/google-maps-scraper/scripts/*.py
```

Google Maps scraper:

```bash
cd data-engineering/google-maps-scraper
go test ./gmaps ./runner ./deduper ./grid ./exiter
```

## 🧱 Extension guide

Khi thêm module mới:

1. Đặt tests gần module đó.
2. Thêm lệnh chạy test vào README module.
3. Chỉ thêm vào CI nếu test không cần secret, model lớn, external service hoặc dữ liệu local nặng.
4. Cập nhật checklist smoke test nếu feature user-facing.