from datetime import datetime
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db.session import Base


class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=True)
    is_group = Column(Boolean, nullable=False, default=False, index=True)
    created_by_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    members = relationship(
        "ChatMember",
        back_populates="room",
        cascade="all, delete-orphan",
    )
    messages = relationship(
        "ChatMessage",
        back_populates="room",
        cascade="all, delete-orphan",
    )
    member_requests = relationship(
        "ChatMemberRequest",
        back_populates="room",
        cascade="all, delete-orphan",
    )
    created_by = relationship("User", foreign_keys=[created_by_id])


class ChatMember(Base):
    __tablename__ = "chat_members"
    __table_args__ = (
        UniqueConstraint("room_id", "user_id", name="uq_chat_member_room_user"),
    )

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = Column(String, ForeignKey("chat_rooms.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String, nullable=False, default="member")
    joined_at = Column(DateTime, default=datetime.utcnow, index=True)
    last_read_at = Column(DateTime, nullable=True)

    room = relationship("ChatRoom", back_populates="members")
    user = relationship("User", back_populates="chat_memberships", foreign_keys=[user_id])


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = Column(String, ForeignKey("chat_rooms.id"), nullable=False, index=True)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    message_type = Column(String, nullable=False, default="text", index=True)
    content = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    location_label = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User", back_populates="chat_messages", foreign_keys=[sender_id])


class ChatMemberRequest(Base):
    __tablename__ = "chat_member_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = Column(String, ForeignKey("chat_rooms.id"), nullable=False, index=True)
    requester_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    target_user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String, nullable=False, default="pending", index=True)
    requested_at = Column(DateTime, default=datetime.utcnow, index=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)

    room = relationship("ChatRoom", back_populates="member_requests")
    requester = relationship("User", foreign_keys=[requester_id], back_populates="chat_member_requests")
    target_user = relationship("User", foreign_keys=[target_user_id], back_populates="chat_member_targets")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id], back_populates="chat_member_reviews")
