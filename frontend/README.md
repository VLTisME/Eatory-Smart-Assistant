# Frontend

`frontend/` là ứng dụng React/Vite của Eatory Smart Assistant. Frontend chỉ gọi public API của backend, không gọi trực tiếp AI service, Supabase service API hoặc endpoint nội bộ.

## Trách nhiệm

Frontend sở hữu:

- Giao diện homepage, map page, chatbot, menu translation và place search.
- UI state, routing, hooks, components và API client wrapper.
- Firebase client authentication.
- Chat history flow ở phía UI.
- Ngôn ngữ UI toàn cục `vi`/`en`.

Frontend không sở hữu:

- Private API key.
- URL nội bộ của AI services.
- Supabase service key.
- Business logic backend.
- Model inference hoặc prompt AI.

## Cấu trúc

```text
frontend/src/
|-- features/
|   |-- auth/
|   |-- chatbot/
|   |-- directions/
|   |-- homepage/
|   `-- map-search/
|-- components/
|-- hooks/
|-- services/
|-- pages/
|-- data/
|-- types/
|-- config/
|-- firebaseConfig.ts
|-- App.tsx
`-- main.tsx
```

Một số shared components/hooks/services cũ vẫn nằm ngoài feature folders. Khi refactor tiếp, có thể giữ chúng như shared utility hoặc di chuyển vào feature phù hợp.

## Ngôn ngữ

Ứng dụng hỗ trợ hai ngôn ngữ:

- `vi`: tiếng Việt.
- `en`: tiếng Anh.

Ngôn ngữ chọn ở homepage được xem là app-wide language:

- Homepage UI dùng ngôn ngữ đã chọn.
- Map page, chatbot, fallback message, toast, label và output AI dùng cùng ngôn ngữ.
- Review summary, place search refine và RAG answer dùng cùng ngôn ngữ.
- Menu translation cố ý dùng ngôn ngữ ngược lại:
  - UI `vi` -> output menu `en`.
  - UI `en` -> output menu `vi`.

Khi thêm text UI mới, cần đi qua cùng nguồn ngôn ngữ toàn cục thay vì hardcode một ngôn ngữ.

## Biến môi trường

Tạo `.env`:

```bash
cd frontend
cp .env.example .env
```

Biến quan trọng:

- `VITE_API_BASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GOONG_MAP_KEY`
- `VITE_IMAGEKIT_PUBLIC_KEY`

`VITE_API_BASE_URL` mặc định fallback về `http://localhost:8000` khi chạy local.

## Cài đặt và chạy

```bash
cd frontend
npm install
npm run dev
```

URL mặc định:

```text
http://localhost:5173
```

## Build và lint

```bash
npm run lint
npm run build
```

Preview build:

```bash
npm run preview
```

## Backend routes được dùng

Các route chính frontend gọi:

- `/api/v1/rag/chat`
- `/api/v1/rag/retrieve`
- `/api/v1/menu-translation/ocr/structured`
- `/api/v1/place-search`
- `/api/v1/place-details`
- `/api/v1/place-images`
- `/api/v1/review-summary`
- `/api/v1/review-summary/samples`
- `/api/v1/directions`
- `/api/v1/places/autocomplete`
- `/api/v1/places/detail`
- `/api/v1/chat/conversations`
- `/api/v1/imagekit/auth`

API base URL nên được lấy qua config tập trung, không hardcode `localhost` rải rác trong component.

## Ghi chú phát triển

- Khi thêm feature mới, ưu tiên đặt UI/business client code trong `src/features/<feature-name>/`.
- Không đưa private key vào frontend vì mọi biến `VITE_*` đều có thể lộ ở browser.
- Khi thêm output AI, luôn truyền language intent xuống backend nếu endpoint hỗ trợ.
- Giữ frontend là client duy nhất của backend public API; không bypass backend để gọi service nội bộ.
