from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.services.onboarding_service import OnboardingService
from src.schemas.onboarding import (
    OnboardingFlowResponse,
    OnboardingFlowCreate,
    OnboardingFlowUpdate,
    OnboardingStepResponse,
    OnboardingStepCreate,
    OnboardingStepUpdate,
    OnboardingProgressResponse,
    OnboardingProgressCreate,
    StepCompletionRequest,
    FlowProgressSummary,
    OnboardingDocumentResponse,
    OnboardingDocumentCreate,
    OnboardingSignatureResponse,
    OnboardingSignatureCreate,
    BulkStepUpdate,
    MessageResponse,
    UserRole
)

router = APIRouter()


@router.get("/flows", response_model=List[OnboardingFlowResponse])
async def get_onboarding_flows(
    role_specific: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all onboarding flows for the institution"""
    flows = OnboardingService.get_flows(
        db,
        current_user.institution_id,
        role_specific=role_specific,
        is_active=is_active
    )
    return flows


@router.post("/flows", response_model=OnboardingFlowResponse, status_code=status.HTTP_201_CREATED)
async def create_onboarding_flow(
    flow_data: OnboardingFlowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new onboarding flow (admin only)"""
    flow = OnboardingService.create_flow(
        db,
        current_user.institution_id,
        current_user.id,
        flow_data
    )
    return flow


@router.get("/flows/{flow_id}", response_model=OnboardingFlowResponse)
async def get_onboarding_flow(
    flow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific onboarding flow by ID"""
    flow = OnboardingService.get_flow_by_id(
        db,
        flow_id,
        current_user.institution_id
    )
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding flow not found"
        )
    return flow


@router.put("/flows/{flow_id}", response_model=OnboardingFlowResponse)
async def update_onboarding_flow(
    flow_id: int,
    flow_data: OnboardingFlowUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an onboarding flow (admin only)"""
    flow = OnboardingService.update_flow(
        db,
        flow_id,
        current_user.institution_id,
        flow_data
    )
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding flow not found"
        )
    return flow


@router.delete("/flows/{flow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_onboarding_flow(
    flow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an onboarding flow (admin only)"""
    success = OnboardingService.delete_flow(
        db,
        flow_id,
        current_user.institution_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding flow not found"
        )
    return None


@router.post("/flows/{flow_id}/steps", response_model=OnboardingStepResponse, status_code=status.HTTP_201_CREATED)
async def add_step_to_flow(
    flow_id: int,
    step_data: OnboardingStepCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a step to an onboarding flow (admin only)"""
    step = OnboardingService.add_step_to_flow(
        db,
        flow_id,
        current_user.institution_id,
        step_data
    )
    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding flow not found"
        )
    return step


@router.put("/flows/{flow_id}/steps/bulk", response_model=MessageResponse)
async def update_flow_steps_bulk(
    flow_id: int,
    bulk_data: BulkStepUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Replace all steps in a flow (drag-drop builder)"""
    flow = OnboardingService.get_flow_by_id(
        db,
        flow_id,
        current_user.institution_id
    )
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding flow not found"
        )
    
    for step in flow.steps:
        db.delete(step)
    
    for step_data in bulk_data.steps:
        step = OnboardingService.add_step_to_flow(
            db,
            flow_id,
            current_user.institution_id,
            step_data
        )
    
    return MessageResponse(message="Flow steps updated successfully")


@router.put("/steps/{step_id}", response_model=OnboardingStepResponse)
async def update_onboarding_step(
    step_id: int,
    step_data: OnboardingStepUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a specific onboarding step (admin only)"""
    step = OnboardingService.update_step(
        db,
        step_id,
        current_user.institution_id,
        step_data
    )
    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding step not found"
        )
    return step


@router.delete("/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_onboarding_step(
    step_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific onboarding step (admin only)"""
    success = OnboardingService.delete_step(
        db,
        step_id,
        current_user.institution_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding step not found"
        )
    return None


@router.get("/my-flow", response_model=OnboardingFlowResponse)
async def get_my_onboarding_flow(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get role-specific onboarding flow for current user"""
    flow = OnboardingService.get_role_specific_flow(db, current_user)
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No onboarding flow available for your role"
        )
    return flow


@router.post("/progress/start", response_model=OnboardingProgressResponse, status_code=status.HTTP_201_CREATED)
async def start_onboarding(
    progress_data: OnboardingProgressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start onboarding for a specific flow"""
    progress = OnboardingService.start_onboarding(
        db,
        current_user.id,
        progress_data.flow_id
    )
    return progress


@router.get("/progress", response_model=OnboardingProgressResponse)
async def get_my_progress(
    flow_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's onboarding progress"""
    progress = OnboardingService.get_user_progress(
        db,
        current_user.id,
        flow_id
    )
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No onboarding progress found"
        )
    return progress


@router.get("/progress/summary", response_model=FlowProgressSummary)
async def get_progress_summary(
    flow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get summary of onboarding progress"""
    summary = OnboardingService.get_progress_summary(
        db,
        current_user.id,
        flow_id
    )
    return summary


@router.post("/steps/{step_id}/complete", response_model=MessageResponse)
async def complete_step(
    step_id: int,
    completion_data: StepCompletionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a step as completed"""
    step_progress = OnboardingService.complete_step(
        db,
        current_user.id,
        step_id,
        completion_data
    )
    return MessageResponse(message="Step completed successfully")


@router.get("/next-step", response_model=Optional[OnboardingStepResponse])
async def get_next_step(
    flow_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the next step to complete in the onboarding flow"""
    progress = OnboardingService.get_user_progress(
        db,
        current_user.id,
        flow_id
    )
    
    if not progress:
        progress = OnboardingService.start_onboarding(
            db,
            current_user.id,
            flow_id
        )
    
    next_step = OnboardingService.get_next_step(db, progress)
    return next_step


@router.post("/documents", response_model=OnboardingDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    document_data: OnboardingDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a document for onboarding"""
    document = OnboardingService.upload_document(
        db,
        current_user.institution_id,
        current_user.id,
        document_data
    )
    return document


@router.get("/documents", response_model=List[OnboardingDocumentResponse])
async def get_my_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's uploaded documents"""
    documents = OnboardingService.get_user_documents(
        db,
        current_user.id,
        current_user.institution_id
    )
    return documents


@router.post("/documents/{document_id}/verify", response_model=OnboardingDocumentResponse)
async def verify_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verify a user's document (admin only)"""
    document = OnboardingService.verify_document(
        db,
        document_id,
        current_user.id,
        current_user.institution_id
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return document


@router.post("/signatures", response_model=OnboardingSignatureResponse, status_code=status.HTTP_201_CREATED)
async def create_signature(
    signature_data: OnboardingSignatureCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sign an agreement during onboarding"""
    if not signature_data.ip_address:
        signature_data.ip_address = request.client.host if request.client else None
    
    if not signature_data.user_agent:
        signature_data.user_agent = request.headers.get("User-Agent")
    
    signature = OnboardingService.create_signature(
        db,
        current_user.institution_id,
        current_user.id,
        signature_data
    )
    return signature


@router.get("/signatures", response_model=List[OnboardingSignatureResponse])
async def get_my_signatures(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's signatures"""
    signatures = OnboardingService.get_user_signatures(
        db,
        current_user.id,
        current_user.institution_id
    )
    return signatures
