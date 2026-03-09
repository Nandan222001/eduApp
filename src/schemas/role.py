from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from src.schemas.permission import PermissionResponse


class RoleBase(BaseModel):
    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=100)
    description: Optional[str] = None
    institution_id: Optional[int] = None
    is_system_role: bool = False
    is_active: bool = True


class RoleCreate(RoleBase):
    permission_ids: Optional[List[int]] = None


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    permission_ids: Optional[List[int]] = None


class RoleResponse(RoleBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime


class RoleWithPermissionsResponse(RoleResponse):
    permissions: List[PermissionResponse] = []
