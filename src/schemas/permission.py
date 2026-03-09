from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class PermissionBase(BaseModel):
    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=100)
    resource: str = Field(..., max_length=100)
    action: str = Field(..., max_length=50)
    description: Optional[str] = None


class PermissionCreate(PermissionBase):
    pass


class PermissionUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class PermissionResponse(PermissionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime
