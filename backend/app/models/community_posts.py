from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    category = Column(String, nullable=True)
    author_name = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    reaction_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

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
