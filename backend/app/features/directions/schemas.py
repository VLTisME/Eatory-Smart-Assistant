"""Pydantic schemas for the Goong Directions proxy."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class DirectionRequest(BaseModel):
    """Incoming request for directions."""

    origin: str = Field(..., description="Origin coordinates as 'lat,lng'")
    destination: str = Field(..., description="Destination coordinates as 'lat,lng'")
    vehicle: str = Field(
        default="car",
        description="Transport mode: car, bike (motorcycle), or foot (walking)",
    )


class DistanceInfo(BaseModel):
    text: str = ""
    value: int = 0


class DurationInfo(BaseModel):
    text: str = ""
    value: int = 0


class StepInfo(BaseModel):
    distance: DistanceInfo = Field(default_factory=DistanceInfo)
    duration: DurationInfo = Field(default_factory=DurationInfo)
    html_instructions: str = ""
    travel_mode: str = ""


class LocationInfo(BaseModel):
    lat: float = 0.0
    lng: float = 0.0


class LegInfo(BaseModel):
    distance: DistanceInfo = Field(default_factory=DistanceInfo)
    duration: DurationInfo = Field(default_factory=DurationInfo)
    start_address: str = ""
    end_address: str = ""
    start_location: LocationInfo = Field(default_factory=LocationInfo)
    end_location: LocationInfo = Field(default_factory=LocationInfo)
    steps: list[StepInfo] = Field(default_factory=list)


class OverviewPolyline(BaseModel):
    points: str = ""


class RouteInfo(BaseModel):
    legs: list[LegInfo] = Field(default_factory=list)
    overview_polyline: OverviewPolyline = Field(default_factory=OverviewPolyline)
    warnings: list[str] = Field(default_factory=list)
    waypoint_order: list[Any] = Field(default_factory=list)


class DirectionResponse(BaseModel):
    """Response from the Goong Directions API (proxied)."""

    routes: list[RouteInfo] = Field(default_factory=list)
    geocoded_waypoints: list[Any] = Field(default_factory=list)
