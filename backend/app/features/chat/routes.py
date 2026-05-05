from fastapi import APIRouter, Depends, HTTPException, status

from app.features.chat.schemas import(
    ConversationCreate,
    ConversationResponse,
    ConversationDetailResponse,
    MessageCreate,
    MessageResponse
)
from app.features.chat import service

from app.core.auth import get_current_user
router = APIRouter(prefix="/api/v1/chat/conversations", tags=["Chat"])

#Create Conversation API
@router.post("/", response_model = ConversationResponse)
async def create_conversation(
    request: ConversationCreate,
    user: dict = Depends(get_current_user)
):
    uid = user["uid"]

    new_conv = service.create_conversation(uid = uid, title = request.title)
    return new_conv

#Get Conversation List API
@router.get("/", response_model=list[ConversationResponse])
async def get_conversations(
    user: dict = Depends(get_current_user)
):
    uid = user["uid"]
    conversations = service.get_conversations(uid=uid)
    return conversations

#Get Conversation Detail API
@router.get("/{id}/", response_model=ConversationDetailResponse)
async def get_conversation_detail(
    id: str, 
    user: dict = Depends(get_current_user)
):
    uid = user["uid"]
    conv_detail = service.get_conversation_detail(uid=uid, conv_id=id)
    
   
    if not conv_detail:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    return conv_detail

#Add message API
@router.post("/{id}/messages/", response_model=MessageResponse)
async def add_message(
    id: str,
    request: MessageCreate, 
    user: dict = Depends(get_current_user)
):
    uid = user["uid"]
    new_msg = service.add_message(
        uid=uid, 
        conv_id=id, 
        role=request.role, 
        content=request.content,
        image_url=request.image_url,
        menu_data=request.menu_data.model_dump() if request.menu_data else None,
        place_search_data=request.place_search_data.model_dump() if request.place_search_data else None
    )
    return new_msg

#Delete conversation API
@router.delete("/{id}/")
async def delete_conversation(
    id: str,
    user: dict = Depends(get_current_user)
):
    uid = user["uid"]
    success = service.delete_conversation(uid=uid, conv_id=id)
    return {"success": success}

