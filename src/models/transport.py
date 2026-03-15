from datetime import datetime, time
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Time, Text, Numeric, Index
from sqlalchemy.orm import relationship
from src.database import Base


class RouteStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class VehicleType(str, Enum):
    BUS = "bus"
    VAN = "van"
    CAR = "car"


class TransportRoute(Base):
    __tablename__ = "transport_routes"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    route_name = Column(String(100), nullable=False)
    route_number = Column(String(50), nullable=False, index=True)
    vehicle_type = Column(String(20), nullable=False)
    vehicle_number = Column(String(50), nullable=False)
    driver_name = Column(String(100), nullable=False)
    driver_phone = Column(String(20), nullable=False)
    capacity = Column(Integer, nullable=False)
    fare = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), default=RouteStatus.ACTIVE.value, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan")
    students = relationship("StudentTransport", back_populates="route", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_transport_route_institution', 'institution_id'),
        Index('idx_transport_route_number', 'route_number'),
        Index('idx_transport_route_status', 'status'),
    )


class RouteStop(Base):
    __tablename__ = "route_stops"
    
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey('transport_routes.id', ondelete='CASCADE'), nullable=False, index=True)
    stop_name = Column(String(255), nullable=False)
    stop_order = Column(Integer, nullable=False)
    pickup_time = Column(Time, nullable=False)
    drop_time = Column(Time, nullable=False)
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    route = relationship("TransportRoute", back_populates="stops")
    
    __table_args__ = (
        Index('idx_route_stop_route', 'route_id'),
        Index('idx_route_stop_order', 'stop_order'),
    )


class StudentTransport(Base):
    __tablename__ = "student_transport"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    route_id = Column(Integer, ForeignKey('transport_routes.id', ondelete='CASCADE'), nullable=False, index=True)
    stop_id = Column(Integer, ForeignKey('route_stops.id', ondelete='SET NULL'), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    route = relationship("TransportRoute", back_populates="students")
    stop = relationship("RouteStop")
    
    __table_args__ = (
        Index('idx_student_transport_institution', 'institution_id'),
        Index('idx_student_transport_student', 'student_id'),
        Index('idx_student_transport_route', 'route_id'),
        Index('idx_student_transport_stop', 'stop_id'),
        Index('idx_student_transport_active', 'is_active'),
    )
