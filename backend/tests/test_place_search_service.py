"""Unit tests for place search service scoring behavior."""

from __future__ import annotations

from types import SimpleNamespace

import numpy as np
import pytest

from app.features.place_search.service import PlaceSearchEngine, PlaceSearchNoiseError


def test_place_search_sums_scores_per_place_id():
    engine = PlaceSearchEngine.__new__(PlaceSearchEngine)
    engine._assets = SimpleNamespace(
        embeddings=np.array(
            [
                [1.0, 0.0],
                [0.6, 0.0],
                [0.9, 0.0],
            ],
            dtype=np.float32,
        ),
        image_index=[
            {"place_id": "place_a", "image_id": "a-1", "file_path": "a-1.jpg"},
            {"place_id": "place_a", "image_id": "a-2", "file_path": "a-2.jpg"},
            {"place_id": "place_b", "image_id": "b-1", "file_path": "b-1.jpg"},
        ],
        places_by_id={
            "place_a": {"name": "Place A", "address": "Addr A"},
            "place_b": {"name": "Place B", "address": "Addr B"},
        },
    )
    engine._embed_image_bytes = lambda image_bytes: np.array([1.0, 0.0], dtype=np.float32)

    results = engine.search(b"fake-bytes", top_k_images=3)

    assert [item.place_id for item in results] == ["place_a", "place_b"]
    assert results[0].score == pytest.approx(1.6)
    assert results[0].image_id == "a-1"
    assert results[0].top_image == "a-1.jpg"
    assert len(results[0].images) == 2
    assert results[0].images[0].image_id == "a-1"
    assert results[1].score == pytest.approx(0.9)


def test_place_search_raises_noise_error_when_query_matches_noise():
    engine = PlaceSearchEngine.__new__(PlaceSearchEngine)
    engine._noise_assets = SimpleNamespace(
        embeddings=np.array([[1.0, 0.0]], dtype=np.float32),
        index=[{"category": "bill", "file_path": "/tmp/noise.jpg"}],
    )
    engine._embed_image_bytes = lambda image_bytes: np.array([1.0, 0.0], dtype=np.float32)

    with pytest.raises(PlaceSearchNoiseError) as exc_info:
        engine.search(b"fake-bytes", top_k_images=1)

    assert exc_info.value.category == "bill"
    assert exc_info.value.image_path == "/tmp/noise.jpg"