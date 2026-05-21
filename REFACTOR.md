# Refactor Plan

This document describes a proposed refactor of the current Eatory Smart Assistant repository. It is a planning document only. It does not prescribe a big-bang rewrite; the safest path is to move one feature boundary at a time while keeping the frontend-facing backend API stable.

## Current Findings

The repository already has the intended top-level folders:

- `backend/`
- `ai-models/`
- `data-engineering/`
- `frontend/`

The problem is that ownership is mixed inside those folders, especially in `backend/`.

Current backend responsibilities include:

- Public FastAPI API composition in `backend/app/main.py` and `backend/app/api/router.py`.
- Firebase auth and chat persistence through Firestore.
- Supabase reads for places, images, review summaries, and review samples.
- Goong API proxying for autocomplete, place details, and directions.
- Image upload validation.
- AI/model workloads:
  - menu OCR through OpenAI vision or EasyOCR
  - structured menu generation through OpenAI prompts
  - generic `/api/v1/llm/refine`
  - CLIP image embedding and image similarity search
  - place-search LLM refinement
  - online review summary generation and translation through OpenAI
  - RAG chatbot routes that used to import `ai-models/rag/query_rag.py` directly before Phase 5

Current `ai-models/` responsibilities include:

- `rag-service/`: RAG service, document building scripts, Chroma vector search, and OpenAI answer generation.
- `review-summary-service/`: online review summary generation/translation plus the offline pipeline under `offline/`.
- `place-search-service/research/`: notebook work for CLIP embeddings.

Current `data-engineering/` responsibilities include:

- Kaggle extraction and Supabase upload scripts.
- Cloudinary upload scripts.
- Image query scripts that duplicate backend image query behavior.
- Google Maps scraper service and PostgreSQL schema scripts.

Current frontend responsibilities include:

- React/Vite app.
- Calls to backend endpoints.
- Several hard-coded `http://localhost:8000` API URLs mixed with relative `/api/v1` paths.

## Phase 0 Working Decisions

The team has accepted the phased refactor direction. These defaults are now the baseline for Phase 0:

- Keep frontend-facing backend routes stable while internals are refactored.
- Split AI by domain/service instead of creating one large AI runtime.
- Keep frontend calling backend only.
- Treat RAG as feature-complete in product behavior, but still needing service-boundary cleanup.
- Do documentation, configuration examples, and ownership decisions before moving runtime code.

## Target Ownership Model

### Backend

`backend/` should be the public API layer and application integration layer.

Backend owns:

- Public API routes consumed by frontend.
- Firebase authentication and authorization.
- Chat/conversation persistence.
- Supabase reads and writes that are application data concerns.
- Goong proxy routes for map autocomplete, place details, and directions.
- ImageKit auth signatures.
- Thin HTTP clients for internal AI services.
- Request validation that protects public APIs.

Backend must not own:

- Model loading.
- OCR engines.
- Embedding models.
- Vector database construction/query code.
- Prompt engineering and LLM orchestration.
- OpenAI, Hugging Face, Torch, Transformers, EasyOCR runtime logic.

### AI Models / AI Services

`ai-models/` should contain AI-owned services and offline AI pipelines.

AI owns:

- OCR and menu structuring.
- CLIP or image embedding search.
- RAG retrieval and RAG chat.
- Online LLM refinement, summarization, and translation.
- Prompt files and prompt versions.
- Model artifact paths and model-specific configuration.
- AI-specific tests and service READMEs.

Recommended AI service layout:

```text
ai-models/
  README.md
  common/
    README.md
    llm/
    schemas/
  menu-translation-service/  # Implemented in Phase 2
    README.md
    requirements.txt
    .env.example
    app/
      main.py
      routes.py
      schemas.py
      ocr_engine.py
      menu_pipeline.py
      prompts.py
  place-search-service/  # Implemented in Phase 3
    README.md
    requirements.txt
    .env.example
    app/
      main.py
      routes.py
      schemas.py
      embedding_engine.py
      search_engine.py
    artifacts/
      README.md
  rag-service/
    README.md
    requirements.txt
    .env.example
    app/
      main.py
      routes.py
      schemas.py
      retrieval.py
      generation.py
  review-summary-service/  # Implemented in Phase 4
    README.md
    requirements.txt
    .env.example
    app/
      main.py
      routes.py
      schemas.py
      prompts.py
      service.py
      llm.py
```

Notes:

- `ai-models/rag/` was renamed to `ai-models/rag-service/` in Phase 5 and now follows the service conventions.
- Offline review-summary scripts now live under `ai-models/review-summary-service/offline/`.
- `ai-models/common/` is optional. Use it only for shared schemas, LLM helpers, or prompt utilities that are genuinely shared by multiple AI services.

### Data Engineering

`data-engineering/` should contain ingestion, scraping, migration, and data publishing work.

Data Engineering owns:

- Kaggle/raw data extraction.
- Google Maps scraping.
- Uploading places, reviews, summaries, images, and embeddings to storage.
- Cloudinary upload jobs.
- Database schema and migration scripts related to ingestion.
- Batch jobs that produce AI input artifacts.

Data Engineering should not own:

- Runtime public APIs consumed by the frontend.
- Duplicate image query APIs that overlap with backend unless explicitly treated as internal tooling.
- AI model inference services.

### Frontend

`frontend/` should remain the React app.

Frontend owns:

- UI, flows, pages, components, hooks, and frontend types.
- Calls to backend public APIs only.
- No direct calls to AI services.
- No direct Supabase or private service keys.

Frontend should use:

- `VITE_API_BASE_URL` for backend.
- `VITE_FIREBASE_*` for Firebase public config.
- `VITE_GOONG_MAP_KEY` only if the map SDK requires a public client key.

## Proposed Runtime Architecture

```text
Frontend
  -> Backend public API
      -> Firebase / Firestore
      -> Supabase
      -> Goong
      -> ImageKit
      -> Internal AI services over HTTP
          -> menu-translation-service
          -> place-search-service
          -> rag-service
          -> review-summary-service
```

Backend remains the only service the frontend needs to know about.

AI services should be internal services. They can be unauthenticated on a private Docker network during local development, or protected with a simple service token later.

## Backend API Compatibility Goal

Keep these frontend-facing routes stable during migration unless there is a deliberate API version change:

- `POST /api/v1/menu-translation/ocr`
- `POST /api/v1/menu-translation/ocr/structured`
- `POST /api/v1/place-search`
- `GET /api/v1/places/autocomplete`
- `GET /api/v1/places/detail`
- `GET /api/v1/place-details`
- `GET /api/v1/place-details/by-city`
- `GET /api/v1/place-details/check-place`
- `GET /api/v1/place-images/single`
- `GET /api/v1/place-images`
- `GET /api/v1/place-images/random`
- `GET /api/v1/review-summary`
- `GET /api/v1/review-summary/samples`
- `POST /api/v1/rag/chat`
- `POST /api/v1/rag/retrieve`
- `GET /api/v1/directions`
- `GET /api/v1/imagekit/auth`
- `GET/POST/DELETE /api/v1/chat/conversations`

Backend can preserve these routes while internally replacing direct model calls with AI service clients.

## AI Service Endpoint Draft

### Menu Translation Service

Owns menu model code moved from backend in Phase 2:

- `backend/app/features/menu_translation/ocr_engine.py`
- `backend/app/features/menu_translation/menu_pipeline.py`
- `backend/app/features/menu_translation/menu_parser.py`
- menu-specific prompt logic from `backend/app/core/prompts.py`

Proposed endpoints:

- `GET /health`
- `POST /v1/menu/ocr`
  - multipart image upload
  - returns raw OCR text, provider, image metadata, processing time
- `POST /v1/menu/structured`
  - multipart image upload plus `restaurant_name` and `target_language`
  - returns structured menu JSON matching the current frontend `MenuResponse`

Backend behavior after migration:

- `POST /api/v1/menu-translation/ocr` validates auth/public request as needed, then proxies the image to `POST /v1/menu/ocr`.
- `POST /api/v1/menu-translation/ocr/structured` proxies to `POST /v1/menu/structured`.

### Place Search Service

Owns current backend model-heavy code from:

- CLIP model loading in `backend/app/features/place_search/service.py`
- image embedding generation
- noise detection
- vector similarity search
- optional place-search LLM refinement if still needed

Proposed endpoints:

- `GET /health`
- `POST /v1/place-search/by-image`
  - multipart image upload plus `target_language`
  - returns place candidates with `place_id`, image ids, image paths, and scores

Recommended boundary:

- AI service returns model results.
- Backend enriches results with Supabase place metadata when possible.

This keeps Supabase application data ownership in backend and limits AI service coupling. If latency or simplicity matters more, the AI service can read Supabase directly, but that should be an explicit team decision.

Keep Goong autocomplete/detail in backend. Those are third-party API proxy features, not AI model features.

### RAG Service

Current RAG feature exists under `ai-models/rag-service/`, with backend public routes under `backend/app/features/rag_chat/`.

Proposed endpoints, matching the current service:

- `GET /health`
- `POST /v1/rag/retrieve`
- `POST /v1/rag/chat`

Current public backend endpoints are `/api/v1/rag/retrieve` and `/api/v1/rag/chat`.
During refactor, standardize internal AI service APIs on `/v1/...`.
Backend can hide the internal path difference.

Backend already exposes:

- `POST /api/v1/rag/chat`
- `POST /api/v1/rag/retrieve`

Later product naming can decide whether these stay as RAG-specific routes or become assistant routes.

### Review Summary Service

Current offline pipeline lives in `ai-models/review-summary-service/offline/`.
Current backend online logic queries Supabase and calls OpenAI to generate or translate summaries.

Recommended split:

- Offline summary generation remains under `ai-models/review-summary-service/offline/scripts/`.
- Backend may read precomputed summaries from Supabase.
- Any online LLM generation or translation moves to AI service.

Proposed endpoints:

- `GET /health`
- `POST /v1/review-summary/generate`
  - receives place name, ratios, positive/negative keywords
  - returns summary JSON/text
- `POST /v1/review-summary/translate`
  - receives existing summary and target language
  - returns translated summary

Backend behavior after migration:

- `GET /api/v1/review-summary` fetches source data from Supabase.
- If online generation/translation is required, backend calls the AI service.
- `GET /api/v1/review-summary/samples` remains backend-only because it is a simple Supabase read.

### LLM Refinement

Current backend has a public generic endpoint:

- `POST /api/v1/llm/refine`

This should not remain as a general public backend endpoint unless there is a clear product requirement. It exposes a broad LLM capability and mixes AI prompt ownership into backend.

Recommended options:

- Preferred: remove public generic refinement and let each AI service own its own prompt.
- Alternative: create an internal `ai-models/llm-refinement-service` with `/v1/refine`, and have backend call it only for approved use cases.

## Dependency Separation

### Backend Dependencies

Backend should keep only application/API dependencies.

Keep or add:

- `fastapi`
- `uvicorn`
- `pydantic`
- `pydantic-settings`
- `python-dotenv`
- `python-multipart`, if backend still accepts file uploads before proxying
- `httpx`, for AI service and third-party API clients
- `firebase-admin`
- `supabase`
- test dependencies, preferably in `requirements-dev.txt` or a dev dependency group

Remove from backend runtime:

- `easyocr`
- `huggingface_hub`
- `openai`
- `transformers`
- `torch`
- most `numpy` usage, unless backend keeps non-AI numeric work
- `pillow`, unless backend continues to validate uploaded images locally
- `locust`, `pytest`, `pytest-cov`, `black`, `ruff` from production runtime requirements

### AI Dependencies

Each AI service gets its own `requirements.txt`.

Examples:

- `ai-models/menu-translation-service/requirements.txt`
  - `fastapi`, `uvicorn`, `pydantic`, `python-multipart`, `pillow`, `numpy`, `easyocr`, `openai`, `python-dotenv`
- `ai-models/place-search-service/requirements.txt`
  - `fastapi`, `uvicorn`, `pydantic`, `python-multipart`, `pillow`, `numpy`, `torch`, `transformers`, `python-dotenv`
- `ai-models/rag-service/requirements.txt`
  - current LangChain, Chroma, embedding, OpenAI, FastAPI dependencies
- `ai-models/review-summary-service/requirements.txt`
  - `fastapi`, `uvicorn`, `pydantic`, `openai`, plus existing offline pipeline dependencies if scripts remain in the same module

### Data Engineering Dependencies

Data Engineering should have its own dependency files.

Recommended:

- `data-engineering/requirements.txt` for shared ingestion scripts.
- Keep `data-engineering/maps-scraper/requirements.txt` for scraper-specific Playwright/FastAPI/PostgreSQL dependencies if it remains independently runnable.

Dependencies here include:

- `pandas`
- `supabase`
- `cloudinary`
- `python-dotenv`
- `sqlalchemy`
- `psycopg2-binary`
- scraper-specific dependencies

### Frontend Dependencies

Frontend remains managed by `frontend/package.json`.

Refactor target:

- no hard-coded backend URLs in source files
- one API base module that reads `import.meta.env.VITE_API_BASE_URL`

## Environment Separation

No single `.env` file should contain settings for every team.

### Backend `.env.example`

Backend should own:

- `APP_NAME`
- `APP_VERSION`
- `SERVICE_HOST`
- `SERVICE_PORT`
- `SERVICE_DEBUG`
- `LOG_LEVEL`
- `CORS_ALLOW_ORIGINS`
- `FIREBASE_SERVICE_ACCOUNT_PATH`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `REST_API_KEY` or `GOONG_REST_API_KEY`
- `KIT_URL_ENDPOINT`
- `KIT_PUBLIC_KEY`
- `KIT_PRIVATE_KEY`
- `AI_MENU_SERVICE_URL`
- `AI_PLACE_SEARCH_SERVICE_URL`
- `AI_RAG_SERVICE_URL`
- `AI_REVIEW_SUMMARY_SERVICE_URL`
- `AI_SERVICE_TIMEOUT_SECONDS`
- `AI_SERVICE_TOKEN`, if internal auth is used

Backend should not own:

- `OPENAI_API_KEY`
- `OCR_PROVIDER`
- `OCR_OPENAI_MODEL`
- model artifact paths
- CLIP model names
- Cloudinary ingestion credentials, unless backend directly manages uploads

### AI `.env.example`

Each AI service should own its model settings.

Menu service:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OCR_PROVIDER`
- `OCR_OPENAI_MODEL`
- `OCR_LANGUAGES`
- `OCR_GPU`
- `MENU_REFINE_MAX_CHARS`

Place search service:

- `PLACE_SEARCH_MODEL_NAME`
- `PLACE_SEARCH_EMBEDDINGS_PATH`
- `PLACE_SEARCH_INDEX_PATH`
- `PLACE_SEARCH_NOISE_EMBEDDINGS_PATH`
- `PLACE_SEARCH_NOISE_INDEX_PATH`
- `PLACE_SEARCH_NOISE_THRESHOLD`
- `PLACE_SEARCH_TOP_K_IMAGES`
- `PLACE_SEARCH_MIN_SIMILARITY`
- `PLACE_SEARCH_USE_GPU`
- optional `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` only if AI service directly enriches metadata

RAG service:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `RAG_CHROMA_DIR`
- `RAG_COLLECTION_NAME`
- `RAG_EMBEDDING_MODEL`
- `RAG_EMBEDDING_DEVICE`

Review summary service:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- optional `DATABASE_URL` only for offline scripts that write DB output

### Data Engineering `.env.example`

Data Engineering should own:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `DATABASE_URL`
- source dataset paths or Kaggle configuration

### Frontend `.env.example`

Frontend should own:

- `VITE_API_BASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GOONG_MAP_KEY`

## README Requirements

Each module should have a real README. The current root README describes the image query module instead of the whole project, and several module READMEs are stale or template-generated.

### Root `README.md`

Should include:

- project purpose
- repository layout
- local development overview
- service startup order
- links to module READMEs
- environment file overview
- testing overview

### `backend/README.md`

Should include:

- backend responsibility statement
- public API endpoint list
- request/response examples for every route group
- environment variables
- dependency installation
- local run command
- test command
- AI service URL configuration
- what backend does not own

Endpoint documentation should cover:

- health/info
- auth-protected chat
- ImageKit auth
- Goong place autocomplete/detail
- directions
- place details
- place images
- review summary
- menu translation proxy
- place image search proxy

### `ai-models/README.md`

Should include:

- AI service ownership rules
- service matrix
- ports
- dependencies
- artifact locations
- how backend calls each service
- how to run tests

### Each AI Service README

Each service README should include:

- functionality
- endpoints
- request/response schemas
- environment variables
- model/artifact requirements
- local setup
- run command
- tests
- common failures
- ownership notes

### `data-engineering/README.md`

Should include:

- data ownership rules
- ingestion pipeline order
- scripts and their inputs/outputs
- Supabase tables touched
- Cloudinary behavior
- scraper service usage
- environment variables
- generated files policy

### `frontend/README.md`

Should replace the Vite template with:

- app purpose
- environment variables
- backend API base configuration
- local run/build commands
- major pages/components
- API client layout
- auth flow

## Data And Artifact Policy

Current repository state includes large/generated local data under `data/` and tracked offline review-summary data under `ai-models/review-summary-service/offline/data/`.
The root `data/` directory currently contains required image-search artifacts such as embeddings, indexes, noise embeddings, and `places.json`. Phase 1 must not move or delete these files because the current image search does not use a vector database.

Recommended policy:

- Keep small examples only in git.
- Move large generated artifacts out of source control.
- Add `README.md` files in artifact directories describing how to reproduce or download artifacts.
- Prefer external storage for large model outputs and vector DBs.
- Keep local runtime artifacts under service-owned paths, for example:
  - `ai-models/place-search-service/artifacts/image_embeddings.npy`
  - `ai-models/place-search-service/artifacts/image_index.json`
  - `ai-models/rag-service/artifacts/chroma_db/`

## Migration Phases

### Phase 0: Baseline Documentation And Decisions

- Confirm service split and deployment style.
- Confirm public backend API compatibility requirements.
- Create or update `.env.example` files.
- Write module READMEs.
- Add an architecture diagram to root docs.
- Decide generated data/artifact policy.

### Phase 1: Backend Cleanup Without Behavior Changes

- Split backend code by responsibility.
- Move Goong autocomplete/detail out of the mixed `place_search` module into a non-AI places module.
- Introduce backend AI service client interfaces, but keep existing local implementations temporarily.
- Move backend production and development dependencies into separate files or dependency groups.
- Remove hard-coded frontend URLs by adding `VITE_API_BASE_URL`.

### Phase 2: Extract Menu Translation AI Service

- [x] Create `ai-models/menu-translation-service`.
- [x] Move OCR engine, menu pipeline, menu prompts, and menu schemas there.
- [x] Add `/health`, `/v1/menu/ocr`, and `/v1/menu/structured`.
- [x] Add service-specific tests.
- [x] Change backend menu routes to call the AI service over HTTP.
- [x] Remove menu OCR and OpenAI prompt code from backend.

### Phase 3: Extract Place Search AI Service

- [x] Create `ai-models/place-search-service`.
- [x] Move CLIP model loading, image embedding, noise detection, and similarity search there.
- [x] Keep the existing root `data/` image-search artifacts available during migration; do not move or delete them unless a later reviewed step introduces an equivalent artifact location or external storage.
- [x] Keep enriched place metadata in the AI service response for frontend compatibility.
- [x] Change backend `POST /api/v1/place-search` to call the AI service.
- [x] Keep Goong routes in backend.
- [x] Remove Torch/Transformers/Numpy model code from backend.

### Phase 4: Extract Review Summary And LLM Refinement

- [x] Move review summary prompt/generation/translation into `ai-models/review-summary-service`.
- [x] Keep offline scripts under `ai-models/review-summary-service/offline`.
- [x] Change backend review summary route to:
  - read data from Supabase
  - call AI only for generation/translation
  - return the existing frontend response shape
- [x] Remove review-summary OpenAI prompt code from backend.
- [x] Remove generic/RAG OpenAI refinement code from backend during Phase 5 RAG extraction.
- [x] Internalize `/api/v1/llm/refine` as a backend proxy to the AI refinement endpoint.

### Phase 5: Standardize RAG

- [x] Rename or normalize `ai-models/rag` into `ai-models/rag-service`.
- [x] Add `.env.example`.
- [x] Make model names and Chroma paths environment-driven.
- [x] Add backend client route for RAG chat/retrieval.
- [x] Keep frontend calling backend only.
- [x] Add a reusable AI refinement endpoint at `/v1/refinement/refine`.

### Phase 6: Data Engineering Cleanup

- [x] Add `data-engineering/requirements.txt`.
- [x] Remove or mark duplicate image query FastAPI scripts as tooling only.
- [x] Document Supabase table ownership.
- [x] Separate Cloudinary ingestion credentials from backend.
- [x] Move generated data and checkpoints out of git where practical.

### Phase 7: Testing, Compose, And CI

- [x] Update backend tests to mock AI HTTP clients instead of model classes.
- [x] Add AI service unit tests for each service.
- [x] Add contract tests for request/response schemas shared between backend and AI.
- [x] Add local `docker-compose.yml` for backend, frontend, and AI services.
- [x] Add CI checks per module:
  - backend tests
  - AI service tests
  - frontend lint/build
  - data-engineering smoke checks where possible

### Phase 8: Remove Old Code

- [x] Remove AI model code from backend.
- [x] Remove AI dependencies from backend.
- [x] Remove stale READMEs and template docs.
- [x] Split local `.env` files by module ownership.
- [x] Add contract tests instead of introducing shared contract packages for now.
- [x] Confirm frontend builds against backend public APIs.

## Post Runtime Stabilization Plan

These phases start after the Docker/runtime split is verified manually. The goal is to keep behavior stable while removing obvious clutter and making the Vietnamese/English UX consistent.

### Phase 9: Conservative Cleanup

- [x] Keep required runtime/data assets:
  - `data/` stays because it contains image embeddings, indexes, noise data, and `places.json`.
  - `ai-models/review-summary-service/offline/` stays as the offline review-summary pipeline.
  - `ai-models/rag-service/chroma_db/` stays as the current RAG artifact.
- [x] Remove only clearly redundant files/folders after import/reference checks:
  - old migrated `ai-models/rag/`
  - empty placeholder folders: `ai-models/ocr-model/`, `ai-models/sentiment-model/`, `ai-models/data-pipeline/`
  - temporary root `prompts.py`
  - Python caches such as `__pycache__/`
  - generated frontend artifacts such as `dist/` when they are not intentionally committed
- [x] Move notebook-only CLIP research into `ai-models/place-search-service/research/`.
- [x] Run backend and AI service import/compile checks after deletion.
- [x] Run `docker compose config --quiet`.

### Phase 10: Bilingual UX Contract

- [x] Use one global frontend language source:
  - supported values: `vi`, `en`
  - preserve the existing `homepage_lang` localStorage key for compatibility
  - treat the selected language as app-wide, not homepage-only
- [x] Language behavior:
  - homepage UI mirrors selected language
  - main map page UI mirrors selected language
  - chatbot UI, fallback messages, toast messages, history labels, image preview text, and tool labels mirror selected language
  - review summary output uses selected language
  - place search refined output uses selected language
  - RAG answer/refinement uses selected language
  - menu translation intentionally uses the opposite language:
    - UI `vi` -> menu output `en`
    - UI `en` -> menu output `vi`
- [x] Public API/interface updates:
  - add optional `target_language` to backend RAG chat request
  - pass `target_language` from frontend `sendRagChat`
  - add optional `target_language` to AI `rag-service` chat request
  - make RAG generation and refinement use `target_language` instead of hardcoded Vietnamese
  - keep existing menu/place/review endpoints stable while ensuring frontend passes the correct language
- [x] Prompt updates:
  - RAG system/refinement prompts support Vietnamese and English output
  - review summary prompt already supports `vi`/`en`; verify labels and emoji format during manual testing
  - place search prompt already accepts target language; frontend now passes it
  - menu prompt keeps translation behavior and receives the computed opposite language
- [x] Run frontend production build after language wiring changes.
- [ ] Manual verification:
  - switch homepage to Vietnamese, then verify homepage/map/chat/review/place/RAG output Vietnamese
  - switch homepage to English, then verify homepage/map/chat/review/place/RAG output English
  - verify menu translation is opposite-language in both directions
  - verify saved chat messages preserve the language used at creation time
  - verify fallback/error messages are localized

### Phase 10.5: Deep Module Consolidation

- [x] Move offline review-summary scripts, SQL, local data, and local Postgres compose file into `ai-models/review-summary-service/offline/`.
- [x] Move offline dependencies into `ai-models/review-summary-service/requirements-offline.txt`.
- [x] Merge offline environment guidance into `ai-models/review-summary-service/.env.example`.
- [x] Move CLIP notebook research into `ai-models/place-search-service/research/`.
- [x] Keep root `data/` as the runtime artifact source for place search.
- [x] Exclude offline/research folders from runtime AI Docker image contexts.

### Phase 11: Vietnamese Documentation

- [x] Write Vietnamese-only documentation after Phase 10 and Phase 10.5 are manually verified.
- [x] Root README should explain:
  - architecture
  - service ownership
  - Docker startup
  - environment setup
  - feature overview
- [x] Each module README should document:
  - purpose
  - endpoints or scripts
  - required environment variables
  - dependencies
  - run/test commands
  - owned data/artifacts
- [x] Do not write final docs before cleanup and bilingual behavior are stable.

## Suggested Ports For Local Development

These can change, but fixed defaults make docs easier:

- frontend: `5173`
- backend: `8000`
- menu translation AI: `8101`
- place search AI: `8102`
- RAG AI: `8103`
- review summary AI: `8104`
- data engineering scraper: `8201`

## Key Decisions Needed

1. Should AI be split into multiple services, or should there be one combined `ai-models/ai-service` FastAPI app with multiple routers?

   My recommendation is multiple services by domain because dependencies are heavy and different. Menu OCR, CLIP search, RAG, and review summarization do not need to be deployed or scaled together.

2. Should backend public route paths stay stable for the frontend?

   My recommendation is yes. Keep current `/api/v1/...` frontend contracts stable and refactor internals first.

3. Should AI services be allowed to read Supabase directly?

   My recommendation is only when necessary. Backend should own application data enrichment. AI services should prefer receiving inputs and returning model outputs. Place search is the main exception to discuss because the current model path loads place metadata during search.

4. Should `/api/v1/llm/refine` remain public?

   Decision: keep the public backend route for compatibility, but make it a proxy to the internal AI refinement endpoint. Backend no longer owns OpenAI prompt logic.

5. Should generated review summary CSV/JSON files remain tracked in git?

   My recommendation is to keep only small samples in git and move full generated data to external storage or reproducible local artifacts.

6. Should backend validate uploaded image dimensions/content before proxying to AI?

   If yes, backend keeps `pillow`. If no, AI services own image validation and backend only enforces request size and content type.

## Initial Refactor Priority

The first implementation pass should target the highest-coupling backend AI code:

1. Menu translation service extraction.
2. Place search service extraction.
3. Review summary LLM extraction.
4. RAG standardization.
5. Dependency and env cleanup.
6. README cleanup across modules.

This order removes the heaviest backend dependencies first while keeping the user-facing API stable.
