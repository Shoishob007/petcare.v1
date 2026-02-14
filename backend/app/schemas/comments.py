from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ReportCommentCreate(BaseModel):
    body: str
    author_name: Optional[str] = None
    parent_id: Optional[str] = None


class ReportCommentResponse(BaseModel):
    id: str
    report_id: str
    user_id: Optional[str] = None
    body: str
    author_name: Optional[str] = None
    parent_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CommunityPostCommentCreate(BaseModel):
    body: str
    author_name: Optional[str] = None
    parent_id: Optional[str] = None


class CommunityPostCommentResponse(BaseModel):
    id: str
    post_id: str
    user_id: Optional[str] = None
    body: str
    author_name: Optional[str] = None
    parent_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
