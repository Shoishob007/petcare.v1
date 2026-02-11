from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class CommunityPostCreate(BaseModel):
    title: str
    body: str
    category: Optional[str] = None
    author_name: Optional[str] = None
    image_url: Optional[str] = None


class CommunityPostUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None
    author_name: Optional[str] = None
    image_url: Optional[str] = None


class CommunityPostImageResponse(BaseModel):
    id: str
    url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CommunityPostResponse(BaseModel):
    id: str
    title: str
    body: str
    category: Optional[str] = None
    author_name: Optional[str] = None
    image_url: Optional[str] = None
    reaction_count: int = 0
    created_at: datetime

    images: List[CommunityPostImageResponse] = []

    model_config = {"from_attributes": True}
