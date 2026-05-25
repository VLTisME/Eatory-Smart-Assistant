"""Service layer — proxy requests to Goong Directions REST API."""

from __future__ import annotations

import hashlib
import json
import logging
import time
from typing import Any

import httpx

from app.core.config import settings
from app.features.directions.schemas import DirectionResponse

logger = logging.getLogger(__name__)

GOONG_BASE_URL = "https://rsapi.goong.io"
DIRECTION_PATH = "/direction"

# Simple in-memory cache to avoid duplicate API calls
_cache: dict[str, tuple[Any, float]] = {}
CACHE_TTL_SECONDS = 300


def _cache_key(params: dict[str, str]) -> str:
    raw = json.dumps(params, sort_keys=True)
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


# Map frontend vehicle names to Goong API vehicle parameter.
# Goong only supports: car, bike, truck, taxi, hd.
# There is NO pedestrian/walking mode — we use "bike" as the closest alternative.
VEHICLE_MAP: dict[str, str] = {
    "car": "car",
    "driving": "car",
    "motorcycle": "bike",
    "bike": "bike",
    "walking": "bike",
    "foot": "bike",
    "taxi": "taxi",
    "truck": "truck",
}


async def get_directions(
    origin: str,
    destination: str,
    vehicle: str = "car",
) -> DirectionResponse:
    """Fetch directions from Goong Directions API.

    Args:
        origin: Origin coordinates as "lat,lng".
        destination: Destination coordinates as "lat,lng".
        vehicle: Transport mode (car/driving, motorcycle/bike, walking/foot).

    Returns:
        DirectionResponse with routes, legs, steps, polyline, etc.
    """
    goong_vehicle = VEHICLE_MAP.get(vehicle.lower(), "car")

    params: dict[str, str] = {
        "origin": origin,
        "destination": destination,
        "vehicle": goong_vehicle,
        "api_key": settings.rest_api_key or "",
    }

    # Check cache first
    cache_params = {k: v for k, v in params.items() if k != "api_key"}
    key = _cache_key(cache_params)
    cached = _cache_get(key)
    if cached is not None:
        logger.info("Cache HIT for directions key=%s", key[:12])
        return DirectionResponse.model_validate(cached)

    url = f"{GOONG_BASE_URL}{DIRECTION_PATH}"
    logger.info(
        "Calling Goong directions: origin=%s destination=%s vehicle=%s",
        origin,
        destination,
        goong_vehicle,
    )

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    _cache_set(key, data)
    return DirectionResponse.model_validate(data)
