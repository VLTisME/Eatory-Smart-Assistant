"""Schemas for image search and Goong place lookup."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class PlaceSearchItem(BaseModel):
    """Single place candidate derived from image similarity."""

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    place_id: str = Field(..., alias="place_id")
    score: float = Field(..., ge=0.0, le=1.0)
    top_image: str = Field(..., alias="top_image")
    name: str = Field(default="")
    address: str = Field(default="")


class PlaceSearchResponse(BaseModel):
    """Final response consumed by frontend place search rendering."""

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    results: list[PlaceSearchItem] = Field(default_factory=list)


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
