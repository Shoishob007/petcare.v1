from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class SicknessImage(Base):
    __tablename__ = "sickness_images"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sickness_id = Column(String, ForeignKey("sicknesses.id"), nullable=False, index=True)
    file_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sickness = relationship("Sickness", back_populates="images")

    @property
    def url(self) -> str:
        return f"/uploads/{self.file_name}"
