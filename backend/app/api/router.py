"""Top-level router composition."""

from fastapi import APIRouter

from app.api.shared_routes import router as shared_router
from app.features.menu_translation.routes import router as menu_translation_router
from app.features.chat.routes import router as chat_router
from app.features.place_search.routes import router as place_search_router
from app.features.place_search.routes import places_router as places_router
from app.features.review_summary.routes import router as review_summary_router
from app.features.imagekit.routes import router as imagekit_router
from app.features.place_images.routes import router as place_image_router
from app.features.place_details.routes import router as place_detail_router


router = APIRouter()
router.include_router(shared_router)
router.include_router(menu_translation_router)
router.include_router(place_search_router)
router.include_router(chat_router)
router.include_router(places_router)
router.include_router(review_summary_router)
router.include_router(imagekit_router)
router.include_router(place_image_router)
router.include_router(place_detail_router)
