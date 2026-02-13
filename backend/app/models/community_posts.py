from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Content
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    
    # Metadata
    category = Column(String, nullable=True)  # tips, stories, questions, announcements
    author_id = Column(String, ForeignKey('users.id'), nullable=True)
    author_name = Column(String, nullable=True)
    author_avatar = Column(String, nullable=True)
    
    # Engagement
    reaction_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    share_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    
    # Status & Visibility
    is_pinned = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    status = Column(String, default="published")  # draft, published, archived
    
    # Additional Fields
    tags = Column(String, nullable=True)  # comma-separated
    location = Column(String, nullable=True)
    image_url = Column(String, nullable=True)  # Featured/primary image
    featured = Column(Boolean, default=False)
    featured_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    author = relationship("User", back_populates="community_posts")
    images = relationship(
        "CommunityPostImage",
        back_populates="post",
        cascade="all, delete-orphan",
    )
    comments = relationship(
        "CommunityPostComment",
        back_populates="post",
        cascade="all, delete-orphan",
    )

