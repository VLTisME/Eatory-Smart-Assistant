"""Runtime settings for the menu translation AI service."""

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

    app_name: str = "Menu Translation AI Service"
    app_version: str = "0.1.0"
    service_host: str = "0.0.0.0"
    service_port: int = 8101
    service_debug: bool = False
    log_level: str = "INFO"
    cors_allow_origins: list[str] = Field(default_factory=lambda: ["*"])

    service_token: str | None = None

    max_upload_size_mb: int = 10
    ocr_provider: str = "openai"
    ocr_languages: str = "vi,en"
    ocr_gpu: bool = False
    ocr_openai_model: str = "gpt-4o-mini"
    menu_refine_max_chars: int = 8000

    openai_api_key: str | None = None
    openai_refine_model: str = "gpt-4o-mini"

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
