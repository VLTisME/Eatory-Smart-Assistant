from pydantic import BaseModel, Field

class ReviewSummaryResponse(BaseModel):

    place_id: str
    name: str = ""
    summary: str = ""
    positive_ratio: float = 0.0
    negative_ratio: float = 0.0

class ReviewSampleItem(BaseModel):
    id: int = 0
    text: str = ""
    rating: int = 0

class ReviewSamplesResponse(BaseModel):
    place_id: str
    reviews: list[ReviewSampleItem] = Field(default_factory=list)
