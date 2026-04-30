"""Service and pipeline for image-based place search."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from functools import lru_cache
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image

from app.core.config import settings
from app.features.place_search.schemas import PlaceSearchItem, PlaceSearchResponse
from app.shared.refinement import RefinementClient

logger = logging.getLogger(__name__)


class PlaceSearchServiceError(RuntimeError):
    """Raised when place search assets or model cannot be initialized."""


@dataclass(slots=True)
class PlaceSearchAssets:
    """In-memory assets used for place retrieval."""

    embeddings: np.ndarray
    image_index: list[dict]
    places_by_id: dict[str, dict]


class PlaceSearchEngine:
    """Loads ViT model and performs cosine similarity retrieval."""

    def __init__(self) -> None:
        self._assets = self._load_assets()
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
        places_path = self._resolve_data_path(settings.place_search_places_path)

        if not embeddings_path.exists():
            raise PlaceSearchServiceError(f"Embeddings file not found: {embeddings_path}")
        if not index_path.exists():
            raise PlaceSearchServiceError(f"Image index file not found: {index_path}")
        if not places_path.exists():
            raise PlaceSearchServiceError(f"Places file not found: {places_path}")

        embeddings = np.load(embeddings_path)

        with index_path.open("r", encoding="utf-8") as file:
            image_index = json.load(file)
        with places_path.open("r", encoding="utf-8") as file:
            places = json.load(file)

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
            if not place_id:
                continue
            places_by_id[place_id] = place

        return PlaceSearchAssets(
            embeddings=embeddings.astype(np.float32),
            image_index=image_index,
            places_by_id=places_by_id,
        )

    def _load_model(self) -> None:
        try:
            import torch
            from transformers import AutoImageProcessor, AutoModel
        except Exception as exc:  # pragma: no cover
            raise PlaceSearchServiceError(
                "Failed to import transformers/torch for place search. "
                "Ensure dependencies are installed."
            ) from exc

        use_gpu = settings.place_search_use_gpu and torch.cuda.is_available()
        self._device = "cuda" if use_gpu else "cpu"
        self._torch = torch
        self._processor = AutoImageProcessor.from_pretrained(settings.place_search_model_name)
        self._model = AutoModel.from_pretrained(settings.place_search_model_name)
        self._model.to(self._device)
        self._model.eval()

    def _embed_image_bytes(self, image_bytes: bytes) -> np.ndarray:
        if self._processor is None or self._model is None or self._torch is None:
            raise PlaceSearchServiceError("Model is not initialized.")

        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        inputs = self._processor(images=[image], return_tensors="pt").to(self._device)

        with self._torch.no_grad():
            outputs = self._model(**inputs)
            embedding = outputs.last_hidden_state[:, 0]

        vector = embedding.cpu().numpy()[0].astype(np.float32)
        norm = np.linalg.norm(vector)
        if norm == 0:
            raise PlaceSearchServiceError("Received zero vector embedding for query image.")
        return vector / norm

    def search(self, image_bytes: bytes, *, top_k_images: int | None = None) -> list[PlaceSearchItem]:
        query_vector = self._embed_image_bytes(image_bytes)
        top_k = top_k_images or settings.place_search_top_k_images
        top_k = max(1, min(top_k, len(self._assets.image_index)))

        similarities = self._assets.embeddings @ query_vector
        top_indices = np.argpartition(similarities, -top_k)[-top_k:]
        sorted_indices = top_indices[np.argsort(similarities[top_indices])[::-1]]

        grouped: dict[str, PlaceSearchItem] = {}
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
            candidate = PlaceSearchItem(
                place_id=place_id,
                score=clamped_score,
                top_image=str(meta.get("file_path", "")),
                name=str(place_meta.get("name", "") or ""),
                address=str(place_meta.get("address", "") or ""),
            )

            existing = grouped.get(place_id)
            if existing is None or candidate.score > existing.score:
                grouped[place_id] = candidate

        return sorted(grouped.values(), key=lambda item: item.score, reverse=True)


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
        markdown_match = re.search(r"```(?:json)?\\s*(\{.*?\})\\s*```", text, re.DOTALL)
        if markdown_match:
            return markdown_match.group(1)

        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            return json_match.group(0)

        raise ValueError("No JSON object found in LLM output")


@lru_cache(maxsize=1)
def get_place_search_engine() -> PlaceSearchEngine:
    return PlaceSearchEngine()
