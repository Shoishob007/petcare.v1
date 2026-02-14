from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.session import Base


class CommunityPostReaction(Base):
    __tablename__ = "community_post_reactions"
    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_community_post_user_reaction"),
    )

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String, ForeignKey("community_posts.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("CommunityPost", back_populates="reactions")
    user = relationship("User", back_populates="community_post_reactions")
