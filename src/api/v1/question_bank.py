from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.models.previous_year_papers import QuestionType, DifficultyLevel, BloomTaxonomyLevel
from src.dependencies.auth import get_current_user
from src.schemas.previous_year_papers import (
    QuestionBankCreate,
    QuestionBankUpdate,
    QuestionBankResponse,
    QuestionVerifyRequest,
    QuestionStatistics
)
from src.services.previous_year_papers_service import QuestionBankService

router = APIRouter()


@router.post("/", response_model=QuestionBankResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    question_data: QuestionBankCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != question_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create question for this institution"
        )

    service = QuestionBankService(db)
    question = service.create_question(question_data)
    return question


@router.get("/", response_model=dict)
async def list_questions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    paper_id: Optional[int] = Query(None),
    grade_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    chapter_id: Optional[int] = Query(None),
    topic_id: Optional[int] = Query(None),
    question_type: Optional[QuestionType] = Query(None),
    difficulty_level: Optional[DifficultyLevel] = Query(None),
    bloom_taxonomy_level: Optional[BloomTaxonomyLevel] = Query(None),
    is_active: Optional[bool] = Query(None),
    is_verified: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBankService(db)
    questions, total = service.list_questions(
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
        paper_id=paper_id,
        grade_id=grade_id,
        subject_id=subject_id,
        chapter_id=chapter_id,
        topic_id=topic_id,
        question_type=question_type,
        difficulty_level=difficulty_level,
        bloom_taxonomy_level=bloom_taxonomy_level,
        is_active=is_active,
        is_verified=is_verified,
        search=search
    )
    return {
        "items": questions,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/facets", response_model=dict)
async def get_facets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBankService(db)
    facets = service.get_facets(current_user.institution_id)
    return facets


@router.get("/statistics", response_model=QuestionStatistics)
async def get_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBankService(db)
    statistics = service.get_statistics(current_user.institution_id)
    return statistics


@router.get("/paper/{paper_id}", response_model=dict)
async def get_questions_by_paper(
    paper_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBankService(db)
    questions, total = service.get_questions_by_paper(paper_id, skip, limit)
    
    return {
        "items": questions,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{question_id}", response_model=QuestionBankResponse)
async def get_question(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBankService(db)
    question = service.get_question(question_id)

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    if question.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this question"
        )

    return question


@router.put("/{question_id}", response_model=QuestionBankResponse)
async def update_question(
    question_id: int,
    question_data: QuestionBankUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBankService(db)
    question = service.get_question(question_id)

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    if question.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this question"
        )

    updated_question = service.update_question(question_id, question_data)
    return updated_question


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBankService(db)
    question = service.get_question(question_id)

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    if question.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this question"
        )

    service.delete_question(question_id)


@router.post("/{question_id}/verify", response_model=QuestionBankResponse)
async def verify_question(
    question_id: int,
    verify_data: QuestionVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBankService(db)
    question = service.get_question(question_id)

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    if question.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to verify this question"
        )

    verified_question = service.verify_question(
        question_id=question_id,
        is_verified=verify_data.is_verified,
        verified_by=verify_data.verified_by
    )

    if not verified_question:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify question"
        )

    return verified_question


@router.post("/{question_id}/upload-image", response_model=QuestionBankResponse)
async def upload_question_image(
    question_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBankService(db)
    question = service.get_question(question_id)

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    if question.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload image for this question"
        )

    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )

    file_content = await file.read()
    file_size = len(file_content)

    if file_size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit"
        )

    from io import BytesIO
    file_obj = BytesIO(file_content)

    updated_question = service.upload_image(
        question_id=question_id,
        file=file_obj,
        file_name=file.filename or f"question_{question_id}.jpg",
        content_type=file.content_type
    )

    if not updated_question:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload image"
        )

    return updated_question


@router.post("/{question_id}/use", status_code=status.HTTP_204_NO_CONTENT)
async def increment_usage_count(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBankService(db)
    question = service.get_question(question_id)

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    if question.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this question"
        )

    service.increment_usage_count(question_id)


@router.post("/{question_id}/suggest-tags", response_model=dict)
async def suggest_tags(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from src.services.ai_tag_suggestion_service import AITagSuggestionService
    
    service = QuestionBankService(db)
    question = service.get_question(question_id)

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    if question.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this question"
        )

    ai_service = AITagSuggestionService(db)
    suggestions = ai_service.suggest_tags_for_question(question_id)
    
    return suggestions
