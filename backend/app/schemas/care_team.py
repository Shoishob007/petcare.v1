from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CareTeamMemberCreate(BaseModel):
    name: str
    role: str
    bio: Optional[str] = None
    specialties: Optional[str] = None
    availability: Optional[str] = None
    location: Optional[str] = None
    contact: Optional[str] = None
    photo_url: Optional[str] = None


class CareTeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    bio: Optional[str] = None
    specialties: Optional[str] = None
    availability: Optional[str] = None
    location: Optional[str] = None
    contact: Optional[str] = None
    photo_url: Optional[str] = None


class CareTeamMemberResponse(BaseModel):
    id: str
    name: str
    role: str
    bio: Optional[str] = None
    specialties: Optional[str] = None
    availability: Optional[str] = None
    location: Optional[str] = None
    contact: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
