from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.session import Base


class ReportReaction(Base):
    __tablename__ = "report_reactions"
    __table_args__ = (UniqueConstraint("report_id", "user_id", name="uq_report_user_reaction"),)

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("reports.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="reactions")
    user = relationship("User", back_populates="report_reactions")
