# Eatory Smart Assistant

Eatory Smart Assistant là hệ thống trợ lý du lịch ẩm thực, kết hợp bản đồ, tìm kiếm địa điểm, chatbot RAG, dịch menu từ ảnh, tìm địa điểm bằng ảnh và tóm tắt đánh giá. Dự án được tách thành bốn vùng trách nhiệm chính:

- `frontend/`: giao diện React/Vite cho người dùng cuối.
- `backend/`: public API FastAPI, xác thực, tích hợp Firebase/Supabase/Goong/ImageKit và gọi các AI service nội bộ.
- `ai-models/`: các AI service độc lập, prompt, model runtime và artifact AI.
- `data-engineering/`: scraping, ingestion, upload, migration và batch pipeline dữ liệu.

Nguyên tắc kiến trúc hiện tại: frontend chỉ gọi backend; backend không load model hoặc giữ prompt AI nặng; các xử lý OCR, CLIP, RAG, refinement và review-summary LLM nằm trong `ai-models/`.

## Tổng quan kiến trúc

```text
React/Vite frontend
  -> FastAPI backend public API
      -> Firebase Auth / Firestore
      -> Supabase
      -> Goong APIs
      -> ImageKit
      -> Internal AI services
          -> menu-translation-service
          -> place-search-service
          -> rag-service
          -> review-summary-service
```

## Cấu trúc thư mục

```text
.
|-- backend/             # Public API, auth, chat history, data proxy, AI clients
|-- frontend/            # React/Vite UI
|-- ai-models/           # AI services, prompt, model runtime, artifact AI
|-- data-engineering/    # Scraper, ingestion, upload, migration, batch jobs
|-- data/                # Artifact runtime cho place search: embeddings, indexes, places.json
|-- tests/               # Ghi chú kiểm thử cấp repo
|-- docker-compose.yml   # Chạy full stack local
`-- REFACTOR.md          # Kế hoạch và lịch sử refactor
```

## Tính năng chính

- Dịch menu từ ảnh: upload ảnh menu, OCR, trích xuất món/giá/mô tả và dịch sang ngôn ngữ đích.
- Tìm địa điểm bằng ảnh: dùng CLIP embedding để tìm địa điểm có hình ảnh tương tự ảnh người dùng tải lên.
- Chatbot RAG: hỏi đáp và gợi ý địa điểm ăn uống dựa trên dữ liệu review đã index.
- Tóm tắt review: hiển thị tổng quan đánh giá theo tiếng Việt hoặc tiếng Anh.
- Bản đồ và địa điểm: tìm kiếm địa điểm, xem ảnh, xem review mẫu và chỉ đường.
- Chat history: lưu hội thoại theo Firebase Auth và Firestore.
- Data pipeline: scrape Google Maps, xử lý Kaggle dataset, upload ảnh, sinh embedding và đẩy summary lên database/storage.

## Chạy nhanh bằng Docker

Tạo các file `.env` từ template:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ai-models/menu-translation-service/.env.example ai-models/menu-translation-service/.env
cp ai-models/place-search-service/.env.example ai-models/place-search-service/.env
cp ai-models/rag-service/.env.example ai-models/rag-service/.env
cp ai-models/review-summary-service/.env.example ai-models/review-summary-service/.env
cp data-engineering/.env.example data-engineering/.env
```

Điền key thật cho Firebase, Supabase, Goong, ImageKit, OpenAI và các service liên quan. Không commit `.env`, private key, service account hoặc token thật.

Chạy full stack:

```bash
docker compose up --build
```

URL mặc định:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Menu translation service: `http://localhost:8101`
- Place search service: `http://localhost:8102`
- RAG service: `http://localhost:8103`
- Review summary service: `http://localhost:8104`

Kiểm tra container và log:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f menu-translation-service
docker compose logs -f place-search-service
docker compose logs -f rag-service
docker compose logs -f review-summary-service
```

## Chạy từng module khi phát triển

Backend:

```bash
cd backend
uv sync --extra dev
uv run uvicorn app.main:app --reload --host localhost --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Một AI service, ví dụ RAG:

```bash
cd ai-models/rag-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --host localhost --port 8103
```

Data engineering:

```bash
cd data-engineering
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Quy ước môi trường và dependency

- `backend/.env`: Firebase, Supabase, Goong, ImageKit và URL/token của AI services.
- `frontend/.env`: chỉ chứa biến public bắt đầu bằng `VITE_*`.
- `ai-models/*/.env`: key/model/env riêng của từng AI service.
- `data-engineering/.env`: credential và đường dẫn phục vụ ingestion/scraping/batch jobs.
- Mỗi module giữ dependency riêng. Không gộp dependency AI, backend, frontend và data-engineering vào một file chung.

## Artifact và dữ liệu runtime

- Root `data/` đang là nguồn artifact runtime cho place search: `image_embeddings.npy`, `image_index.json`, `places.json`, `noise_embeddings.npy`, `noise_index.json`.
- `ai-models/rag-service/chroma_db/` là artifact vector DB hiện tại của RAG.
- `ai-models/review-summary-service/offline/data/` chứa dữ liệu batch/offline của review summary.
- Artifact lớn nên được generate hoặc tải từ storage theo hướng dẫn module, không xem như source code thông thường.

## Kiểm thử

Backend:

```bash
cd backend
uv run pytest -q
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

AI service:

```bash
cd ai-models/menu-translation-service
python -m pytest -q
```

Kiểm tra Docker Compose:

```bash
docker compose config --quiet
```

## Tài liệu module

- [Backend](backend/README.md)
- [Frontend](frontend/README.md)
- [Nhóm AI services](ai-models/README.md)
- [Service dịch menu](ai-models/menu-translation-service/README.md)
- [Service tìm địa điểm bằng ảnh](ai-models/place-search-service/README.md)
- [Service RAG](ai-models/rag-service/README.md)
- [Service tổng quan đánh giá](ai-models/review-summary-service/README.md)
- [Pipeline offline tổng quan đánh giá](ai-models/review-summary-service/offline/README.md)
- [Data engineering](data-engineering/README.md)
- [Maps scraper](data-engineering/maps-scraper/readme.md)
- [Kiểm thử](tests/README.md)
