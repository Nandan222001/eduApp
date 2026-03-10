from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.schemas.nlp_schemas import (
    BlueprintAnalysisRequest,
    BlueprintAnalysisResponse,
    BlueprintCreateRequest,
    BlueprintCreateFromAnalysisRequest,
    BlueprintResponse,
    BlueprintUpdateRequest,
    BlueprintSuggestionsResponse
)
from src.services.question_blueprint_service import QuestionBlueprintService

router = APIRouter(prefix="/question-blueprints", tags=["Question Blueprints"])


@router.post("/analyze", response_model=BlueprintAnalysisResponse)
def analyze_historical_patterns(
    request: BlueprintAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionBlueprintService(db)
    analysis = service.analyze_historical_patterns(
        institution_id=current_user.institution_id,
        board=request.board,
        grade_id=request.grade_id,
        subject_id=request.subject_id,
        year_start=request.year_start,
        year_end=request.year_end
    )
    
    if analysis.get('status') == 'no_data':
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=analysis.get('message', 'No historical data found')
        )
    
    return analysis


@router.post("/create", response_model=BlueprintResponse)
def create_blueprint(
    request: BlueprintCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionBlueprintService(db)
    blueprint = service.create_blueprint(
        institution_id=current_user.institution_id,
        board=request.board,
        grade_id=request.grade_id,
        subject_id=request.subject_id,
        blueprint_name=request.blueprint_name,
        total_marks=request.total_marks,
        duration_minutes=request.duration_minutes,
        difficulty_distribution=request.difficulty_distribution,
        bloom_taxonomy_distribution=request.bloom_taxonomy_distribution,
        question_type_distribution=request.question_type_distribution,
        chapter_weightage=request.chapter_weightage,
        description=request.description,
        user_id=current_user.id
    )
    
    return blueprint


@router.post("/create-from-analysis", response_model=BlueprintResponse)
def create_blueprint_from_analysis(
    request: BlueprintCreateFromAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionBlueprintService(db)
    
    try:
        blueprint = service.create_blueprint_from_analysis(
            institution_id=current_user.institution_id,
            board=request.board,
            grade_id=request.grade_id,
            subject_id=request.subject_id,
            blueprint_name=request.blueprint_name,
            description=request.description,
            user_id=current_user.id,
            year_start=request.year_start,
            year_end=request.year_end
        )
        
        return blueprint
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[BlueprintResponse])
def get_all_blueprints(
    grade_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionBlueprintService(db)
    blueprints = service.get_all_blueprints(
        institution_id=current_user.institution_id,
        grade_id=grade_id,
        subject_id=subject_id,
        active_only=active_only
    )
    
    return blueprints


@router.get("/{blueprint_id}", response_model=BlueprintResponse)
def get_blueprint(
    blueprint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionBlueprintService(db)
    blueprint = service.get_blueprint(blueprint_id)
    
    if not blueprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blueprint not found"
        )
    
    if blueprint.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return blueprint


@router.put("/{blueprint_id}", response_model=BlueprintResponse)
def update_blueprint(
    blueprint_id: int,
    request: BlueprintUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionBlueprintService(db)
    
    existing = service.get_blueprint(blueprint_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blueprint not found"
        )
    
    if existing.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    blueprint = service.update_blueprint(
        blueprint_id=blueprint_id,
        **request.model_dump(exclude_unset=True)
    )
    
    return blueprint


@router.delete("/{blueprint_id}")
def delete_blueprint(
    blueprint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionBlueprintService(db)
    
    existing = service.get_blueprint(blueprint_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blueprint not found"
        )
    
    if existing.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    success = service.delete_blueprint(blueprint_id)
    
    return {
        'status': 'success' if success else 'failed',
        'blueprint_id': blueprint_id
    }


@router.get("/{blueprint_id}/suggestions", response_model=BlueprintSuggestionsResponse)
def generate_question_suggestions(
    blueprint_id: int,
    include_predictions: bool = Query(True, description="Include high-probability topics from predictions"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionBlueprintService(db)
    
    existing = service.get_blueprint(blueprint_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blueprint not found"
        )
    
    if existing.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    suggestions = service.generate_question_paper_suggestions(
        blueprint_id=blueprint_id,
        include_predictions=include_predictions
    )
    
    if suggestions.get('status') == 'not_found':
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blueprint not found"
        )
    
    return suggestions
