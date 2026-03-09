from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class InstitutionBase(BaseModel):
    name: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=100)
    domain: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    is_active: bool = True
    max_users: Optional[int] = None
    settings: Optional[str] = None


class InstitutionCreate(InstitutionBase):
    pass


class InstitutionUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    domain: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    max_users: Optional[int] = None
    settings: Optional[str] = None


class InstitutionResponse(InstitutionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime
