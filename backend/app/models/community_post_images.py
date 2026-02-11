from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class CommunityPostImage(Base):
    __tablename__ = "community_post_images"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String, ForeignKey("community_posts.id"), nullable=False, index=True)
    file_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("CommunityPost", back_populates="images")

    @property
    def url(self) -> str:
        return f"/uploads/{self.file_name}"
