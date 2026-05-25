
import logging
import random
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


def get_places_by_city(city: str, limit: int = 4) -> list[dict]:
    """
    Get random places whose address contains the given city name.
    Uses ilike for case-insensitive partial matching on the address field.
    Returns up to `limit` randomly selected places.
    """
    supabase = get_supabase_client()

    response = (
        supabase
        .table("places")
        .select("place_id, name, type, address, lat, lng, avg_rating, total_reviews")
        .ilike("address", f"%{city}%")
        .limit(50)  # Fetch more so we can randomly sample
        .execute()
    )

    places = response.data or []
    if not places:
        return []

    # Randomly select `limit` places from the results
    if len(places) <= limit:
        return places
    return random.sample(places, limit)


def check_place_exists(place_name: str) -> dict | None:
    """
    Check if a place with the given name exists in the database.
    Uses ilike for case-insensitive partial matching.
    Returns the first matching place or None.
    """
    supabase = get_supabase_client()

    response = (
        supabase
        .table("places")
        .select("place_id, name, type, address, lat, lng, avg_rating, total_reviews")
        .ilike("name", f"%{place_name}%")
        .limit(1)
        .execute()
    )

    if response.data:
        return response.data[0]
    return None
