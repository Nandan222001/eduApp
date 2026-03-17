from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, JSON, Numeric
from sqlalchemy.orm import relationship
from src.database import Base


class HomeworkScan(Base):
    __tablename__ = "homework_scans"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True, index=True)
    scan_title = Column(String(255), nullable=True)
    image_url = Column(String(500), nullable=False)
    s3_key = Column(String(500), nullable=False)
    extracted_text = Column(Text, nullable=True)
    detected_problems = Column(JSON, nullable=True)
    solutions = Column(JSON, nullable=True)
    ai_feedback = Column(Text, nullable=True)
    confidence_score = Column(Numeric(5, 2), nullable=True)
    processing_status = Column(String(50), default='pending', nullable=False, index=True)
    error_message = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    subject = relationship("Subject")
    
    __table_args__ = (
        Index('idx_homework_scan_institution', 'institution_id'),
        Index('idx_homework_scan_student', 'student_id'),
        Index('idx_homework_scan_subject', 'subject_id'),
        Index('idx_homework_scan_status', 'processing_status'),
        Index('idx_homework_scan_created', 'created_at'),
    )
