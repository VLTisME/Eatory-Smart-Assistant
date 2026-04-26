from firebase_admin import firestore
from datetime import datetime, timezone
import uuid

def get_db():
    return firestore.client()

USERS_COL = "users"
CONVERSATIONS_COL = "conversations"
MESSAGES_COL = "messages"

def create_conversation(uid: str, title: str) -> dict:
    db = get_db()
    conv_ref = db.collection(USERS_COL).document(uid).collection(CONVERSATIONS_COL)

    conv_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    new_conv_data = {
        "id": conv_id,
        "title": title,
        "created_at": now,
        "updated_at": now
    }
    conv_ref.document(conv_id).set(new_conv_data)
    return new_conv_data

def get_conversations(uid: str) -> list[dict]:
    db = get_db()
    conv_ref = db.collection(USERS_COL).document(uid).collection(CONVERSATIONS_COL)

    docs = conv_ref.order_by("updated_at", direction = firestore.Query.DESCENDING).stream()

    conversations = []
    for doc in docs:
        conversations.append(doc.to_dict())
    return conversations


def add_message(uid: str, conv_id: str, role: str, content: str, image_url: str = None) -> dict:
    db = get_db()
    conv_ref = db.collection(USERS_COL).document(uid).collection(CONVERSATIONS_COL).document(conv_id)
    messages_ref = conv_ref.collection(MESSAGES_COL)
    
    msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    new_msg_data = {
        "id": msg_id,
        "role": role,
        "content": content,
        "image_url": image_url,
        "created_at": now
    }

    messages_ref.document(msg_id).set(new_msg_data)
    conv_ref.update({"updated_at": now})
    return new_msg_data


def get_conversation_detail(uid: str, conv_id: str) -> dict | None:
    db = get_db()
    conv_ref = db.collection(USERS_COL).document(uid).collection(CONVERSATIONS_COL).document(conv_id)

    conv_doc = conv_ref.get()
    if not conv_doc.exists:
        return None
    
    conv_data = conv_doc.to_dict()

    messages_ref = conv_ref.collection(MESSAGES_COL).order_by("created_at")
    
    messages = []
    for msg in messages_ref.stream():
        messages.append(msg.to_dict())
        
    conv_data["messages"] = messages
    
    return conv_data


def delete_conversation(uid: str, conv_id: str) -> bool:
    db = get_db()
    #delete a chat
    conv_ref = db.collection(USERS_COL).document(uid).collection(CONVERSATIONS_COL).document(conv_id)

    messages_ref = conv_ref.collection(MESSAGES_COL)
    for msg in messages_ref.stream():
        msg.reference.delete()

    #delete a document
    conv_ref.delete()
    return True



