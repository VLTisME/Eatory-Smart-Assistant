"""Application settings and runtime configuration."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Smart Travel Assistant API"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"
    service_host: str = "0.0.0.0"
    service_port: int = 8000
    service_debug: bool = False
    log_level: str = "INFO"
    cors_allow_origins: list[str] = Field(default_factory=lambda: ["*"])

    max_upload_size_mb: int = 10
    ocr_provider: str = "openai"
    ocr_languages: str = "vi,en"
    ocr_gpu: bool = False
    ocr_openai_model: str = "gpt-4o-mini"
    menu_refine_max_chars: int = 8000


    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    places_api_key: str | None = None
    firebase_service_account_path: str = "firebase-service-account.json"
    openai_refine_model: str = "gpt-4o-mini"

    place_search_embeddings_path: str = "data/image_embeddings.npy"
    place_search_index_path: str = "data/image_index.json"
    place_search_places_path: str = "data/places.json"
    place_search_noise_embeddings_path: str = "data/noise_embeddings.npy"
    place_search_noise_index_path: str = "data/noise_index.json"
    place_search_noise_threshold: float = 0.73
    place_search_model_name: str = "laion/CLIP-ViT-H-14-laion2B-s32B-b79K"
    place_search_top_k_images: int = 5
    place_search_min_similarity: float = 0.0
    place_search_use_gpu: bool = False

    review_summary_path: str = "../ai-models/review_summary/data/output/review_summaries.json"

    supabase_url: str | None = None
    supabase_service_key: str | None = None
    # ImageKit configuration
    kit_url_endpoint: str | None = None
    kit_public_key: str | None = None
    kit_private_key: str | None = None

    @property
    def ocr_language_list(self) -> list[str]:
        return [language.strip() for language in self.ocr_languages.split(",") if language.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def allowed_image_content_types(self) -> set[str]:
        return {"image/jpeg", "image/png", "image/webp", "image/bmp"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
