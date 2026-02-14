
from datetime import datetime
import uuid

from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user", index=True)
    
    # Profile Information
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    username = Column(String, unique=True, nullable=True, index=True)
    
    # Contact Information
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    zip_code = Column(String, nullable=True)
    country = Column(String, nullable=True)
    
    # Profile Details
    bio = Column(Text, nullable=True)
    profile_image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Pet Care Professional
    is_veterinarian = Column(Boolean, default=False)
    is_pet_caregiver = Column(Boolean, default=False)
    professional_license = Column(String, nullable=True)
    experience_years = Column(Integer, nullable=True)
    specializations = Column(String, nullable=True)  # JSON or comma-separated
    
    # Social
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    posts_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    pets = relationship("Pet", back_populates="owner", cascade="all, delete-orphan")
    reports = relationship("Report", secondary="user_reports", back_populates="reporters")
    community_posts = relationship("CommunityPost", back_populates="author", cascade="all, delete-orphan")
    sicknesses = relationship("Sickness", back_populates="reported_by", cascade="all, delete-orphan")
    report_comments = relationship("ReportComment", back_populates="user")
    community_post_comments = relationship("CommunityPostComment", back_populates="user")
    report_reactions = relationship("ReportReaction", back_populates="user", cascade="all, delete-orphan")
    community_post_reactions = relationship("CommunityPostReaction", back_populates="user", cascade="all, delete-orphan")


class Pet(Base):
    __tablename__ = "pets"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    name = Column(String, nullable=False)
    species = Column(String, nullable=False)  # Dog, Cat, Bird, etc.
    breed = Column(String, nullable=True)
    age = Column(Integer, nullable=True)  # In months
    weight = Column(String, nullable=True)  # In kg
    color = Column(String, nullable=True)
    
    # Health Information
    microchip_id = Column(String, unique=True, nullable=True)
    last_vet_visit = Column(DateTime, nullable=True)
    vaccinated = Column(Boolean, default=False)
    neutered_spayed = Column(Boolean, default=False)
    blood_type = Column(String, nullable=True)
    
    # Additional Info
    bio = Column(Text, nullable=True)
    profile_image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="pets")
    medical_records = relationship("MedicalRecord", back_populates="pet", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="pet", cascade="all, delete-orphan")


class MedicalRecord(Base):
    __tablename__ = "medical_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pet_id = Column(String, ForeignKey("pets.id"), nullable=False)
    
    record_type = Column(String, nullable=False)  # vaccination, checkup, surgery, etc.
    description = Column(Text, nullable=True)
    veterinarian = Column(String, nullable=True)
    clinic_name = Column(String, nullable=True)
    medications = Column(Text, nullable=True)
    
    record_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    pet = relationship("Pet", back_populates="medical_records")


class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pet_id = Column(String, ForeignKey("pets.id"), nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    appointment_type = Column(String, nullable=False)  # vet, grooming, training, etc.
    status = Column(String, default="scheduled")  # scheduled, completed, cancelled
    
    appointment_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    
    provider_name = Column(String, nullable=True)
    provider_phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    
    notes = Column(Text, nullable=True)
    reminder_sent = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    pet = relationship("Pet", back_populates="appointments")
