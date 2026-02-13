from datetime import datetime
from typing import List, Optional, Literal

from pydantic import BaseModel


class UpdateImageResponse(BaseModel):
    id: str
    url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateResponse(BaseModel):
    id: str
    item_type: Literal["report", "community"]
    title: str
    content: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    species: Optional[str] = None
    urgency: Optional[str] = None
    reporter_name: Optional[str] = None
    author_name: Optional[str] = None
    tags: Optional[str] = None
    image_url: Optional[str] = None
    reaction_count: int = 0
    created_at: datetime
    images: List[UpdateImageResponse] = []

    model_config = {"from_attributes": True}


class UpdateCreate(BaseModel):
    item_type: Literal["report", "community"]
    title: str
    content: Optional[str] = None
    description: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    species: Optional[str] = None
    urgency: Optional[str] = None
    reporter_name: Optional[str] = None
    author_name: Optional[str] = None
    tags: Optional[str] = None
    image_url: Optional[str] = None


class UpdateUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    description: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    species: Optional[str] = None
    urgency: Optional[str] = None
    reporter_name: Optional[str] = None
    author_name: Optional[str] = None
    tags: Optional[str] = None
    image_url: Optional[str] = None


class UpdateCommentCreate(BaseModel):
    body: str
    author_name: Optional[str] = None
    parent_id: Optional[str] = None


class UpdateCommentResponse(BaseModel):
    id: str
    item_id: str
    body: str
    author_name: Optional[str] = None
    parent_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
