"""Schemas for image-based place search."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class PlaceSearchImageItem(BaseModel):
    """Single image candidate associated with a place search result."""

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    image_id: str = Field(default="", alias="image_id")
    score: float = Field(..., ge=0.0)
    file_path: str = Field(default="", alias="file_path")


class PlaceSearchItem(BaseModel):
    """Single place candidate derived from image similarity."""

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    place_id: str = Field(..., alias="place_id")
    image_id: str = Field(default="", alias="image_id")
    score: float = Field(..., ge=0.0)
    top_image: str = Field(..., alias="top_image")
    images: list[PlaceSearchImageItem] = Field(default_factory=list)
    name: str = Field(default="")
    address: str = Field(default="")


class PlaceSearchResponse(BaseModel):
    """Final response consumed by frontend place search rendering."""

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    results: list[PlaceSearchItem] = Field(default_factory=list)
