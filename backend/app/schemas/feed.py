from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.reports import ReportImageResponse


class FeedItem(BaseModel):
    item_type: str
    id: str
    title: str
    summary: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    images: List[ReportImageResponse] = []
    image_url: Optional[str] = None
    reaction_count: int = 0

    model_config = {"from_attributes": True}
