"""Service and pipeline for image search plus Goong place lookups."""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
import time
from dataclasses import dataclass
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import Any, Optional

import httpx
import numpy as np
from PIL import Image

from app.core.config import settings
from app.core.supabase import get_supabase_client
from app.features.place_search.schemas import PlaceAutoCompleteResponse, PlaceDetailResponse, PlaceSearchItem, PlaceSearchResponse
from app.shared.refinement import RefinementClient

logger = logging.getLogger(__name__)

GOONG_BASE_URL = "https://rsapi.goong.io"
AUTOCOMPLETE_PATH = "/Place/AutoComplete"
DETAIL_PATH = "/Place/Detail"

_cache: dict[str, tuple[Any, float]] = {}
CACHE_TTL_SECONDS = 300
_rate_lock = asyncio.Lock()
_request_timestamps: list[float] = []
MAX_REQUESTS_PER_MINUTE = 60


class PlaceSearchServiceError(RuntimeError):
    """Raised when place search assets or model cannot be initialized."""


class PlaceSearchNoiseError(RuntimeError):
    """Raised when an uploaded image is too similar to known noise."""

    def __init__(self, category: str, score: float, image_path: str) -> None:
        super().__init__("Uploaded image is too similar to known noise.")
        self.category = category
        self.score = score
        self.image_path = image_path


class RateLimitExceeded(Exception):
    """Raised when the per-minute rate limit is exceeded."""


@dataclass(slots=True)
class PlaceSearchAssets:
    """In-memory assets used for place retrieval."""

    embeddings: np.ndarray
    image_index: list[dict]
    places_by_id: dict[str, dict]


@dataclass(slots=True)
class NoiseSearchAssets:
    """In-memory assets used for noise detection."""

    embeddings: np.ndarray
    index: list[dict]


def _cache_key(prefix: str, params: dict) -> str:
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
    now = time.time()
    async with _rate_lock:
        while _request_timestamps and _request_timestamps[0] < now - 60:
            _request_timestamps.pop(0)
        if len(_request_timestamps) >= MAX_REQUESTS_PER_MINUTE:
            raise RateLimitExceeded("Too many requests – please try again in a moment.")
        _request_timestamps.append(now)


async def autocomplete(
    input_text: str,
    location: Optional[str] = None,
    limit: int = 10,
    radius: Optional[int] = None,
    more_compound: Optional[bool] = None,
) -> PlaceAutoCompleteResponse:
    params: dict[str, Any] = {
        "api_key": settings.rest_api_key,
        "input": input_text,
        "limit": limit,
    }
    if location:
        params["location"] = location
    if radius is not None:
        params["radius"] = radius
    if more_compound is not None:
        params["more_compound"] = str(more_compound).lower()

    cache_params = {k: v for k, v in params.items() if k != "api_key"}
    key = _cache_key("autocomplete", cache_params)
    cached = _cache_get(key)
    if cached is not None:
        logger.info("Cache HIT for autocomplete key=%s", key[:12])
        return PlaceAutoCompleteResponse.model_validate(cached)

    await _check_rate_limit()

    url = f"{GOONG_BASE_URL}{AUTOCOMPLETE_PATH}"
    logger.info("Calling Goong autocomplete: input=%r limit=%d", input_text, limit)

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    _cache_set(key, data)
    return PlaceAutoCompleteResponse.model_validate(data)


async def place_detail(place_id: str) -> PlaceDetailResponse:
    params: dict[str, Any] = {
        "api_key": settings.rest_api_key,
        "place_id": place_id,
    }

    cache_params = {"place_id": place_id}
    key = _cache_key("detail", cache_params)
    cached = _cache_get(key)
    if cached is not None:
        logger.info("Cache HIT for detail key=%s", key[:12])
        return PlaceDetailResponse.model_validate(cached)

    await _check_rate_limit()

    url = f"{GOONG_BASE_URL}{DETAIL_PATH}"
    logger.info("Calling Goong place detail: place_id=%s…", place_id[:20])

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    _cache_set(key, data, ttl=600)
    return PlaceDetailResponse.model_validate(data)


class PlaceSearchEngine:
    """Loads CLIP model and performs cosine similarity retrieval."""

    def __init__(self) -> None:
        self._assets = self._load_assets()
        self._noise_assets = self._load_noise_assets()
        self._processor = None
        self._model = None
        self._torch = None
        self._device = "cpu"
        self._load_model()

    def _resolve_data_path(self, configured_path: str) -> Path:
        path = Path(configured_path)
        if path.is_absolute():
            return path

        backend_root = Path(__file__).resolve().parents[3]
        project_root = backend_root.parent

        candidates = [project_root / path, backend_root / path]
        for candidate in candidates:
            if candidate.exists():
                return candidate

        return candidates[0]

    def _load_assets(self) -> PlaceSearchAssets:
        embeddings_path = self._resolve_data_path(settings.place_search_embeddings_path)
        index_path = self._resolve_data_path(settings.place_search_index_path)
        noise_embeddings_path = self._resolve_data_path(settings.place_search_noise_embeddings_path)
        noise_index_path = self._resolve_data_path(settings.place_search_noise_index_path)

        if not embeddings_path.exists():
            raise PlaceSearchServiceError(f"Embeddings file not found: {embeddings_path}")
        if not index_path.exists():
            raise PlaceSearchServiceError(f"Image index file not found: {index_path}")
        if not noise_embeddings_path.exists():
            raise PlaceSearchServiceError(f"Noise embeddings file not found: {noise_embeddings_path}")
        if not noise_index_path.exists():
            raise PlaceSearchServiceError(f"Noise index file not found: {noise_index_path}")

        embeddings = np.load(embeddings_path)
        noise_embeddings = np.load(noise_embeddings_path)

        with index_path.open("r", encoding="utf-8") as file:
            image_index = json.load(file)
        with noise_index_path.open("r", encoding="utf-8") as file:
            noise_index = json.load(file)
        
        try:
            supabase = get_supabase_client()
            places = []
            page_size = 1000          
            offset = 0                
            while True:
                response = (
                    supabase
                    .table("places")
                    .select("place_id, name, address")
                    .range(offset, offset + page_size - 1)   
                    .execute()
                )
                batch = response.data or []
                places.extend(batch)           
                if len(batch) < page_size:     
                    break
                offset += page_size            
            logger.info("Loaded %d places from Supabase", len(places))
        except Exception as e:
            raise PlaceSearchServiceError(f"Unable to query places table from Supabase: {e}")


        if not isinstance(image_index, list):
            raise PlaceSearchServiceError("Invalid image index format. Expected a list.")
        if not isinstance(noise_index, list):
            raise PlaceSearchServiceError("Invalid noise index format. Expected a list.")
        if not isinstance(places, list):
            raise PlaceSearchServiceError("Invalid places format from Supabase. Expected a list.")    
        if embeddings.ndim != 2:
            raise PlaceSearchServiceError("Embeddings must be a 2D matrix.")
        if noise_embeddings.ndim != 2:
            raise PlaceSearchServiceError("Noise embeddings must be a 2D matrix.")

        if embeddings.shape[0] != len(image_index):
            raise PlaceSearchServiceError(
                f"Embeddings count ({embeddings.shape[0]}) does not match image index length ({len(image_index)})."
            )
        if noise_embeddings.shape[0] != len(noise_index):
            raise PlaceSearchServiceError(
                f"Noise embeddings count ({noise_embeddings.shape[0]}) does not match noise index length ({len(noise_index)})."
            )

        places_by_id: dict[str, dict] = {}
        for place in places:
            place_id = str(place.get("place_id", "")).strip()
            if not place_id:
                continue
            places_by_id[place_id] = place

        return PlaceSearchAssets(
            embeddings=embeddings.astype(np.float32),
            image_index=image_index,
            places_by_id=places_by_id,
        )

    def _load_noise_assets(self) -> NoiseSearchAssets:
        embeddings_path = self._resolve_data_path(settings.place_search_noise_embeddings_path)
        index_path = self._resolve_data_path(settings.place_search_noise_index_path)

        if not embeddings_path.exists():
            raise PlaceSearchServiceError(f"Noise embeddings file not found: {embeddings_path}")
        if not index_path.exists():
            raise PlaceSearchServiceError(f"Noise index file not found: {index_path}")

        embeddings = np.load(embeddings_path)
        with index_path.open("r", encoding="utf-8") as file:
            noise_index = json.load(file)

        if not isinstance(noise_index, list):
            raise PlaceSearchServiceError("Invalid noise index format. Expected a list.")
        if embeddings.ndim != 2:
            raise PlaceSearchServiceError("Noise embeddings must be a 2D matrix.")
        if embeddings.shape[0] != len(noise_index):
            raise PlaceSearchServiceError(
                f"Noise embeddings count ({embeddings.shape[0]}) does not match noise index length ({len(noise_index)})."
            )

        return NoiseSearchAssets(embeddings=embeddings.astype(np.float32), index=noise_index)

    def _load_model(self) -> None:
        try:
            import torch
            from transformers import CLIPModel, CLIPProcessor
        except Exception as exc:  # pragma: no cover
            raise PlaceSearchServiceError(
                "Failed to import transformers/torch for place search. Ensure dependencies are installed."
            ) from exc

        use_gpu = settings.place_search_use_gpu and torch.cuda.is_available()
        self._device = "cuda" if use_gpu else "cpu"
        self._torch = torch
        self._processor = CLIPProcessor.from_pretrained(settings.place_search_model_name)
        self._model = CLIPModel.from_pretrained(settings.place_search_model_name)
        self._model.to(self._device)
        self._model.eval()

    def _embed_image_bytes(self, image_bytes: bytes) -> np.ndarray:
        if self._processor is None or self._model is None or self._torch is None:
            raise PlaceSearchServiceError("Model is not initialized.")

        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        inputs = self._processor(images=[image], return_tensors="pt", padding=True).to(self._device)

        with self._torch.no_grad():
            vision_outputs = self._model.vision_model(pixel_values=inputs["pixel_values"])
            pooled = vision_outputs.pooler_output
            embedding = self._model.visual_projection(pooled)

        vector = embedding.cpu().numpy()[0].astype(np.float32)
        norm = np.linalg.norm(vector)
        if norm == 0:
            raise PlaceSearchServiceError("Received zero vector embedding for query image.")
        return vector / norm

    def _detect_noise(self, query_vector: np.ndarray) -> None:
        noise_assets = getattr(self, "_noise_assets", None)
        if noise_assets is None:
            return

        similarities = noise_assets.embeddings @ query_vector
        best_index = int(np.argmax(similarities))
        best_score = float(similarities[best_index])

        if best_score < settings.place_search_noise_threshold:
            return

        meta = noise_assets.index[best_index] if best_index < len(noise_assets.index) else {}
        raise PlaceSearchNoiseError(
            category=str(meta.get("category", "")),
            score=best_score,
            image_path=str(meta.get("file_path", "")),
        )

    @staticmethod
    def _aggregate_place_scores(scores: list[float]) -> float:
        return float(sum(scores))

    def search(self, image_bytes: bytes, *, top_k_images: int | None = None) -> list[PlaceSearchItem]:
        query_vector = self._embed_image_bytes(image_bytes)
        self._detect_noise(query_vector)
        top_k = top_k_images or settings.place_search_top_k_images
        top_k = max(1, min(top_k, len(self._assets.image_index)))

        similarities = self._assets.embeddings @ query_vector
        top_indices = np.argpartition(similarities, -top_k)[-top_k:]
        sorted_indices = top_indices[np.argsort(similarities[top_indices])[::-1]]

        grouped: dict[str, dict[str, Any]] = {}
        min_similarity = settings.place_search_min_similarity

        for idx in sorted_indices:
            score = float(similarities[idx])
            if score < min_similarity:
                continue

            clamped_score = max(0.0, min(1.0, score))

            meta = self._assets.image_index[int(idx)]
            place_id = str(meta.get("place_id", "")).strip()
            if not place_id:
                continue

            place_meta = self._assets.places_by_id.get(place_id, {})
            candidate = {
                "score": clamped_score,
                "image_id": str(meta.get("image_id", "")),
                "file_path": str(meta.get("file_path", "")),
            }
            existing = grouped.get(place_id)
            if existing is None:
                grouped[place_id] = {
                    "scores": [clamped_score],
                    "image_id": candidate["image_id"],
                    "top_image": candidate["file_path"],
                    "top_score": clamped_score,
                    "images": [candidate],
                    "name": str(place_meta.get("name", "") or ""),
                    "address": str(place_meta.get("address", "") or ""),
                }
            else:
                existing["scores"].append(clamped_score)
                existing["images"].append(candidate)
                if clamped_score > existing["top_score"]:
                    existing["top_score"] = clamped_score
                    existing["image_id"] = candidate["image_id"]
                    existing["top_image"] = candidate["file_path"]

        results = []
        for place_id, data in grouped.items():
            images = sorted(data["images"], key=lambda item: item["score"], reverse=True)[:3]
            results.append(
                PlaceSearchItem(
                    place_id=place_id,
                    image_id=str(data["image_id"]),
                    score=self._aggregate_place_scores(data["scores"]),
                    top_image=str(data["top_image"]),
                    images=[
                        {
                            "image_id": str(image["image_id"]),
                            "score": float(image["score"]),
                            "file_path": str(image["file_path"]),
                        }
                        for image in images
                    ],
                    name=str(data["name"]),
                    address=str(data["address"]),
                )
            )

        return sorted(results, key=lambda item: item.score, reverse=True)


class PlaceSearchPipeline:
    """Search pipeline: retrieval first, then optional LLM refinement."""

    def __init__(self, engine: PlaceSearchEngine, llm_client: RefinementClient | None = None):
        self._engine = engine
        self._llm = llm_client

    def run(self, image_bytes: bytes, *, target_language: str = "vi") -> PlaceSearchResponse:
        raw_results = self._engine.search(image_bytes)
        if not raw_results:
            return PlaceSearchResponse(results=[])

        raw_response = PlaceSearchResponse(results=raw_results)

        if self._llm is None:
            logger.warning("No refinement client available for place search. Returning raw response.")
            return raw_response

        try:
            return self._refine_response(raw_response, target_language=target_language)
        except Exception as exc:
            logger.error("Place search refinement failed, falling back to raw response: %s", exc)
            return raw_response

    def _refine_response(self, raw_response: PlaceSearchResponse, *, target_language: str) -> PlaceSearchResponse:
        payload = raw_response.model_dump(by_alias=True)
        content = json.dumps(payload, ensure_ascii=False)

        refined_text, duration_ms, _ = self._llm.refine(
            content=content,
            context="place_search",
            source_language="vi",
            target_language=target_language,
        )
        logger.info("Place search refinement completed in %.0fms", duration_ms)

        json_str = self._extract_json(refined_text)
        data = json.loads(json_str)
        return PlaceSearchResponse.model_validate(data)

    def _extract_json(self, text: str) -> str:
        markdown_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if markdown_match:
            return markdown_match.group(1)

        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            return json_match.group(0)

        raise ValueError("No JSON object found in LLM output")


@lru_cache(maxsize=1)
def get_place_search_engine() -> PlaceSearchEngine:
    return PlaceSearchEngine()
