from datetime import datetime, time
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from src.models.transport import RouteStatus, VehicleType


class RouteStopBase(BaseModel):
    stop_name: str = Field(..., max_length=255)
    stop_address: Optional[str] = None
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    stop_order: int = Field(..., ge=1)
    pickup_time: Optional[time] = None
    drop_time: Optional[time] = None
    is_active: bool = True


class RouteStopCreate(RouteStopBase):
    route_id: int


class RouteStopUpdate(BaseModel):
    stop_name: Optional[str] = Field(None, max_length=255)
    stop_address: Optional[str] = None
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    stop_order: Optional[int] = Field(None, ge=1)
    pickup_time: Optional[time] = None
    drop_time: Optional[time] = None
    is_active: Optional[bool] = None


class RouteStopResponse(RouteStopBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    route_id: int
    created_at: datetime
    updated_at: datetime


class TransportRouteBase(BaseModel):
    route_number: str = Field(..., max_length=50)
    route_name: str = Field(..., max_length=255)
    description: Optional[str] = None
    start_location: str = Field(..., max_length=500)
    end_location: str = Field(..., max_length=500)
    total_distance_km: Optional[Decimal] = Field(None, ge=0)
    estimated_duration_minutes: Optional[int] = Field(None, ge=0)
    pickup_time: Optional[time] = None
    drop_time: Optional[time] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = Field(None, max_length=50)
    vehicle_capacity: Optional[int] = Field(None, ge=1)
    driver_name: Optional[str] = Field(None, max_length=255)
    driver_phone: Optional[str] = Field(None, max_length=20)
    driver_license_number: Optional[str] = Field(None, max_length=50)
    conductor_name: Optional[str] = Field(None, max_length=255)
    conductor_phone: Optional[str] = Field(None, max_length=20)
    monthly_fee: Optional[Decimal] = Field(None, ge=0)
    status: str = "active"
    is_active: bool = True


class TransportRouteCreate(TransportRouteBase):
    institution_id: int


class TransportRouteUpdate(BaseModel):
    route_number: Optional[str] = Field(None, max_length=50)
    route_name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    start_location: Optional[str] = Field(None, max_length=500)
    end_location: Optional[str] = Field(None, max_length=500)
    total_distance_km: Optional[Decimal] = Field(None, ge=0)
    estimated_duration_minutes: Optional[int] = Field(None, ge=0)
    pickup_time: Optional[time] = None
    drop_time: Optional[time] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = Field(None, max_length=50)
    vehicle_capacity: Optional[int] = Field(None, ge=1)
    driver_name: Optional[str] = Field(None, max_length=255)
    driver_phone: Optional[str] = Field(None, max_length=20)
    driver_license_number: Optional[str] = Field(None, max_length=50)
    conductor_name: Optional[str] = Field(None, max_length=255)
    conductor_phone: Optional[str] = Field(None, max_length=20)
    monthly_fee: Optional[Decimal] = Field(None, ge=0)
    status: Optional[str] = None
    is_active: Optional[bool] = None


class TransportRouteResponse(TransportRouteBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime


class TransportRouteWithStops(TransportRouteResponse):
    stops: List[RouteStopResponse] = []


class StudentTransportBase(BaseModel):
    pickup_location: Optional[str] = None
    drop_location: Optional[str] = None
    monthly_fee: Optional[Decimal] = Field(None, ge=0)
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: bool = True
    emergency_contact_name: Optional[str] = Field(None, max_length=255)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    remarks: Optional[str] = None


class StudentTransportCreate(StudentTransportBase):
    institution_id: int
    student_id: int
    route_id: int
    stop_id: Optional[int] = None


class StudentTransportUpdate(BaseModel):
    route_id: Optional[int] = None
    stop_id: Optional[int] = None
    pickup_location: Optional[str] = None
    drop_location: Optional[str] = None
    monthly_fee: Optional[Decimal] = Field(None, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    emergency_contact_name: Optional[str] = Field(None, max_length=255)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    remarks: Optional[str] = None


class StudentTransportResponse(StudentTransportBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    route_id: int
    stop_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class StudentTransportWithDetails(StudentTransportResponse):
    student_name: str
    route_number: str
    route_name: str
    stop_name: Optional[str] = None
