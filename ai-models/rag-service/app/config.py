"""Runtime settings for the RAG AI service."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


SERVICE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    """Configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=SERVICE_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "RAG AI Service"
    app_version: str = "0.1.0"
    service_host: str = "0.0.0.0"
    service_port: int = 8103
    service_debug: bool = False
    log_level: str = "INFO"
    cors_allow_origins: list[str] = Field(default_factory=lambda: ["*"])

    service_token: str | None = None

    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    openai_refine_model: str = "gpt-4o-mini"

    rag_chroma_dir: str = str(SERVICE_DIR / "chroma_db")
    rag_collection_name: str = "places_rag"
    rag_embedding_model: str = "AITeamVN/Vietnamese_Embedding"
    rag_embedding_device: str = "cpu"

    rag_no_results_message: str = "Mình chưa tìm thấy địa điểm phù hợp trong dữ liệu hiện tại."


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
