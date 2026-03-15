from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from fastapi import HTTPException, status

from src.models.onboarding import (
    OnboardingFlow,
    OnboardingStep,
    OnboardingProgress,
    OnboardingStepProgress,
    OnboardingDocument,
    OnboardingSignature,
    UserRole,
    StepType
)
from src.models.user import User
from src.schemas.onboarding import (
    OnboardingFlowCreate,
    OnboardingFlowUpdate,
    OnboardingStepCreate,
    OnboardingStepUpdate,
    OnboardingProgressCreate,
    StepCompletionRequest,
    OnboardingDocumentCreate,
    OnboardingSignatureCreate,
    FlowProgressSummary
)


class OnboardingService:
    
    @staticmethod
    def create_flow(
        db: Session,
        institution_id: int,
        user_id: int,
        flow_data: OnboardingFlowCreate
    ) -> OnboardingFlow:
        flow = OnboardingFlow(
            institution_id=institution_id,
            name=flow_data.name,
            description=flow_data.description,
            role_specific=flow_data.role_specific,
            grade_level=flow_data.grade_level,
            is_active=flow_data.is_active,
            is_default=flow_data.is_default,
            created_by=user_id
        )
        
        db.add(flow)
        db.flush()
        
        for step_data in flow_data.steps:
            step = OnboardingStep(
                flow_id=flow.id,
                step_order=step_data.step_order,
                step_type=step_data.step_type,
                title=step_data.title,
                description=step_data.description,
                step_content=step_data.step_content,
                is_required=step_data.is_required,
                conditional_logic=step_data.conditional_logic
            )
            db.add(step)
        
        db.commit()
        db.refresh(flow)
        return flow
    
    @staticmethod
    def get_flow_by_id(
        db: Session,
        flow_id: int,
        institution_id: int
    ) -> Optional[OnboardingFlow]:
        return db.query(OnboardingFlow).options(
            joinedload(OnboardingFlow.steps)
        ).filter(
            OnboardingFlow.id == flow_id,
            OnboardingFlow.institution_id == institution_id
        ).first()
    
    @staticmethod
    def get_flows(
        db: Session,
        institution_id: int,
        role_specific: Optional[UserRole] = None,
        is_active: Optional[bool] = None
    ) -> List[OnboardingFlow]:
        query = db.query(OnboardingFlow).options(
            joinedload(OnboardingFlow.steps)
        ).filter(
            OnboardingFlow.institution_id == institution_id
        )
        
        if role_specific is not None:
            query = query.filter(
                or_(
                    OnboardingFlow.role_specific == role_specific,
                    OnboardingFlow.role_specific.is_(None)
                )
            )
        
        if is_active is not None:
            query = query.filter(OnboardingFlow.is_active == is_active)
        
        return query.order_by(OnboardingFlow.created_at.desc()).all()
    
    @staticmethod
    def update_flow(
        db: Session,
        flow_id: int,
        institution_id: int,
        flow_data: OnboardingFlowUpdate
    ) -> Optional[OnboardingFlow]:
        flow = OnboardingService.get_flow_by_id(db, flow_id, institution_id)
        if not flow:
            return None
        
        update_data = flow_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(flow, field, value)
        
        db.commit()
        db.refresh(flow)
        return flow
    
    @staticmethod
    def delete_flow(
        db: Session,
        flow_id: int,
        institution_id: int
    ) -> bool:
        flow = OnboardingService.get_flow_by_id(db, flow_id, institution_id)
        if not flow:
            return False
        
        db.delete(flow)
        db.commit()
        return True
    
    @staticmethod
    def add_step_to_flow(
        db: Session,
        flow_id: int,
        institution_id: int,
        step_data: OnboardingStepCreate
    ) -> Optional[OnboardingStep]:
        flow = OnboardingService.get_flow_by_id(db, flow_id, institution_id)
        if not flow:
            return None
        
        step = OnboardingStep(
            flow_id=flow_id,
            step_order=step_data.step_order,
            step_type=step_data.step_type,
            title=step_data.title,
            description=step_data.description,
            step_content=step_data.step_content,
            is_required=step_data.is_required,
            conditional_logic=step_data.conditional_logic
        )
        
        db.add(step)
        db.commit()
        db.refresh(step)
        return step
    
    @staticmethod
    def update_step(
        db: Session,
        step_id: int,
        institution_id: int,
        step_data: OnboardingStepUpdate
    ) -> Optional[OnboardingStep]:
        step = db.query(OnboardingStep).join(OnboardingFlow).filter(
            OnboardingStep.id == step_id,
            OnboardingFlow.institution_id == institution_id
        ).first()
        
        if not step:
            return None
        
        update_data = step_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(step, field, value)
        
        db.commit()
        db.refresh(step)
        return step
    
    @staticmethod
    def delete_step(
        db: Session,
        step_id: int,
        institution_id: int
    ) -> bool:
        step = db.query(OnboardingStep).join(OnboardingFlow).filter(
            OnboardingStep.id == step_id,
            OnboardingFlow.institution_id == institution_id
        ).first()
        
        if not step:
            return False
        
        db.delete(step)
        db.commit()
        return True
    
    @staticmethod
    def get_role_specific_flow(
        db: Session,
        user: User
    ) -> Optional[OnboardingFlow]:
        role_slug = user.role.slug if user.role else None
        
        role_mapping = {
            'student': UserRole.STUDENT,
            'parent': UserRole.PARENT,
            'teacher': UserRole.TEACHER,
            'admin': UserRole.ADMIN
        }
        
        user_role = role_mapping.get(role_slug)
        
        grade_level = None
        if hasattr(user, 'student_profile') and user.student_profile:
            if user.student_profile.section and user.student_profile.section.grade:
                grade_level = user.student_profile.section.grade.name
        
        query = db.query(OnboardingFlow).filter(
            OnboardingFlow.institution_id == user.institution_id,
            OnboardingFlow.is_active == True
        )
        
        if grade_level and user_role:
            flow = query.filter(
                OnboardingFlow.role_specific == user_role,
                OnboardingFlow.grade_level == grade_level
            ).first()
            if flow:
                return flow
        
        if user_role:
            flow = query.filter(
                OnboardingFlow.role_specific == user_role,
                OnboardingFlow.grade_level.is_(None)
            ).first()
            if flow:
                return flow
        
        flow = query.filter(
            OnboardingFlow.is_default == True
        ).first()
        
        return flow
    
    @staticmethod
    def start_onboarding(
        db: Session,
        user_id: int,
        flow_id: int
    ) -> OnboardingProgress:
        existing = db.query(OnboardingProgress).filter(
            OnboardingProgress.user_id == user_id,
            OnboardingProgress.flow_id == flow_id
        ).first()
        
        if existing:
            return existing
        
        progress = OnboardingProgress(
            user_id=user_id,
            flow_id=flow_id,
            current_step_order=0
        )
        
        db.add(progress)
        db.commit()
        db.refresh(progress)
        return progress
    
    @staticmethod
    def get_user_progress(
        db: Session,
        user_id: int,
        flow_id: Optional[int] = None
    ) -> Optional[OnboardingProgress]:
        query = db.query(OnboardingProgress).options(
            joinedload(OnboardingProgress.step_progress),
            joinedload(OnboardingProgress.flow).joinedload(OnboardingFlow.steps)
        ).filter(
            OnboardingProgress.user_id == user_id
        )
        
        if flow_id:
            query = query.filter(OnboardingProgress.flow_id == flow_id)
        
        return query.first()
    
    @staticmethod
    def evaluate_conditional_logic(
        conditional_logic: Optional[Dict[str, Any]],
        user_responses: Dict[int, Any]
    ) -> bool:
        if not conditional_logic:
            return True
        
        condition_type = conditional_logic.get('type')
        
        if condition_type == 'response_equals':
            step_id = conditional_logic.get('step_id')
            expected_value = conditional_logic.get('value')
            actual_value = user_responses.get(step_id, {}).get('response_data')
            return actual_value == expected_value
        
        elif condition_type == 'response_contains':
            step_id = conditional_logic.get('step_id')
            expected_value = conditional_logic.get('value')
            actual_value = user_responses.get(step_id, {}).get('response_data')
            if isinstance(actual_value, list):
                return expected_value in actual_value
            return False
        
        elif condition_type == 'all':
            conditions = conditional_logic.get('conditions', [])
            return all(
                OnboardingService.evaluate_conditional_logic(cond, user_responses)
                for cond in conditions
            )
        
        elif condition_type == 'any':
            conditions = conditional_logic.get('conditions', [])
            return any(
                OnboardingService.evaluate_conditional_logic(cond, user_responses)
                for cond in conditions
            )
        
        return True
    
    @staticmethod
    def get_next_step(
        db: Session,
        progress: OnboardingProgress
    ) -> Optional[OnboardingStep]:
        flow = db.query(OnboardingFlow).options(
            joinedload(OnboardingFlow.steps)
        ).filter(OnboardingFlow.id == progress.flow_id).first()
        
        if not flow:
            return None
        
        user_responses = {}
        for step_prog in progress.step_progress:
            user_responses[step_prog.step_id] = {
                'response_data': step_prog.response_data,
                'is_completed': step_prog.is_completed,
                'is_skipped': step_prog.is_skipped
            }
        
        completed_step_ids = {
            sp.step_id for sp in progress.step_progress
            if sp.is_completed or sp.is_skipped
        }
        
        for step in sorted(flow.steps, key=lambda s: s.step_order):
            if step.id not in completed_step_ids:
                if OnboardingService.evaluate_conditional_logic(
                    step.conditional_logic,
                    user_responses
                ):
                    return step
        
        return None
    
    @staticmethod
    def complete_step(
        db: Session,
        user_id: int,
        step_id: int,
        completion_data: StepCompletionRequest
    ) -> OnboardingStepProgress:
        step = db.query(OnboardingStep).filter(
            OnboardingStep.id == step_id
        ).first()
        
        if not step:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Step not found"
            )
        
        progress = db.query(OnboardingProgress).filter(
            OnboardingProgress.user_id == user_id,
            OnboardingProgress.flow_id == step.flow_id
        ).first()
        
        if not progress:
            progress = OnboardingService.start_onboarding(db, user_id, step.flow_id)
        
        step_progress = db.query(OnboardingStepProgress).filter(
            OnboardingStepProgress.progress_id == progress.id,
            OnboardingStepProgress.step_id == step_id
        ).first()
        
        if not step_progress:
            step_progress = OnboardingStepProgress(
                progress_id=progress.id,
                step_id=step_id
            )
            db.add(step_progress)
        
        step_progress.is_completed = True
        step_progress.is_skipped = completion_data.is_skipped
        step_progress.response_data = completion_data.response_data
        step_progress.completed_at = datetime.utcnow()
        
        progress.current_step_order = step.step_order
        
        next_step = OnboardingService.get_next_step(db, progress)
        if not next_step:
            progress.is_completed = True
            progress.completed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(step_progress)
        return step_progress
    
    @staticmethod
    def get_progress_summary(
        db: Session,
        user_id: int,
        flow_id: int
    ) -> FlowProgressSummary:
        progress = db.query(OnboardingProgress).options(
            joinedload(OnboardingProgress.step_progress),
            joinedload(OnboardingProgress.flow).joinedload(OnboardingFlow.steps)
        ).filter(
            OnboardingProgress.user_id == user_id,
            OnboardingProgress.flow_id == flow_id
        ).first()
        
        if not progress:
            flow = db.query(OnboardingFlow).filter(
                OnboardingFlow.id == flow_id
            ).first()
            
            if not flow:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Flow not found"
                )
            
            total_steps = len(flow.steps)
            return FlowProgressSummary(
                flow_id=flow.id,
                flow_name=flow.name,
                total_steps=total_steps,
                completed_steps=0,
                current_step_order=0,
                is_completed=False,
                completion_percentage=0.0,
                started_at=datetime.utcnow(),
                completed_at=None
            )
        
        total_steps = len(progress.flow.steps)
        completed_steps = sum(
            1 for sp in progress.step_progress
            if sp.is_completed or sp.is_skipped
        )
        completion_percentage = (completed_steps / total_steps * 100) if total_steps > 0 else 0.0
        
        return FlowProgressSummary(
            flow_id=progress.flow_id,
            flow_name=progress.flow.name,
            total_steps=total_steps,
            completed_steps=completed_steps,
            current_step_order=progress.current_step_order,
            is_completed=progress.is_completed,
            completion_percentage=round(completion_percentage, 2),
            started_at=progress.started_at,
            completed_at=progress.completed_at
        )
    
    @staticmethod
    def upload_document(
        db: Session,
        institution_id: int,
        user_id: int,
        document_data: OnboardingDocumentCreate
    ) -> OnboardingDocument:
        document = OnboardingDocument(
            institution_id=institution_id,
            user_id=user_id,
            step_progress_id=document_data.step_progress_id,
            document_type=document_data.document_type,
            document_name=document_data.document_name,
            file_url=document_data.file_url,
            file_size=document_data.file_size,
            mime_type=document_data.mime_type
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        return document
    
    @staticmethod
    def get_user_documents(
        db: Session,
        user_id: int,
        institution_id: int
    ) -> List[OnboardingDocument]:
        return db.query(OnboardingDocument).filter(
            OnboardingDocument.user_id == user_id,
            OnboardingDocument.institution_id == institution_id
        ).all()
    
    @staticmethod
    def verify_document(
        db: Session,
        document_id: int,
        verifier_id: int,
        institution_id: int
    ) -> Optional[OnboardingDocument]:
        document = db.query(OnboardingDocument).filter(
            OnboardingDocument.id == document_id,
            OnboardingDocument.institution_id == institution_id
        ).first()
        
        if not document:
            return None
        
        document.is_verified = True
        document.verified_by = verifier_id
        document.verified_at = datetime.utcnow()
        
        db.commit()
        db.refresh(document)
        return document
    
    @staticmethod
    def create_signature(
        db: Session,
        institution_id: int,
        user_id: int,
        signature_data: OnboardingSignatureCreate
    ) -> OnboardingSignature:
        signature = OnboardingSignature(
            institution_id=institution_id,
            user_id=user_id,
            step_progress_id=signature_data.step_progress_id,
            agreement_type=signature_data.agreement_type,
            agreement_text=signature_data.agreement_text,
            signature_data=signature_data.signature_data,
            ip_address=signature_data.ip_address,
            user_agent=signature_data.user_agent
        )
        
        db.add(signature)
        db.commit()
        db.refresh(signature)
        return signature
    
    @staticmethod
    def get_user_signatures(
        db: Session,
        user_id: int,
        institution_id: int
    ) -> List[OnboardingSignature]:
        return db.query(OnboardingSignature).filter(
            OnboardingSignature.user_id == user_id,
            OnboardingSignature.institution_id == institution_id
        ).all()
