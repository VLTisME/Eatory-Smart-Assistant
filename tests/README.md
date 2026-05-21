# Kiểm thử

Thư mục `tests/` ở root dùng cho ghi chú kiểm thử cấp repo. Automated tests chính hiện nằm gần module mà chúng kiểm tra.

## Nơi đặt test hiện tại

- `backend/tests/`: backend API tests, AI service HTTP client tests và backend-to-AI schema contract tests.
- `ai-models/*-service/tests/`: tests cho từng AI service.
- `frontend/`: kiểm tra bằng `npm run lint` và `npm run build`.
- `data-engineering/`: kiểm tra syntax nhanh cho scripts và maps-scraper modules.

CI chạy các nhóm kiểm thử này qua `.github/workflows/ci.yml`.

## Backend

```bash
cd backend
uv sync --extra dev
uv run pytest -q
```

Test contract backend-to-AI:

```bash
uv run pytest -q tests/test_ai_service_contracts.py
```

## AI services

Ví dụ với RAG service:

```bash
cd ai-models/rag-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
python -m pytest -q
```

Lặp lại pattern này cho:

- `ai-models/menu-translation-service`
- `ai-models/place-search-service`
- `ai-models/rag-service`
- `ai-models/review-summary-service`

Không dùng virtualenv của backend để chạy AI tests vì dependency đã tách riêng.

## Frontend

```bash
cd frontend
npm install
npm run lint
npm run build
```

## Data engineering

Kiểm tra syntax nhanh:

```bash
python3 -m py_compile data-engineering/scripts/*.py data-engineering/maps-scraper/*.py
```

## Docker Compose

Kiểm tra config:

```bash
docker compose config --quiet
```

Kiểm tra nhanh full stack:

```bash
docker compose up -d --build
docker compose ps
```

Sau đó kiểm tra thủ công trên frontend:

- Homepage đổi ngôn ngữ `vi`/`en`.
- Map page hiển thị đúng ngôn ngữ.
- Menu translation trả ngôn ngữ ngược UI.
- Place search trả kết quả/refinement đúng ngôn ngữ UI.
- RAG trả answer đúng ngôn ngữ UI.
- Review summary hiển thị đúng ngôn ngữ UI.
