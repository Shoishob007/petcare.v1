from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ChatUserSummary(BaseModel):
    id: str
    email: str
    display_name: str
    profile_image_url: str | None = None
    role: str | None = None


class ChatMemberSummary(BaseModel):
    user: ChatUserSummary
    role: str
    joined_at: datetime
    last_read_at: datetime | None = None


class ChatMessageCreate(BaseModel):
    message_type: str = Field(default="text")
    content: str | None = None
    file_url: str | None = None
    file_name: str | None = None
    location_lat: float | None = None
    location_lng: float | None = None
    location_label: str | None = None


class ChatMessageResponse(BaseModel):
    id: str
    chat_id: str
    sender_id: str
    sender_name: str
    sender_avatar: str | None = None
    message_type: str
    content: str | None = None
    file_url: str | None = None
    file_name: str | None = None
    location_lat: float | None = None
    location_lng: float | None = None
    location_label: str | None = None
    created_at: datetime


class ChatSummaryResponse(BaseModel):
    id: str
    name: str
    is_group: bool
    created_at: datetime
    updated_at: datetime
    unread_count: int = 0
    last_read_at: datetime | None = None
    members: List[ChatMemberSummary] = []
    last_message: ChatMessageResponse | None = None


class ChatDirectCreateRequest(BaseModel):
    user_id: str


class ChatGroupCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    member_ids: List[str] = []


class ChatReadRequest(BaseModel):
    message_id: Optional[str] = None


class ChatUnreadCountResponse(BaseModel):
    total_unread: int


class ChatUploadResponse(BaseModel):
    file_url: str
    file_name: str


class ChatMemberAddRequest(BaseModel):
    user_id: str


class ChatMemberRequestCreate(BaseModel):
    user_id: str


class ChatMemberRequestReview(BaseModel):
    decision: str = Field(pattern="^(approve|reject)$")


class ChatMemberRequestResponse(BaseModel):
    id: str
    room_id: str
    requester: ChatUserSummary
    target_user: ChatUserSummary
    status: str
    requested_at: datetime
    reviewed_at: datetime | None = None
    reviewed_by: ChatUserSummary | None = None
