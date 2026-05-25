# Frontend

## 🎯 Mục đích

`frontend/` là React/Vite app cho người dùng cuối. Module này sở hữu UI, routing, client-side state, Firebase web auth và API clients gọi backend.

## 🧩 Trách nhiệm

- Hiển thị homepage, map page, chatbot, menu translation, place search và review summary.
- Quản lý ngôn ngữ app-wide với hai giá trị `vi` và `en`.
- Gọi backend public API qua service wrappers.
- Hiển thị loading/error/empty states cho feature AI.
- Xử lý Firebase client authentication.
- Hiển thị và lưu lịch sử chat thông qua backend.
- Render bản đồ, marker, ảnh địa điểm và directions.

## 🔌 Public API

Public interface của frontend là UI workflow:

- Homepage: chọn ngôn ngữ, xem feature/place highlights.
- Map page: tìm địa điểm, xem place detail, ảnh, review summary và chỉ đường.
- Chatbot: hỏi RAG, xem sources, lưu lịch sử chat.
- Menu translation: upload ảnh menu, nhận menu JSON đã dịch.
- Place search: upload ảnh, nhận địa điểm tương tự.

Backend routes được gọi nhiều nhất:

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

## 🧠 Cấu trúc

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

Flow chính:

```text
user action
  -> React component/hook
  -> frontend service/client
  -> backend /api/v1 route
  -> render data or localized error state
```

Ngôn ngữ:

- UI `vi`: homepage, map, chatbot, review summary, place search và RAG trả tiếng Việt; menu translation trả English.
- UI `en`: homepage, map, chatbot, review summary, place search và RAG trả English; menu translation trả Vietnamese.

## 🔗 Dependencies

Frontend phụ thuộc vào:

- React 19, React Router, Vite, TypeScript.
- Firebase web SDK.
- Leaflet/MapLibre/Mapbox-related libraries cho map.
- Axios cho API calls.
- ImageKit React SDK.
- Framer Motion, Swiper, Lucide/React Icons cho UI.

Backend là API dependency duy nhất ở runtime.

## ⚙️ Configuration

Tạo `.env`:

```bash
cd frontend
cp .env.example .env
```

Biến chính:

- `VITE_API_BASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GOONG_MAP_KEY`
- `VITE_IMAGEKIT_PUBLIC_KEY`

Chỉ dùng biến bắt đầu bằng `VITE_` cho config public phía browser. Không đưa service role key, private key hoặc server token vào frontend.

## 🚀 Ví dụ sử dụng

Chạy dev server:

```bash
cd frontend
npm install
npm run dev
```

Mở:

```text
http://localhost:5173
```

Build production:

```bash
npm run build
npm run preview
```

## 🧪 Testing

```bash
cd frontend
npm run lint
npm run build
```

Smoke test thủ công:

- Đổi ngôn ngữ ở homepage và vào map page.
- Hỏi chatbot bằng Vietnamese và English.
- Upload ảnh menu và ảnh món ăn.
- Mở review summary của một place có dữ liệu.
- Kiểm tra console/network khi API báo lỗi.

## 🧱 Extension guide

Thêm feature UI mới:

1. Tạo folder trong `src/features/<feature>/`.
2. Đặt API calls vào service/client riêng thay vì gọi `fetch/axios` rải rác trong component.
3. Thêm type dùng chung trong `src/types/` nếu contract được dùng ở nhiều nơi.
4. Dùng language source hiện có cho text hiển thị và fallback messages.
5. Gọi backend route mới qua API client của feature.
6. Cập nhật README nếu thêm workflow user-facing.
