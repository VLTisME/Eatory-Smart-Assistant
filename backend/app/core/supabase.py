import logging 
from functools import lru_cache
from supabase import create_client, Client
from app.core.config import settings


logger = logging.getLogger(__name__)
@lru_cache(maxsize=1)
def get_supabase_client() -> Client:

    if not settings.supabase_url:
        raise ValueError("SUPABASE_URL has not been configured in the .env file.")

    if not settings.supabase_service_key:
        raise ValueError("SUPABASE_SERVICE_KEY has not been configured in the .env file.")  
    
    client = create_client(settings.supabase_url, settings.supabase_service_key)
    logger.info("Supabase client has been successfully initialized.")
    return client