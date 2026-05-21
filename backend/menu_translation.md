# Ranh giới Backend cho Menu Translation

Logic model của menu translation đã được tách khỏi backend từ Phase 2.

Backend hiện chỉ giữ public API wrapper:

- `POST /api/v1/menu-translation/ocr`
- `POST /api/v1/menu-translation/ocr/structured`

Các route này validate ảnh upload và gọi `ai-models/menu-translation-service` qua HTTP. OCR provider, OpenAI vision call, prompt menu và pipeline OCR-to-JSON nằm trong AI service.

Tài liệu liên quan:

- `backend/app/features/menu_translation/README.md`
- `ai-models/menu-translation-service/README.md`
