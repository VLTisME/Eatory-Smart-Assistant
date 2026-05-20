# Smart Travel Assistant Backend

This backend is built for one clear pattern:

1. A feature (menu OCR now, others later) produces raw output.
2. Shared LLM refinement polishes the output for UI.
3. Shared upload validation is reused by image-based features.

Current implemented feature:
- Menu translation OCR (Vietnamese menu image -> raw text)

Shared cross-feature components:
- Image upload validation endpoint
- LLM refinement endpoint

Locust is intentionally deferred for now until output quality is stable.

## Architecture At A Glance

```text
Client
  -> POST /api/v1/uploads/image (shared validation)
  -> POST /api/v1/menu-translation/ocr (feature OCR)
  -> POST /api/v1/llm/refine (shared polish/translation)
```

Orchestrated manually in current phase:

```text
Upload image -> OCR raw text -> LLM refine -> UI
```

## Project Structure (Important Files Explained)

```text
backend/
  app/
    main.py
    api/
      router.py
      shared_routes.py
    core/
      config.py
      prompts.py
    shared/
      image_upload.py
      refinement.py
      schemas.py
    features/
      menu_translation/
        routes.py
        schemas.py
        ocr_engine.py
  tests/
    conftest.py
    test_ocr_service.py
    test_llm_service.py
    test_shared_and_menu_api.py
  requirements.txt
  pyproject.toml
```

### app/main.py
- Creates FastAPI app.
- Registers CORS middleware.
- Includes composed router from `app/api/router.py`.
- Exposes utility routes:
  - `GET /`
  - `GET /health`
  - `GET /api/v1/info`
- Contains global exception handler and startup logs.

### app/api/router.py
- Keeps API clean by composing subrouters.
- Includes:
  - shared router (`shared_routes.py`)
  - menu translation feature router (`features/menu_translation/routes.py`)

### app/api/shared_routes.py
Shared endpoints used across features:

- `POST /api/v1/uploads/image`
  - validates image type/size/content
  - does not persist image

- `POST /api/v1/llm/refine`
  - receives text output from any feature
  - applies prompt engineering + OpenAI completion
  - returns refined text with metadata

### app/core/config.py
- Centralized environment settings using `pydantic-settings`.
- Important settings:
  - OCR provider switch: `OCR_PROVIDER` (`easyocr` or `hf`)
  - OCR language list: `OCR_LANGUAGES`
  - HF model name: `HUGGINGFACE_OCR_MODEL`
  - OpenAI config: `OPENAI_API_KEY`, `OPENAI_MODEL`

### app/core/prompts.py
Prompt engineering lives here.

- `build_refinement_prompt(...)` builds system+user prompts.
- For `context in {menu, menu_translation, ...}` it applies menu-specific instructions:
  - preserve item order and prices
  - avoid hallucination
  - return refined translated menu text only
- `MENU_REFINEMENT_PROMPT_VERSION` tracks prompt iteration.

If quality is poor, this is the first file to tune.

### app/shared/image_upload.py
- Common image validation utility for all image-based features.
- Validates:
  - filename exists
  - MIME type in allowed set
  - max file size
  - image bytes are valid
- Returns normalized `ValidatedImage` object (in-memory only).

### app/shared/refinement.py
- Shared OpenAI client wrapper.
- `RefinementClient.refine(...)`:
  - builds prompt from `core/prompts.py`
  - calls OpenAI chat completion
  - returns `(refined_text, processing_ms, prompt_version)`

### app/shared/schemas.py
- Shared Pydantic request/response types:
  - `UploadImageResponse`
  - `RefineTextRequest`
  - `RefineTextResponse`
  - `LanguageEnum`

### app/features/menu_translation/ocr_engine.py
Menu feature OCR implementation.

- Provider abstraction:
  - `EasyOCROCRProvider` (local CPU)
  - `HuggingFaceOCRProvider` (remote inference API)
- Runtime selection based on `OCR_PROVIDER`.
- Returns `OCRResult(text, provider, processing_time_ms)`.

OCR source details:
- EasyOCR: local model managed by easyocr package.
- HF OCR: model configured by `HUGGINGFACE_OCR_MODEL`.
  - current default: `microsoft/trocr-base-printed`

### app/features/menu_translation/routes.py
- Feature endpoint:
  - `POST /api/v1/menu-translation/ocr`
- Uses shared image validation + feature OCR engine.
- Returns raw OCR text for downstream LLM refinement.

## API Endpoints And Correct Usage Order

Use this order in Swagger (`/docs`):

1. `GET /` -> app reachable
2. `GET /health` -> app healthy
3. `POST /api/v1/uploads/image` -> image validation check
4. `POST /api/v1/menu-translation/ocr` -> raw OCR output
5. `POST /api/v1/llm/refine` -> refine OCR output
6. `GET /api/v1/info` -> inspect service metadata

## Very Important: /llm/refine Payload Fields

For `POST /api/v1/llm/refine`, use:

- `content`: OCR raw text (long text goes here)
- `context`: short mode string (usually `menu_translation`)
- `source_language`: `vi`
- `target_language`: `en`

Common mistake:
- Putting full OCR text into `context`.

Correct example:

```json
{
  "content": "Phở bò\n50,000 VND",
  "context": "menu_translation",
  "source_language": "vi",
  "target_language": "en"
}
```

## Environment Variables

Create `backend/.env`:

```env
# App
APP_NAME=Smart Travel Assistant API
APP_VERSION=0.1.0
SERVICE_HOST=0.0.0.0
SERVICE_PORT=8000
SERVICE_DEBUG=false
LOG_LEVEL=INFO

# Upload
MAX_UPLOAD_SIZE_MB=10

# OCR
OCR_PROVIDER=easyocr
OCR_LANGUAGES=vi,en
OCR_GPU=false
HUGGINGFACE_OCR_MODEL=microsoft/trocr-base-printed

# OpenAI refinement
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

OpenAI key plugin location:
- `OPENAI_API_KEY` in `.env` (recommended), or shell export before running.

## Setup And Run

```bash
cd backend
uv init
uv add -r requirements.txt
uv lock
uv run uvicorn app.main:app --reload --host localhost --port 8000
```

Open:
- `http://localhost:8000/docs`

## Testing

Run all tests:

```bash
cd backend
uv run pytest -q
```

Run by scope:

```bash
uv run pytest -q tests/test_ocr_service.py
uv run pytest -q tests/test_llm_service.py
uv run pytest -q tests/test_shared_and_menu_api.py
```

Coverage:

```bash
uv run pytest --cov=app --cov-report=term-missing
```

## Prompt Quality Tuning Guide (For Better GPT Output)

If refinement output quality is poor, tune in this order:

1. Improve OCR text quality first
- Better image quality, less blur, better lighting.
- OCR noise directly reduces LLM translation quality.

2. Ensure refine payload is correct
- OCR text in `content`.
- `context="menu_translation"`.

3. Tune menu prompt in `app/core/prompts.py`
- Make formatting constraints explicit.
- Tell model to fix obvious OCR character confusions (`1Sk` -> `15k`) only when highly confident.
- Instruct no markdown bullets if undesired.

4. Consider stronger model for refine step
- Try higher-capability model if `gpt-4o-mini` is insufficient for noisy OCR.

## Current Known Tradeoff

- OCR+LLM quality depends heavily on OCR noise level.
- This phase focuses on clean architecture and stable API contracts.
- Advanced post-OCR normalization rules can be added next if needed.

## Deferred For Now

- Load testing with Locust is intentionally postponed until quality is acceptable.
