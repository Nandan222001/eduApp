from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Index, JSON
from sqlalchemy.orm import relationship
from src.database import Base


class SearchHistory(Base):
    __tablename__ = "search_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    query = Column(String(500), nullable=False)
    search_type = Column(String(50), nullable=True)
    filters = Column(JSON, nullable=True)
    results_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User")
    institution = relationship("Institution")
    
    __table_args__ = (
        Index('idx_search_history_user', 'user_id'),
        Index('idx_search_history_institution', 'institution_id'),
        Index('idx_search_history_created', 'created_at'),
        Index('idx_search_history_user_created', 'user_id', 'created_at'),
    )


class PopularSearch(Base):
    __tablename__ = "popular_searches"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    role = Column(String(50), nullable=True, index=True)
    
    query = Column(String(500), nullable=False)
    search_count = Column(Integer, default=1, nullable=False)
    last_searched_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    
    __table_args__ = (
        Index('idx_popular_search_institution', 'institution_id'),
        Index('idx_popular_search_role', 'role'),
        Index('idx_popular_search_count', 'search_count'),
        Index('idx_popular_search_institution_role', 'institution_id', 'role'),
    )
