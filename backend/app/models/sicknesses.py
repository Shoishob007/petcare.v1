from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class Sickness(Base):
    __tablename__ = "sicknesses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    species = Column(String, nullable=True)
    summary = Column(String, nullable=True)
    symptoms = Column(String, nullable=True)
    remedies = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    images = relationship(
        "SicknessImage",
        back_populates="sickness",
        cascade="all, delete-orphan",
    )
