from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ReportImageResponse(BaseModel):
    id: str
    url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReportCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = "open"
    species: Optional[str] = None
    urgency: Optional[str] = None
    reporter_name: Optional[str] = None


class ReportUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    species: Optional[str] = None
    urgency: Optional[str] = None
    reporter_name: Optional[str] = None


class ReportResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    species: Optional[str] = None
    urgency: Optional[str] = None
    reporter_name: Optional[str] = None
    reaction_count: int = 0
    created_at: datetime
    images: List[ReportImageResponse] = []

    model_config = {"from_attributes": True}
