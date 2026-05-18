
from pydantic import BaseModel, Field

class LocationSchema(BaseModel):

    lat: float = Field(..., description="latitude")
    lng: float = Field(..., description="longitude")


class PlaceDetailItem(BaseModel):

    place_id: str   = Field(...,            description="Location ID")
    name: str       = Field(default="",     description="Name of location")
    type: str       = Field(default="",     description="Type (restaurant, hotel, …)")
    address: str    = Field(default="",     description="Full address")
    location: LocationSchema                = Field(..., description="Location {lat, lng}")
    avg_rating: float = Field(default=0.0,  description="Avergae rating")
    total_review: int = Field(default=0,    description="Total reviews")



class PlaceDetailResponse(BaseModel):

    data: PlaceDetailItem = Field(..., description="Place details")


class PlacesByCityResponse(BaseModel):
    """Response for /by-city endpoint."""
    data: list[PlaceDetailItem] = Field(default_factory=list, description="List of places")
    total: int = Field(default=0, description="Total number of results")


class PlaceExistsResponse(BaseModel):
    """Response for /check-place endpoint."""
    exists: bool = Field(..., description="Whether the place exists in database")
    data: PlaceDetailItem | None = Field(default=None, description="Place details if found")
