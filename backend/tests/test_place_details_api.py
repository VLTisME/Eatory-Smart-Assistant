"""Tests for place details API."""

from __future__ import annotations

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

FAKE_PLACE_DETAIL = {
    "place_id": "test_place_123",
    "name": "Bún Bò Huế Test",
    "type": "restaurant",
    "address": "123 Test Street",
    "lat": 10.7721,
    "lng": 106.6981,
    "avg_rating": 4.5,
    "total_reviews": 128
}


@patch("app.features.place_details.routes.get_place_detail")
def test_get_place_details_success(mock_get_place_detail):
    mock_get_place_detail.return_value = FAKE_PLACE_DETAIL

    response = client.get("/api/v1/place-details", params={"place_id": "test_place_123"})

    assert response.status_code == 200
    payload = response.json()
    
    assert "data" in payload
    data = payload["data"]
    
    assert data["place_id"] == "test_place_123"
    assert data["name"] == "Bún Bò Huế Test"
    assert data["type"] == "restaurant"
    assert data["address"] == "123 Test Street"
    
    assert "location" in data
    assert data["location"]["lat"] == pytest.approx(10.7721)
    assert data["location"]["lng"] == pytest.approx(106.6981)
    
    assert data["avg_rating"] == pytest.approx(4.5)
    assert data["total_review"] == 128


@patch("app.features.place_details.routes.get_place_detail")
def test_get_place_details_not_found(mock_get_place_detail):
    mock_get_place_detail.return_value = None

    response = client.get("/api/v1/place-details", params={"place_id": "non_existent_place"})

    assert response.status_code == 404
    payload = response.json()
    assert "detail" in payload
    assert "No location with place_id found" in payload["detail"]


def test_get_place_details_missing_place_id():
    response = client.get("/api/v1/place-details")

    assert response.status_code == 422
