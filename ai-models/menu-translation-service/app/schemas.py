"""Schemas for menu OCR and structured menu extraction."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class OCRExtractResponse(BaseModel):
    """Raw OCR extraction response for menu translation."""

    filename: str = Field(..., description="Original filename from the client")
    content_type: str = Field(..., description="MIME type of the uploaded image")
    size_bytes: int = Field(..., description="Image size in bytes")
    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")
    raw_text: str = Field(..., description="Text extracted from the image before refinement")
    provider: str = Field(..., description="OCR provider used for extraction")
    processing_time_ms: float = Field(..., description="OCR processing time in milliseconds")


class PriceType(str, Enum):
    FIXED = "fixed"
    VARIABLE = "variable"
    MARKET_PRICE = "market_price"


class PriceOption(BaseModel):
    label: str
    price: int


class ModifierOption(BaseModel):
    name: str
    extra_price: int = Field(default=0, ge=0, alias="extraPrice")

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class ModifierGroup(BaseModel):
    title: str = Field(..., description="For example: side dishes or toppings")
    is_required: bool = Field(default=False, alias="isRequired")
    options: list[ModifierOption] = Field(default_factory=list)

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class MenuItem(BaseModel):
    id: str
    name: str
    translation: str | None = Field(default=None, description="Dish name translated to the target language")
    description: str | None = None
    price_type: PriceType = Field(alias="priceType")
    base_price: int | None = Field(default=None, alias="basePrice")
    price_text: str | None = Field(default=None, alias="priceText")
    price_options: list[PriceOption] | None = Field(default=None, alias="priceOptions")
    tags: list[str] = Field(default_factory=list)
    modifier_groups: list[ModifierGroup] = Field(default_factory=list, alias="modifierGroups")

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class MenuCategory(BaseModel):
    id: str
    title: str
    translation: str | None = Field(default=None, description="Category title translated to the target language")
    items: list[MenuItem] = Field(default_factory=list)


class RestaurantInfo(BaseModel):
    id: str
    name: str
    phone_number: str | None = Field(default=None, alias="phoneNumber")
    address: str = ""

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class MenuResponse(BaseModel):
    """Structured menu response consumed by the frontend."""

    restaurant_info: RestaurantInfo = Field(alias="restaurantInfo")
    categories: list[MenuCategory] = Field(default_factory=list)

    model_config = {"populate_by_name": True, "serialize_by_alias": True}
