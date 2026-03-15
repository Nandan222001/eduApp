from datetime import datetime, date
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text, Numeric, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from src.database import Base


class FeeCategory(str, Enum):
    TUITION = "tuition"
    ADMISSION = "admission"
    EXAM = "exam"
    LIBRARY = "library"
    TRANSPORT = "transport"
    SPORTS = "sports"
    LAB = "lab"
    OTHER = "other"


class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    UPI = "upi"
    CHEQUE = "cheque"
    ONLINE = "online"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class FeeStructure(Base):
    __tablename__ = "fee_structures"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id', ondelete='CASCADE'), nullable=False, index=True)
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurrence_period = Column(String(50), nullable=True)
    due_date = Column(Date, nullable=True, index=True)
    late_fee_applicable = Column(Boolean, default=False, nullable=False)
    late_fee_amount = Column(Numeric(10, 2), nullable=True)
    late_fee_percentage = Column(Numeric(5, 2), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    academic_year = relationship("AcademicYear")
    grade = relationship("Grade")
    payments = relationship("FeePayment", back_populates="fee_structure", cascade="all, delete-orphan")
    waivers = relationship("FeeWaiver", back_populates="fee_structure", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_fee_structure_institution', 'institution_id'),
        Index('idx_fee_structure_academic_year', 'academic_year_id'),
        Index('idx_fee_structure_grade', 'grade_id'),
        Index('idx_fee_structure_category', 'category'),
        Index('idx_fee_structure_due_date', 'due_date'),
        Index('idx_fee_structure_active', 'is_active'),
    )


class FeePayment(Base):
    __tablename__ = "fee_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    fee_structure_id = Column(Integer, ForeignKey('fee_structures.id', ondelete='CASCADE'), nullable=False, index=True)
    receipt_number = Column(String(100), nullable=False, unique=True, index=True)
    payment_date = Column(Date, nullable=False, index=True)
    amount_paid = Column(Numeric(10, 2), nullable=False)
    late_fee = Column(Numeric(10, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50), nullable=False)
    payment_status = Column(String(20), default=PaymentStatus.COMPLETED.value, nullable=False, index=True)
    transaction_id = Column(String(255), nullable=True)
    remarks = Column(Text, nullable=True)
    collected_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    fee_structure = relationship("FeeStructure", back_populates="payments")
    collector = relationship("User", foreign_keys=[collected_by])
    
    __table_args__ = (
        Index('idx_fee_payment_institution', 'institution_id'),
        Index('idx_fee_payment_student', 'student_id'),
        Index('idx_fee_payment_fee_structure', 'fee_structure_id'),
        Index('idx_fee_payment_receipt', 'receipt_number'),
        Index('idx_fee_payment_date', 'payment_date'),
        Index('idx_fee_payment_status', 'payment_status'),
        Index('idx_fee_payment_collected_by', 'collected_by'),
    )


class FeeWaiver(Base):
    __tablename__ = "fee_waivers"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    fee_structure_id = Column(Integer, ForeignKey('fee_structures.id', ondelete='CASCADE'), nullable=False, index=True)
    waiver_percentage = Column(Numeric(5, 2), nullable=False)
    waiver_amount = Column(Numeric(10, 2), nullable=False)
    reason = Column(Text, nullable=False)
    valid_from = Column(Date, nullable=False)
    valid_until = Column(Date, nullable=True)
    approved_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    approved_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    fee_structure = relationship("FeeStructure", back_populates="waivers")
    approver = relationship("User", foreign_keys=[approved_by])
    
    __table_args__ = (
        Index('idx_fee_waiver_institution', 'institution_id'),
        Index('idx_fee_waiver_student', 'student_id'),
        Index('idx_fee_waiver_fee_structure', 'fee_structure_id'),
        Index('idx_fee_waiver_valid_from', 'valid_from'),
        Index('idx_fee_waiver_valid_until', 'valid_until'),
        Index('idx_fee_waiver_active', 'is_active'),
        Index('idx_fee_waiver_approved_by', 'approved_by'),
    )
