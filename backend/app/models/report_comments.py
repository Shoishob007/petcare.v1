from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class ReportComment(Base):
    __tablename__ = "report_comments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("reports.id"), nullable=False, index=True)
    parent_id = Column(String, ForeignKey("report_comments.id"), nullable=True)
    author_name = Column(String, nullable=True)
    body = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="comments")
