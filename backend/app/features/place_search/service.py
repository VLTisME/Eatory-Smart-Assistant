"""Service layer – proxies Goong Places REST API with caching & rate limiting."""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import time
from typing import Any, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Goong API constants ──────────────────────────────────────────────────────

GOONG_BASE_URL = "https://rsapi.goong.io"
AUTOCOMPLETE_PATH = "/Place/AutoComplete"
DETAIL_PATH = "/Place/Detail"

# ── In-memory cache (Redis-like fallback) ────────────────────────────────────
# key -> (data, expire_timestamp)
_cache: dict[str, tuple[Any, float]] = {}
CACHE_TTL_SECONDS = 300  # 5 min

# ── Rate limiter (sliding window) ────────────────────────────────────────────
_rate_lock = asyncio.Lock()
_request_timestamps: list[float] = []
MAX_REQUESTS_PER_MINUTE = 60  # adjust based on your Goong plan


def _cache_key(prefix: str, params: dict) -> str:
    """Create a deterministic cache key from request parameters."""
    raw = f"{prefix}:{json.dumps(params, sort_keys=True)}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _cache_get(key: str) -> Any | None:
    entry = _cache.get(key)
    if entry is None:
        return None
    data, expires = entry
    if time.time() > expires:
        _cache.pop(key, None)
        return None
    return data


def _cache_set(key: str, data: Any, ttl: int = CACHE_TTL_SECONDS) -> None:
    _cache[key] = (data, time.time() + ttl)


async def _check_rate_limit() -> None:
    """Raise if rate limit is exceeded (sliding window per minute)."""
    now = time.time()
    async with _rate_lock:
        # Purge timestamps older than 60 s
        while _request_timestamps and _request_timestamps[0] < now - 60:
            _request_timestamps.pop(0)
        if len(_request_timestamps) >= MAX_REQUESTS_PER_MINUTE:
            raise RateLimitExceeded("Too many requests – please try again in a moment.")
        _request_timestamps.append(now)


class RateLimitExceeded(Exception):
    """Raised when the per-minute rate limit is exceeded."""


# ── Public service functions ─────────────────────────────────────────────────

async def autocomplete(
    input_text: str,
    location: Optional[str] = None,
    limit: int = 10,
    radius: Optional[int] = None,
    more_compound: Optional[bool] = None,
) -> dict:
    """Call Goong Place/AutoComplete with caching and rate limiting."""

    params: dict[str, Any] = {
        "api_key": settings.places_api_key,
        "input": input_text,
        "limit": limit,
    }
    if location:
        params["location"] = location
    if radius is not None:
        params["radius"] = radius
    if more_compound is not None:
        params["more_compound"] = str(more_compound).lower()

    # 1. Check cache
    cache_params = {k: v for k, v in params.items() if k != "api_key"}
    key = _cache_key("autocomplete", cache_params)
    cached = _cache_get(key)
    if cached is not None:
        logger.info("Cache HIT for autocomplete key=%s", key[:12])
        return cached

    # 2. Rate limit
    await _check_rate_limit()

    # 3. Call Goong
    url = f"{GOONG_BASE_URL}{AUTOCOMPLETE_PATH}"
    logger.info("Calling Goong autocomplete: input=%r limit=%d", input_text, limit)

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    # 4. Cache result
    _cache_set(key, data)
    return data


async def place_detail(place_id: str) -> dict:
    """Call Goong Place/Detail with caching and rate limiting."""

    params: dict[str, Any] = {
        "api_key": settings.places_api_key,
        "place_id": place_id,
    }

    cache_params = {"place_id": place_id}
    key = _cache_key("detail", cache_params)
    cached = _cache_get(key)
    if cached is not None:
        logger.info("Cache HIT for detail key=%s", key[:12])
        return cached

    await _check_rate_limit()

    url = f"{GOONG_BASE_URL}{DETAIL_PATH}"
    logger.info("Calling Goong place detail: place_id=%s…", place_id[:20])

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    _cache_set(key, data, ttl=600)  # details rarely change — longer TTL
    return data
