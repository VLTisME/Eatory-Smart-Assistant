"""Tests for place images API."""

from __future__ import annotations

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

FAKE_SINGLE_IMAGE = {
    "image_id": "img_001",
    "place_id": "test_place_123",
    "file_path": "https://example.com/img_001.jpg"
}

FAKE_BATCH_IMAGES = [
    {
        "image_id": "img_001",
        "place_id": "test_place_123",
        "file_path": "https://example.com/img_001.jpg"
    },
    {
        "image_id": "img_002",
        "place_id": "test_place_123",
        "file_path": "https://example.com/img_002.jpg"
    }
]


@patch("app.features.place_images.routes.get_single_image")
def test_get_single_image_success(mock_get_single):
    mock_get_single.return_value = FAKE_SINGLE_IMAGE

    response = client.get("/api/v1/place-images/single", params={"place_id": "test_place_123"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["image_id"] == "img_001"
    assert payload["place_id"] == "test_place_123"
    assert payload["file_path"] == "https://example.com/img_001.jpg"


@patch("app.features.place_images.routes.get_single_image")
def test_get_single_image_not_found(mock_get_single):
    mock_get_single.return_value = None

    response = client.get("/api/v1/place-images/single", params={"place_id": "non_existent"})

    assert response.status_code == 404
    payload = response.json()
    assert "No photos found" in payload["detail"]


@patch("app.features.place_images.routes.get_batch_images")
def test_get_batch_images_success(mock_get_batch):
    mock_get_batch.return_value = FAKE_BATCH_IMAGES

    response = client.get("/api/v1/place-images", params={"place_id": "test_place_123", "limit": 2, "offset": 0})

    assert response.status_code == 200
    payload = response.json()
    assert payload["place_id"] == "test_place_123"
    assert payload["total"] == 2
    assert len(payload["images"]) == 2
    
    assert payload["images"][0]["image_id"] == "img_001"
    assert payload["images"][1]["image_id"] == "img_002"


@patch("app.features.place_images.routes.get_batch_images")
def test_get_batch_images_empty(mock_get_batch):
    mock_get_batch.return_value = []

    response = client.get("/api/v1/place-images", params={"place_id": "non_existent"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["place_id"] == "non_existent"
    assert payload["total"] == 0
    assert payload["images"] == []


@patch("app.features.place_images.routes.get_random_image")
def test_get_random_image_success(mock_get_random):
    mock_get_random.return_value = FAKE_SINGLE_IMAGE

    response = client.get("/api/v1/place-images/random", params={"place_id": "test_place_123"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["image_id"] == "img_001"


@patch("app.features.place_images.routes.get_random_image")
def test_get_random_image_not_found(mock_get_random):
    mock_get_random.return_value = None

    response = client.get("/api/v1/place-images/random", params={"place_id": "non_existent"})

    assert response.status_code == 404
