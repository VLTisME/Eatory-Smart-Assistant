"""Runtime settings for the place search AI service."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


SERVICE_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    """Service configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=SERVICE_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Place Search AI Service"
    app_version: str = "0.1.0"
    service_host: str = "0.0.0.0"
    service_port: int = 8102
    service_debug: bool = False
    log_level: str = "INFO"
    cors_allow_origins: list[str] = Field(default_factory=lambda: ["*"])

    service_token: str | None = None

    max_upload_size_mb: int = 10

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

    supabase_url: str | None = None
    supabase_service_key: str | None = None

    openai_api_key: str | None = None
    openai_refine_model: str = "gpt-4o-mini"

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
