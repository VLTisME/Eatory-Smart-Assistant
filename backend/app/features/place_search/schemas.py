"""Pydantic schemas for place search requests and responses."""

from pydantic import BaseModel, Field
from typing import Optional, List


# ── Request schemas ──────────────────────────────────────────────────────────

class PlaceSearchQuery(BaseModel):
    """Query parameters for place autocomplete search."""
    input: str = Field(..., min_length=1, max_length=200, description="Search keyword")
    location: Optional[str] = Field(None, description="Lat,lng bias (e.g. '21.013,105.798')")
    limit: int = Field(default=10, ge=1, le=20, description="Max results (1-20)")
    radius: Optional[int] = Field(None, ge=50, le=50000, description="Search radius in metres")
    more_compound: Optional[bool] = Field(None, description="Return more address compounds")


# ── Response sub-schemas (mirror Goong API) ──────────────────────────────────

class PlusCode(BaseModel):
    compound_code: Optional[str] = None
    global_code: Optional[str] = None


class StructuredFormatting(BaseModel):
    main_text: str = ""
    secondary_text: str = ""


class PlacePrediction(BaseModel):
    description: str = ""
    place_id: str = ""
    structured_formatting: Optional[StructuredFormatting] = None
    has_children: bool = False
    score: Optional[float] = None
    plus_code: Optional[PlusCode] = None


class PlaceAutoCompleteResponse(BaseModel):
    """Wrapper returned to the frontend."""
    predictions: List[PlacePrediction] = []
    status: str = "OK"


# ── Place detail schemas ─────────────────────────────────────────────────────

class PlaceGeometryLocation(BaseModel):
    lat: float
    lng: float


class PlaceGeometry(BaseModel):
    location: PlaceGeometryLocation


class PlaceDetailResult(BaseModel):
    place_id: str = ""
    formatted_address: str = ""
    name: str = ""
    geometry: Optional[PlaceGeometry] = None


class PlaceDetailResponse(BaseModel):
    result: Optional[PlaceDetailResult] = None
    status: str = "OK"
