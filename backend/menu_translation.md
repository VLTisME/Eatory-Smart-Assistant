# Menu Translation Backend Walkthrough

This document explains exactly how the current menu translation backend is structured and how to read the code from top to bottom.

It is written for onboarding: read in order, and after each file you should know why it exists and what problem it solves.

## Short Answer To Architecture Question

Yes.

Both `menu_translation` and future `place_finding` should use the same shared image upload validation logic. The only thing that differs per feature is which model/service is called after validation.

In this codebase, shared upload logic is implemented once and reused.

---

## Big Picture

Current menu_translation flow:

1. Frontend uploads image to menu translation endpoint.
2. Endpoint calls shared upload validation function.
3. Validated image bytes are passed to OCR engine.
4. OCR returns raw Vietnamese text.
5. Frontend (or orchestrator layer) sends raw text to shared LLM refine endpoint.
6. LLM returns refined English output.

Separation of concerns:

- Shared layer: upload validation, LLM refinement
- Feature layer: OCR model and feature-specific route

---

## Reading Order (Recommended)

Read files in this exact order.

### Step 1: Application entry and route composition

1. app/main.py
2. app/api/router.py

Goal:
- Understand app startup, middleware, and how routers are assembled.

What to learn:
- `main.py` creates FastAPI app and includes top-level router.
- `router.py` composes shared routes + menu feature routes.

---

### Step 2: Shared cross-feature APIs

1. app/api/shared_routes.py
2. app/shared/schemas.py

Goal:
- Understand endpoints that are reusable for all features.

What to learn:
- `POST /api/v1/uploads/image`: reusable upload validation endpoint.
- `POST /api/v1/llm/refine`: reusable refinement endpoint for final text polish.
- Request/response contracts are in shared schemas.

Important:
- This is where future features (like place finding) should plug in for shared behavior.

---

### Step 3: Shared service implementations

1. app/shared/image_upload.py
2. app/shared/refinement.py
3. app/core/config.py
4. app/core/prompts.py

Goal:
- Understand the reusable business logic behind shared routes.

What to learn:

- image_upload.py
  - `validate_image_upload(file)` enforces file constraints:
    - filename exists
    - content type is allowed
    - size <= configured limit
    - bytes are real image data
  - returns a normalized in-memory object (`ValidatedImage`).

- refinement.py
  - `RefinementClient` wraps OpenAI API usage.
  - `refine(...)` builds prompt and returns refined text + timing + prompt version.

- config.py
  - all env vars and defaults are centralized.
  - OCR provider selection and OpenAI config live here.

- prompts.py
  - menu prompt engineering rules live here.
  - prompt versioning constant makes tuning traceable.

---

### Step 4: Menu translation feature implementation

1. app/features/menu_translation/routes.py
2. app/features/menu_translation/schemas.py
3. app/features/menu_translation/ocr_engine.py

Goal:
- Understand what is feature-specific and not shared.

What to learn:

- routes.py
  - endpoint: `POST /api/v1/menu-translation/ocr`
  - imports and calls shared `validate_image_upload(...)`
  - then calls menu OCR engine
  - returns feature-specific OCR response

- schemas.py
  - response shape for menu OCR extraction

- ocr_engine.py
  - feature model logic and provider abstraction
  - supports two providers:
    - EasyOCR (local, CPU by default)
    - Hugging Face inference model (config-driven)
  - returns `OCRResult(text, provider, processing_time_ms)`

---

### Step 5: Tests (how behavior is locked)

1. tests/conftest.py
2. tests/test_ocr_service.py
3. tests/test_llm_service.py
4. tests/test_shared_and_menu_api.py

Goal:
- Understand what is guaranteed by tests.

What to learn:

- conftest.py
  - ensures import path is consistent for test runs.

- test_ocr_service.py
  - validates upload checks and OCR engine wrapper behavior.

- test_llm_service.py
  - validates prompt-building and refinement client behavior.

- test_shared_and_menu_api.py
  - integration behavior of health/shared/menu endpoints.

---

## Exactly Where Shared Upload Is Reused

Shared upload function:
- app/shared/image_upload.py

Called by shared upload endpoint:
- app/api/shared_routes.py (`/api/v1/uploads/image`)

Called by menu OCR endpoint:
- app/features/menu_translation/routes.py (`/api/v1/menu-translation/ocr`)

Conclusion:
- There is no duplicated upload validation logic.
- Both paths reuse the same Python function.
- The endpoints are separate because one is validation-only and one is feature-processing.

---

## API Responsibilities

### Shared endpoint: POST /api/v1/uploads/image

Responsibility:
- Validate and normalize image metadata.

Does NOT:
- run OCR
- run place finding model
- persist file history

### Feature endpoint: POST /api/v1/menu-translation/ocr

Responsibility:
- Validate image (via shared function)
- Run OCR model
- Return raw extracted text

### Shared endpoint: POST /api/v1/llm/refine

Responsibility:
- Refine/translate model output text for UI quality

Expected request shape:
- `content`: raw OCR text
- `context`: short context label (e.g. `menu_translation`)
- `source_language`: `vi`
- `target_language`: `en`

---

## Prompt Engineering Notes (Current State)

Prompt engineering is centralized in:
- app/core/prompts.py

Current objective:
- preserve menu structure and prices
- reduce hallucinations
- output readable translation

Why quality can still look bad:
- OCR noise is high (misread tokens like `1Sk`, `Tnà Sũ`, etc.)
- LLM can only refine what OCR gives; severe OCR corruption limits quality

Tuning strategy:
1. improve OCR quality (image quality/provider)
2. tighten normalization instructions in prompt
3. optionally add deterministic post-OCR cleanup rules before LLM
4. consider stronger LLM model if needed

---

## How Future place_finding Should Fit

When `place_finding` is added, follow this same pattern:

1. Add feature package:
- app/features/place_finding/

2. Feature route should call shared upload validation:
- `validate_image_upload(...)`

3. Feature route calls place retrieval model/service:
- embeddings/vector search pipeline

4. Output goes through shared LLM refine endpoint (or internal shared refinement call)

This keeps architecture consistent:
- one upload logic
- one refinement logic
- multiple isolated feature model modules

---

## Current Constraints

- No persisted upload/session/image ID storage yet.
- Each processing endpoint receives image directly in the same request.
- This is fine for stateless MVP.

If you later want upload-once/use-many, implement:
- temporary file/object store
- short-lived `image_id`
- processing endpoints accept `image_id` instead of file bytes

---

## Practical Manual Test Order

In Swagger (`/docs`), run:

1. `GET /`
2. `GET /health`
3. `POST /api/v1/uploads/image`
4. `POST /api/v1/menu-translation/ocr`
5. `POST /api/v1/llm/refine`
6. `GET /api/v1/info`

This order mirrors real product flow.

---

## Summary

What has been done:
- Shared upload validation implemented once and reused.
- Menu translation feature isolated under feature module.
- Shared LLM refinement endpoint reusable for all features.
- Tests pass and cover unit + integration flow.

What to do next (recommended):
- Add place_finding feature package with same shared upload/refine pattern.
- Improve OCR->LLM quality with prompt + cleanup tuning.
