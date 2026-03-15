from datetime import datetime, date
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text, Numeric, Index
from sqlalchemy.orm import relationship
from src.database import Base


class BookStatus(str, Enum):
    AVAILABLE = "available"
    ISSUED = "issued"
    RESERVED = "reserved"
    MAINTENANCE = "maintenance"
    LOST = "lost"


class IssueStatus(str, Enum):
    ACTIVE = "active"
    RETURNED = "returned"
    OVERDUE = "overdue"
    LOST = "lost"


class Book(Base):
    __tablename__ = "books"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False)
    isbn = Column(String(20), nullable=True, unique=True, index=True)
    category_id = Column(Integer, ForeignKey('book_categories.id', ondelete='SET NULL'), nullable=True, index=True)
    publisher = Column(String(255), nullable=True)
    publication_year = Column(Integer, nullable=True)
    edition = Column(String(50), nullable=True)
    language = Column(String(50), nullable=True)
    pages = Column(Integer, nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    available_quantity = Column(Integer, default=1, nullable=False)
    rack_number = Column(String(50), nullable=True)
    price = Column(Numeric(10, 2), nullable=True)
    status = Column(String(20), default=BookStatus.AVAILABLE.value, nullable=False, index=True)
    description = Column(Text, nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    category = relationship("BookCategory", back_populates="books")
    issues = relationship("BookIssue", back_populates="book", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_book_institution', 'institution_id'),
        Index('idx_book_category', 'category_id'),
        Index('idx_book_status', 'status'),
        Index('idx_book_title', 'title'),
    )


class BookCategory(Base):
    __tablename__ = "book_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    books = relationship("Book", back_populates="category")
    
    __table_args__ = (
        Index('idx_book_category_institution', 'institution_id'),
    )


class BookIssue(Base):
    __tablename__ = "book_issues"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey('books.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    issued_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    issue_date = Column(Date, nullable=False, index=True)
    due_date = Column(Date, nullable=False, index=True)
    return_date = Column(Date, nullable=True)
    returned_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    status = Column(String(20), default=IssueStatus.ACTIVE.value, nullable=False, index=True)
    fine_amount = Column(Numeric(10, 2), default=0, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    book = relationship("Book", back_populates="issues")
    student = relationship("Student")
    issuer = relationship("User", foreign_keys=[issued_by])
    returner = relationship("User", foreign_keys=[returned_by])
    
    __table_args__ = (
        Index('idx_book_issue_institution', 'institution_id'),
        Index('idx_book_issue_book', 'book_id'),
        Index('idx_book_issue_student', 'student_id'),
        Index('idx_book_issue_status', 'status'),
        Index('idx_book_issue_dates', 'issue_date', 'due_date'),
    )


class LibrarySettings(Base):
    __tablename__ = "library_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    max_books_per_student = Column(Integer, default=3, nullable=False)
    issue_duration_days = Column(Integer, default=14, nullable=False)
    fine_per_day = Column(Numeric(10, 2), default=5, nullable=False)
    allow_renewals = Column(Boolean, default=True, nullable=False)
    max_renewals = Column(Integer, default=2, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    
    __table_args__ = (
        Index('idx_library_settings_institution', 'institution_id'),
    )
