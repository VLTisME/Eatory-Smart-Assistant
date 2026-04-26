from pydantic import BaseModel, Field
from datetime import datetime

from typing import Optional, List

#Schemas for message
#The data frame that FE is required to send when adding a new message
class MessageCreate(BaseModel):
    role: str
    content: str
    image_url: Optional[str] = None

#The BE data frame is returned to the FE when the FE requests to view a message
class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    image_url: Optional[str] = None
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
