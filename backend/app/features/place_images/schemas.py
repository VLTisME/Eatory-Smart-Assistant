from pydantic import BaseModel, Field

class PlaceImageItem(BaseModel):
    image_id: str = ""
    place_id: str = ""
    file_path: str = ""

class PlaceImagesResponse(BaseModel):
    place_id: str
    images: list[PlaceImageItem] = Field(default_factory=list)
    total: int = 0

class SingleImageResponse(BaseModel):
    image_id: str = ""
    place_id: str = ""
    file_path: str = ""