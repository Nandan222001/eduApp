from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class AuditLogBase(BaseModel):
    institution_id: Optional[int] = None
    user_id: Optional[int] = None
    table_name: str = Field(..., max_length=100)
    record_id: Optional[int] = None
    action: str = Field(..., max_length=50)
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = Field(None, max_length=45)
    user_agent: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AuditLogResponse(AuditLogBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
