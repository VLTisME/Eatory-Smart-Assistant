"""Supabase client factory for place metadata enrichment."""

from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from app.config import settings


class SupabaseConfigError(RuntimeError):
    """Raised when Supabase credentials are unavailable."""


@lru_cache
def get_supabase_client() -> Client:
    """Return a cached Supabase service client."""

    if not settings.supabase_url or not settings.supabase_service_key:
        raise SupabaseConfigError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be configured.")

    return create_client(settings.supabase_url, settings.supabase_service_key)
