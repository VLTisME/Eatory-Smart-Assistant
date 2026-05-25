"""CLIP image search engine for place retrieval."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

from app.config import SERVICE_ROOT, settings
from app.schemas import PlaceSearchItem
from app.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


class PlaceSearchServiceError(RuntimeError):
    """Raised when place search assets or model cannot be initialized."""


class PlaceSearchNoiseError(RuntimeError):
    """Raised when an uploaded image is too similar to known noise."""

    def __init__(self, category: str, score: float, image_path: str) -> None:
        super().__init__("Uploaded image is too similar to known noise.")
        self.category = category
        self.score = score
        self.image_path = image_path


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

        project_root = SERVICE_ROOT.parents[1]
        candidates = [
            project_root / path,
            SERVICE_ROOT / path,
        ]
        for candidate in candidates:
            if candidate.exists():
                return candidate

        return candidates[0]

    def _load_assets(self) -> PlaceSearchAssets:
        embeddings_path = self._resolve_data_path(settings.place_search_embeddings_path)
        index_path = self._resolve_data_path(settings.place_search_index_path)

        if not embeddings_path.exists():
            raise PlaceSearchServiceError(f"Embeddings file not found: {embeddings_path}")
        if not index_path.exists():
            raise PlaceSearchServiceError(f"Image index file not found: {index_path}")

        embeddings = np.load(embeddings_path)
        with index_path.open("r", encoding="utf-8") as file:
            image_index = json.load(file)

        places = self._load_places()

        if not isinstance(image_index, list):
            raise PlaceSearchServiceError("Invalid image index format. Expected a list.")
        if not isinstance(places, list):
            raise PlaceSearchServiceError("Invalid places format. Expected a list.")
        if embeddings.ndim != 2:
            raise PlaceSearchServiceError("Embeddings must be a 2D matrix.")
        if embeddings.shape[0] != len(image_index):
            raise PlaceSearchServiceError(
                f"Embeddings count ({embeddings.shape[0]}) does not match image index length ({len(image_index)})."
            )

        places_by_id: dict[str, dict] = {}
        for place in places:
            place_id = str(place.get("place_id", "")).strip()
            if place_id:
                places_by_id[place_id] = place

        return PlaceSearchAssets(
            embeddings=embeddings.astype(np.float32),
            image_index=image_index,
            places_by_id=places_by_id,
        )

    def _load_places(self) -> list[dict]:
        try:
            supabase = get_supabase_client()
            places: list[dict] = []
            page_size = 1000
            offset = 0
            while True:
                response = (
                    supabase.table("places")
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
            return places
        except Exception as exc:
            logger.warning("Unable to load places from Supabase: %s", exc)

        places_path = self._resolve_data_path(settings.place_search_places_path)
        if not places_path.exists():
            raise PlaceSearchServiceError(
                f"Unable to load places from Supabase and fallback places file not found: {places_path}"
            )

        with places_path.open("r", encoding="utf-8") as file:
            places = json.load(file)
        logger.info("Loaded %d places from local file %s", len(places), places_path)
        return places

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
