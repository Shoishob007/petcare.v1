from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, Text

from app.db.session import Base


class HomePageContent(Base):
    __tablename__ = "home_page_content"

    id = Column(Integer, primary_key=True, default=1)
    content_json = Column(Text, nullable=False)
    updated_by_user_id = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
