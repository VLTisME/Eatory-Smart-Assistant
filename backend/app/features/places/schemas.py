"""Schemas for Goong place lookup proxy routes."""

from __future__ import annotations

from pydantic import BaseModel, Field


class StructuredFormatting(BaseModel):
    main_text: str = ""
    secondary_text: str = ""


class PlusCode(BaseModel):
    compound_code: str | None = None
    global_code: str | None = None


class PlacePrediction(BaseModel):
    description: str = ""
    place_id: str = ""
    structured_formatting: StructuredFormatting | None = None
    has_children: bool = False
    score: float | None = None
    plus_code: PlusCode | None = None


class PlaceAutoCompleteResponse(BaseModel):
    predictions: list[PlacePrediction] = Field(default_factory=list)
    status: str = "OK"


class PlaceGeometryLocation(BaseModel):
    lat: float
    lng: float


class PlaceGeometry(BaseModel):
    location: PlaceGeometryLocation


class PlaceDetailResult(BaseModel):
    place_id: str = ""
    formatted_address: str = ""
    name: str = ""
    geometry: PlaceGeometry | None = None


class PlaceDetailResponse(BaseModel):
    result: PlaceDetailResult | None = None
    status: str = "OK"
