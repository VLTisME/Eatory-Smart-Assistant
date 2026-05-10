"""Routes for ImageKit authentication — issues upload signatures."""

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.features.imagekit import service

router = APIRouter(prefix="/api/v1/imagekit", tags=["ImageKit"])


@router.get("/auth")
async def imagekit_auth(user: dict = Depends(get_current_user)):
    """Return authentication parameters for a client-side ImageKit upload."""
    try:
        return service.get_auth_parameters()
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
