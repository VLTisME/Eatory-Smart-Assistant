from pydantic import BaseModel, Field
from datetime import datetime

from typing import Optional, List

# Import PlaceSearchResponse from place_search feature
from app.features.place_search.schemas import PlaceSearchResponse

class PriceOption(BaseModel):
    label: str
    price: float

class ModifierOption(BaseModel):
    name: str
    extraPrice: float

class ModifierGroup(BaseModel):
    title: str
    isRequired: bool
    options: List[ModifierOption]

class MenuItem(BaseModel):
    id: str
    name: str
    translation: Optional[str] = None
    description: Optional[str] = None
    priceType: str
    basePrice: Optional[float] = None
    priceText: Optional[str] = None
    priceOptions: List[PriceOption] = []
    tags: List[str] = []
    modifierGroups: List[ModifierGroup] = []

class MenuCategory(BaseModel):
    id: str
    title: str
    translation: Optional[str] = None
    items: List[MenuItem] = []

class RestaurantInfo(BaseModel):
    id: str
    name: str
    phoneNumber: Optional[str] = None
    address: str

class MenuResponseSchema(BaseModel):
    restaurantInfo: RestaurantInfo
    categories: List[MenuCategory] = []

#Schemas for message
#The data frame that FE is required to send when adding a new message
class MessageCreate(BaseModel):
    role: str
    content: str
    image_url: Optional[str] = None
    menu_data: Optional[MenuResponseSchema] = None
    place_search_data: Optional[PlaceSearchResponse] = None

#The BE data frame is returned to the FE when the FE requests to view a message
class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    image_url: Optional[str] = None
    menu_data: Optional[MenuResponseSchema] = None
    place_search_data: Optional[PlaceSearchResponse] = None
    created_at: datetime

#Schemas for conversation
#FE sends the message when click the "Create new chat" button
class ConversationCreate(BaseModel):
    title: str

#The BE data frame is returned when FE wants to view a list of chat snippets
class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime


#BE returns this when FE clicks to view a specific chat message
class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []
