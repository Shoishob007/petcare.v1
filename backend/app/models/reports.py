from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, Integer, String, Text, Boolean, Table, ForeignKey, Float
from sqlalchemy.orm import relationship

from app.db.session import Base

# Association table for many-to-many relationship between User and Report
user_reports = Table(
    'user_reports',
    Base.metadata,
    Column('user_id', String, ForeignKey('users.id'), primary_key=True),
    Column('report_id', String, ForeignKey('reports.id'), primary_key=True),
)


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Basic Information
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Location Information
    location = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Classifications
    category = Column(String, nullable=True)  # Lost, Found, Sighting, Health, Care
    status = Column(String, nullable=True, default="open")  # open, monitoring, resolved
    species = Column(String, nullable=True)  # Dog, Cat, Bird, etc.
    breed = Column(String, nullable=True)
    urgency = Column(String, nullable=True)  # low, medium, high, critical
    
    # Reporter Information
    reporter_name = Column(String, nullable=True)
    reporter_email = Column(String, nullable=True)
    reporter_phone = Column(String, nullable=True)
    
    # Engagement
    reaction_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    
    # Additional Details
    pet_name = Column(String, nullable=True)
    pet_age = Column(String, nullable=True)
    pet_color = Column(String, nullable=True)
    pet_microchip = Column(String, nullable=True)
    
    is_verified = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    images = relationship(
        "ReportImage",
        back_populates="report",
        cascade="all, delete-orphan",
    )
    comments = relationship(
        "ReportComment",
        back_populates="report",
        cascade="all, delete-orphan",
    )
    reactions = relationship(
        "ReportReaction",
        back_populates="report",
        cascade="all, delete-orphan",
    )
    reporters = relationship("User", secondary=user_reports, back_populates="reports")

