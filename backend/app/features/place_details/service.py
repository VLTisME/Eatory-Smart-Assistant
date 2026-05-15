
import logging
from app.core.supabase import get_supabase_client

logger = logging.getLogger(__name__)


def get_place_detail(place_id: str) -> dict | None:
    
    supabase = get_supabase_client()

    response = (
        supabase
        .table("places")                                       
        .select(                                               
            "place_id, name, type, address, lat, lng, "
            "avg_rating, total_reviews"
        )
        .eq("place_id", place_id)                              
        .limit(1)                                             
        .execute()
    )

    if response.data:
        return response.data[0]     
    return None                    
