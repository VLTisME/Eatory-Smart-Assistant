from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import logging

logger =  logging.getLogger(__name__)
security = HTTPBearer()

def get_current_user(credentials:
    HTTPAuthorizationCredentials = Depends(security)) -> dict:
       token = credentials.credentials
       try:
        decoded_token = auth.verify_id_token(token)
        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "token": token
        }

       except Exception as e:
        logger.error(f"Firebase token authentication error: {e}")
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid or expired token",
            headers = {"WWW-Authenticate": "Bearer"},
        ) 
