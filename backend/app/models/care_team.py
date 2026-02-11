from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, String

from app.db.session import Base


class CareTeamMember(Base):
    __tablename__ = "care_team_members"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    bio = Column(String, nullable=True)
    specialties = Column(String, nullable=True)
    availability = Column(String, nullable=True)
    location = Column(String, nullable=True)
    contact = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
