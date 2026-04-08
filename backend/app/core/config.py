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
    ocr_provider: str = "easyocr"
    ocr_languages: str = "vi,en"
    ocr_gpu: bool = False
    huggingface_ocr_model: str = "microsoft/trocr-base-printed"

    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"

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
