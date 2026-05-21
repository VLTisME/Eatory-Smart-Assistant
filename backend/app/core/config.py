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

    rest_api_key: str | None = None
    firebase_service_account_path: str = "firebase-service-account.json"

    review_summary_path: str = (
        "../ai-models/review-summary-service/offline/data/output/review_summaries.json"
    )

    supabase_url: str | None = None
    supabase_service_key: str | None = None
    # ImageKit configuration
    kit_url_endpoint: str | None = None
    kit_public_key: str | None = None
    kit_private_key: str | None = None

    ai_menu_service_url: str | None = None
    ai_place_search_service_url: str | None = None
    ai_rag_service_url: str | None = None
    ai_refinement_service_url: str | None = None
    ai_review_summary_service_url: str | None = None
    ai_service_timeout_seconds: float = 180.0
    ai_service_token: str | None = None

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
