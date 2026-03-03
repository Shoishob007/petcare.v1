from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, Text

from app.db.session import Base


class AISicknessCase(Base):
    __tablename__ = "ai_sickness_cases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Text, nullable=True)
    pet_species = Column(Text, nullable=True)
    pet_age_months = Column(Integer, nullable=True)
    symptoms = Column(Text, nullable=False)
    additional_context = Column(Text, nullable=True)
    suspected_condition = Column(Text, nullable=True)
    urgency_level = Column(Text, nullable=False, default="medium")
    requires_vet_visit = Column(Boolean, nullable=False, default=True)
    status = Column(Text, nullable=False, default="queued")
    source = Column(Text, nullable=False, default="manual")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
