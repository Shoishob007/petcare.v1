from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, String, Text, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Sickness(Base):
    __tablename__ = "sicknesses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Basic Information
    name = Column(String, nullable=False, index=True)
    species = Column(String, nullable=True)  # Dog, Cat, Bird, etc.
    
    # Description & Details
    summary = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    symptoms = Column(Text, nullable=True)  # Detailed symptoms
    remedies = Column(Text, nullable=True)  # Treatment options
    prevention = Column(Text, nullable=True)  # Prevention methods
    
    # Medical Classification
    severity = Column(String, nullable=True)  # mild, moderate, severe, critical
    category = Column(String, nullable=True)  # infectious, genetic, dietary, etc.
    contagious = Column(Boolean, default=False)
    
    # Medical Information
    causes = Column(Text, nullable=True)
    incubation_period = Column(String, nullable=True)
    transmission_methods = Column(Text, nullable=True)
    affected_age_group = Column(String, nullable=True)
    
    # Treatment & Care
    typical_treatment_duration = Column(String, nullable=True)
    requires_veterinary_care = Column(Boolean, default=True)
    prognosis = Column(Text, nullable=True)
    
    # Engagement
    view_count = Column(Integer, default=0)
    helpful_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    
    # User Reporting
    reported_by_id = Column(String, ForeignKey('users.id'), nullable=True)
    is_verified = Column(Boolean, default=False)
    verified_by = Column(String, nullable=True)  # Veterinarian name
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reported_by = relationship("User", back_populates="sicknesses")
    images = relationship(
        "SicknessImage",
        back_populates="sickness",
        cascade="all, delete-orphan",
    )

