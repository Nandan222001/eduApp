from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from src.models.onboarding import StepType, UserRole


class OnboardingStepBase(BaseModel):
    step_order: int
    step_type: StepType
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    step_content: Optional[Dict[str, Any]] = None
    is_required: bool = True
    conditional_logic: Optional[Dict[str, Any]] = None


class OnboardingStepCreate(OnboardingStepBase):
    pass


class OnboardingStepUpdate(BaseModel):
    step_order: Optional[int] = None
    step_type: Optional[StepType] = None
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    step_content: Optional[Dict[str, Any]] = None
    is_required: Optional[bool] = None
    conditional_logic: Optional[Dict[str, Any]] = None


class OnboardingStepResponse(OnboardingStepBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    flow_id: int
    created_at: datetime
    updated_at: datetime


class OnboardingFlowBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    role_specific: Optional[UserRole] = None
    grade_level: Optional[str] = Field(None, max_length=100)
    is_active: bool = True
    is_default: bool = False


class OnboardingFlowCreate(OnboardingFlowBase):
    steps: List[OnboardingStepCreate] = []


class OnboardingFlowUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    role_specific: Optional[UserRole] = None
    grade_level: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class OnboardingFlowResponse(OnboardingFlowBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    steps: List[OnboardingStepResponse] = []


class OnboardingStepProgressBase(BaseModel):
    is_completed: bool = False
    is_skipped: bool = False
    response_data: Optional[Dict[str, Any]] = None


class OnboardingStepProgressCreate(OnboardingStepProgressBase):
    step_id: int


class OnboardingStepProgressUpdate(BaseModel):
    is_completed: Optional[bool] = None
    is_skipped: Optional[bool] = None
    response_data: Optional[Dict[str, Any]] = None


class OnboardingStepProgressResponse(OnboardingStepProgressBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    progress_id: int
    step_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    updated_at: datetime


class OnboardingProgressBase(BaseModel):
    is_completed: bool = False
    current_step_order: int = 0


class OnboardingProgressCreate(BaseModel):
    flow_id: int


class OnboardingProgressResponse(OnboardingProgressBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    flow_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    updated_at: datetime
    step_progress: List[OnboardingStepProgressResponse] = []


class OnboardingDocumentBase(BaseModel):
    document_type: str = Field(..., max_length=100)
    document_name: str = Field(..., max_length=255)
    file_url: str = Field(..., max_length=500)
    file_size: Optional[int] = None
    mime_type: Optional[str] = Field(None, max_length=100)


class OnboardingDocumentCreate(OnboardingDocumentBase):
    step_progress_id: Optional[int] = None


class OnboardingDocumentUpdate(BaseModel):
    is_verified: Optional[bool] = None
    verified_by: Optional[int] = None


class OnboardingDocumentResponse(OnboardingDocumentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    user_id: int
    step_progress_id: Optional[int] = None
    is_verified: bool
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class OnboardingSignatureBase(BaseModel):
    agreement_type: str = Field(..., max_length=100)
    agreement_text: str
    signature_data: Optional[str] = None


class OnboardingSignatureCreate(OnboardingSignatureBase):
    step_progress_id: Optional[int] = None
    ip_address: Optional[str] = Field(None, max_length=50)
    user_agent: Optional[str] = Field(None, max_length=255)


class OnboardingSignatureResponse(OnboardingSignatureBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    user_id: int
    step_progress_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    signed_at: datetime


class StepCompletionRequest(BaseModel):
    response_data: Optional[Dict[str, Any]] = None
    is_skipped: bool = False


class FlowProgressSummary(BaseModel):
    flow_id: int
    flow_name: str
    total_steps: int
    completed_steps: int
    current_step_order: int
    is_completed: bool
    completion_percentage: float
    started_at: datetime
    completed_at: Optional[datetime] = None


class BulkStepUpdate(BaseModel):
    steps: List[OnboardingStepCreate]


class MessageResponse(BaseModel):
    message: str
