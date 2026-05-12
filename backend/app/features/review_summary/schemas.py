from pydantic import BaseModel, Field

class ReviewSummaryResponse(BaseModel):

    place_id: str
    name: str = ""
    summary: str = ""
    positive_ratio: float = 0.0
    negative_ratio: float = 0.0
