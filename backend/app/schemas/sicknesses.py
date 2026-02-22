from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class SicknessCreate(BaseModel):
    name: str
    species: Optional[str] = None
    summary: Optional[str] = None
    symptoms: Optional[str] = None
    remedies: Optional[str] = None
    severity: Optional[str] = None


class SicknessUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    summary: Optional[str] = None
    symptoms: Optional[str] = None
    remedies: Optional[str] = None
    severity: Optional[str] = None


class SicknessImageResponse(BaseModel):
    id: str
    url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SicknessResponse(BaseModel):
    id: str
    name: str
    species: Optional[str] = None
    summary: Optional[str] = None
    symptoms: Optional[str] = None
    remedies: Optional[str] = None
    severity: Optional[str] = None
    is_verified: Optional[bool] = None
    created_at: datetime

    images: List[SicknessImageResponse] = []

    model_config = {"from_attributes": True}
