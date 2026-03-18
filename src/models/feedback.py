from sqlalchemy import Column, String, Integer, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from src.database import Base


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)
    status = Column(String(50), default="pending")
    metadata = Column(JSON, default=dict)
    admin_response = Column(Text, nullable=True)
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())
    updated_at = Column(String, default=lambda: datetime.utcnow().isoformat(), onupdate=lambda: datetime.utcnow().isoformat())

    user = relationship("User", back_populates="feedbacks")
