from sqlalchemy import Column, String, Integer, Text, ForeignKey, JSON, CHAR
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from src.database import Base


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(CHAR(36), ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)
    status = Column(String(50), default="pending")
    metadata_json = Column('metadata', JSON, default=dict)
    admin_response = Column(Text, nullable=True)
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())
    updated_at = Column(String, default=lambda: datetime.utcnow().isoformat(), onupdate=lambda: datetime.utcnow().isoformat())

    user = relationship("User", back_populates="feedbacks")
