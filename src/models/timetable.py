from datetime import datetime, time
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Time, Text, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from src.database import Base


class PeriodType(str, Enum):
    LECTURE = "lecture"
    LAB = "lab"
    BREAK = "break"
    LUNCH = "lunch"
    ASSEMBLY = "assembly"
    SPORTS = "sports"


class TimetableTemplate(Base):
    __tablename__ = "timetable_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    period_slots = relationship("PeriodSlot", back_populates="template", cascade="all, delete-orphan")
    timetables = relationship("Timetable", back_populates="template", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_timetable_template_institution', 'institution_id'),
        Index('idx_timetable_template_active', 'is_active'),
    )


class PeriodSlot(Base):
    __tablename__ = "period_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey('timetable_templates.id', ondelete='CASCADE'), nullable=False, index=True)
    period_number = Column(Integer, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    period_type = Column(String(20), default=PeriodType.LECTURE.value, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    template = relationship("TimetableTemplate", back_populates="period_slots")
    
    __table_args__ = (
        Index('idx_period_slot_template', 'template_id'),
        Index('idx_period_slot_number', 'period_number'),
    )


class Timetable(Base):
    __tablename__ = "timetables"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey('sections.id', ondelete='CASCADE'), nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id', ondelete='CASCADE'), nullable=False, index=True)
    template_id = Column(Integer, ForeignKey('timetable_templates.id', ondelete='SET NULL'), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    section = relationship("Section")
    academic_year = relationship("AcademicYear")
    template = relationship("TimetableTemplate", back_populates="timetables")
    entries = relationship("TimetableEntry", back_populates="timetable", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_timetable_institution', 'institution_id'),
        Index('idx_timetable_section', 'section_id'),
        Index('idx_timetable_academic_year', 'academic_year_id'),
        Index('idx_timetable_template', 'template_id'),
        Index('idx_timetable_active', 'is_active'),
    )


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    timetable_id = Column(Integer, ForeignKey('timetables.id', ondelete='CASCADE'), nullable=False, index=True)
    day_of_week = Column(String(20), nullable=False, index=True)
    period_number = Column(Integer, nullable=False)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='SET NULL'), nullable=True, index=True)
    room_number = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    timetable = relationship("Timetable", back_populates="entries")
    subject = relationship("Subject")
    teacher = relationship("Teacher")
    
    __table_args__ = (
        UniqueConstraint('timetable_id', 'day_of_week', 'period_number', name='uq_timetable_day_period'),
        Index('idx_timetable_entry_timetable', 'timetable_id'),
        Index('idx_timetable_entry_day', 'day_of_week'),
        Index('idx_timetable_entry_subject', 'subject_id'),
        Index('idx_timetable_entry_teacher', 'teacher_id'),
    )
