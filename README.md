# Eatory Smart Assistant

Ứng dụng trợ lý ẩm thực cho TP.HCM, kết hợp bản đồ, chatbot RAG, dịch menu từ ảnh, tìm địa điểm bằng ảnh và tóm tắt review.

## ❓ Dự án này là gì?

Eatory Smart Assistant giúp người dùng khám phá địa điểm ăn uống/cà phê bằng nhiều cách: xem trên bản đồ, hỏi chatbot, upload ảnh món ăn để tìm quán tương tự, dịch menu từ ảnh và đọc tổng quan review. Dự án phục vụ người dùng cuối cần gợi ý nhanh, đồng thời là đồ án kỹ thuật thể hiện luồng frontend, backend, AI services và data engineering.

Frontend là client người dùng tương tác. Frontend gọi backend; backend gọi Firebase, Supabase, Goong, ImageKit và các AI service nội bộ. Logic OCR, CLIP, RAG và LLM runtime nằm trong `ai-models/`.

## ✨ Tính năng

- Bản đồ địa điểm với tìm kiếm, ảnh, thông tin chi tiết và chỉ đường.
- Chatbot RAG gợi ý quán ăn/cà phê dựa trên dữ liệu review đã index.
- Dịch menu từ ảnh bằng OCR và LLM structuring.
- Tìm địa điểm bằng ảnh món ăn hoặc ảnh không gian quán bằng CLIP image search.
- Tổng quan đánh giá theo điểm mạnh/điểm yếu của địa điểm.
- Giao diện song ngữ Vietnamese/English cho homepage, map page, chatbot và AI output.
- Lưu lịch sử chat bằng Firebase Auth và Firestore.
- Data pipeline cho Google Maps/Kaggle dataset, Supabase, ảnh và AI artifacts.

## 🏗️ Kiến trúc / Cách hoạt động

```text
User
  -> frontend/ React + Vite
  -> backend/ FastAPI public API
      -> Firebase Auth + Firestore
      -> Supabase
      -> Goong APIs
      -> ImageKit
      -> ai-models/*-service
          -> menu translation OCR/LLM
          -> place search CLIP
          -> RAG retrieval + generation
          -> review summary generation/translation
```

Data flow tổng quát:

```text
data-engineering/
  -> Supabase + local artifacts
  -> ai-models runtime artifacts
  -> backend API
  -> frontend UI
```

Mỗi AI feature chạy bằng một FastAPI service và Docker image riêng. Dependency runtime được tách theo service: menu translation, place search, RAG và review summary.

## 📁 Cấu trúc project

```text
.
|-- backend/                         # FastAPI public API, auth, data proxy, AI clients
|-- frontend/                        # React/Vite UI cho người dùng cuối
|-- ai-models/                       # AI services, prompts, model runtime, artifacts
|   |-- menu-translation-service/    # OCR + structured menu translation
|   |-- place-search-service/        # CLIP image search
|   |-- rag-service/                 # RAG chatbot + shared refinement
|   `-- review-summary-service/      # Review summary runtime + offline pipeline
|-- data-engineering/                # Crawl, ingestion, upload, publish data/artifacts
|-- data/                            # Runtime artifacts cho place search
|-- tests/                           # Hướng dẫn kiểm thử cấp repo
|-- docker-compose.yml               # Chạy full stack local
`-- LICENSE
```

## 🧰 Requirements

- Docker và Docker Compose để chạy local full stack.
- Python `>=3.11`.
- Node.js `22` cho frontend.
- `uv` cho backend development.
- `npm` cho frontend.
- OpenAI API key cho menu translation, RAG, refinement và review summary.
- Supabase project/service key cho dữ liệu địa điểm, ảnh và review.
- Firebase service account cho backend auth/history.
- Firebase web config cho frontend auth.
- Goong API keys cho map, autocomplete, place detail và directions.
- ImageKit keys cho upload auth.
- Hugging Face access/network cho CLIP và embedding model khi cache chưa có sẵn.

## 🚀 Quick start

Tạo `.env` từ template:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ai-models/menu-translation-service/.env.example ai-models/menu-translation-service/.env
cp ai-models/place-search-service/.env.example ai-models/place-search-service/.env
cp ai-models/rag-service/.env.example ai-models/rag-service/.env
cp ai-models/review-summary-service/.env.example ai-models/review-summary-service/.env
cp data-engineering/.env.example data-engineering/.env
```

Điền key thật vào các file `.env`, sau đó chạy full stack:

```bash
docker compose up --build
```

URL mặc định:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Backend Swagger: `http://localhost:8000/docs`
- Menu translation service: `http://localhost:8101`
- Place search service: `http://localhost:8102`
- RAG service: `http://localhost:8103`
- Review summary service: `http://localhost:8104`

Kiểm tra container và log:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f rag-service
docker compose logs -f place-search-service
```

## ⚙️ Configuration

Các file cấu hình chính:

- `backend/.env`: Firebase service account path, Supabase, Goong REST API, ImageKit, AI service URLs.
- `frontend/.env`: backend base URL, Firebase web config, Goong map key, ImageKit public key.
- `ai-models/*-service/.env`: OpenAI/model config, service token, model/artifact paths.
- `data-engineering/.env`: Supabase, Cloudinary, Kaggle/raw paths, batch sizes, local DB URL.
- `docker-compose.yml`: service ports, Docker build context, health checks và Docker volumes.

Artifact runtime cần có:

- `data/image_embeddings.npy`
- `data/image_index.json`
- `data/places.json`
- `data/noise_embeddings.npy`
- `data/noise_index.json`
- `ai-models/rag-service/chroma_db/`
- `ai-models/rag-service/rag_documents.json`
- `ai-models/review-summary-service/offline/data/output/review_summaries_with_text.json`

## 🧭 Usage

Luồng UI chính:

1. Mở `http://localhost:5173`.
2. Chọn ngôn ngữ Vietnamese hoặc English ở homepage.
3. Vào map page để xem địa điểm, ảnh, review summary và chỉ đường.
4. Dùng chatbot để hỏi gợi ý quán ăn/cà phê.
5. Upload ảnh menu để dịch menu sang ngôn ngữ đối ứng.
6. Upload ảnh món ăn/quán để tìm địa điểm tương tự.

Ví dụ gọi backend health:

```bash
curl http://localhost:8000/health
```

Ví dụ gọi RAG qua backend:

```bash
curl -X POST http://localhost:8000/api/v1/rag/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Suggest me natural vibe coffees at Thu Duc","top_k":3,"target_language":"en"}'
```

## 🛠️ Development

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

AI service, ví dụ RAG:

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

Build RAG artifacts:

```bash
cd ai-models/rag-service
python build_documents.py
python build_vector_db.py
```

## 🧪 Testing

CI commands hiện tại gồm Docker Compose config, Python compile checks và frontend build. Runtime smoke test chạy bằng Docker Compose.

Smoke checks:

```bash
docker compose config --quiet
python -m compileall -q backend/app ai-models/menu-translation-service/app ai-models/place-search-service/app ai-models/rag-service/app ai-models/review-summary-service/app
python -m py_compile data-engineering/scripts/*.py data-engineering/google-maps-scraper/scripts/*.py
cd frontend && npm run build
```

Backend tests:

```bash
cd backend
uv run pytest -q
```

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

AI service tests:

```bash
cd ai-models/menu-translation-service
python -m pytest -q
```

Xem thêm [tests/README.md](tests/README.md).

## 🚢 Deployment / Operations

Chạy local bằng Docker Compose:

```bash
docker compose up --build
docker compose ps
```

Health checks:

- Backend: `GET /health`
- AI services: `GET /health`

Logging:

```bash
docker compose logs -f backend
docker compose logs -f menu-translation-service
docker compose logs -f place-search-service
docker compose logs -f rag-service
docker compose logs -f review-summary-service
```

CI workflow nằm ở `.github/workflows/ci.yml`:

```text
push / pull_request
  -> docker compose config
  -> Python compile checks
  -> frontend npm ci + build
```

## 🤝 Contributing

Tạo branch riêng, commit nhỏ theo từng module và mở pull request kèm mô tả cách đã test.

## 📄 License

Xem [LICENSE](LICENSE).

## 📚 Tài liệu module

- [Backend](backend/README.md)
- [Frontend](frontend/README.md)
- [AI services](ai-models/README.md)
- [Menu translation service](ai-models/menu-translation-service/README.md)
- [Place search service](ai-models/place-search-service/README.md)
- [RAG service](ai-models/rag-service/README.md)
- [Review summary service](ai-models/review-summary-service/README.md)
- [Review summary offline pipeline](ai-models/review-summary-service/offline/README.md)
- [Data engineering](data-engineering/README.md)
- [Google Maps scraper](data-engineering/google-maps-scraper/README.md)
- [Kiểm thử](tests/README.md)
