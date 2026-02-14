from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class CommunityPostComment(Base):
    __tablename__ = "community_post_comments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String, ForeignKey("community_posts.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    parent_id = Column(String, ForeignKey("community_post_comments.id"), nullable=True)
    author_name = Column(String, nullable=True)
    body = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("CommunityPost", back_populates="comments")
    user = relationship("User", back_populates="community_post_comments")
