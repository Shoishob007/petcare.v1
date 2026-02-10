from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ReportCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None

class ReportResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
