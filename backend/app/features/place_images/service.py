import logging
import random   
from app.core.supabase import get_supabase_client

logger = logging.getLogger(__name__)
def get_single_image(place_id: str) -> dict | None:
    supabase = get_supabase_client()
    resp = (
        supabase.table("image_embeddings")
        .select("image_id, place_id, file_path")
        .eq("place_id", place_id)
        .limit(1)
        .execute()
    )
    if resp.data:           
        return resp.data[0]
    return None

def get_batch_images(place_id: str, limit: int = 10, offset: int = 0) -> list[dict]:
    supabase = get_supabase_client()
    resp = (
        supabase.table("image_embeddings")
        .select("image_id, place_id, file_path")
        .eq("place_id", place_id)
        .order("image_id")
        .range(offset, offset + limit - 1)
        .execute()
    )
    return resp.data or []

def get_random_image(place_id: str) -> dict | None:
    supabase = get_supabase_client()
    resp = (
        supabase.table("image_embeddings")
        .select("image_id, place_id, file_path")
        .eq("place_id", place_id)
        .execute()
    )
    if not resp.data:       
        return None
    return random.choice(resp.data)