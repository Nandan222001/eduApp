from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.models.doubt import DoubtPost, DoubtStatus, DoubtPriority
from src.services.doubt_intelligence_service import DoubtIntelligenceService
from src.services.doubt_semantic_search_service import DoubtSemanticSearchService
from src.services.doubt_answer_suggestion_service import DoubtAnswerSuggestionService
from src.services.doubt_tagging_service import DoubtTaggingService
from src.services.doubt_priority_service import DoubtPriorityService
from src.services.doubt_teacher_assignment_service import DoubtTeacherAssignmentService

router = APIRouter(prefix="/doubts", tags=["Doubts Intelligence"])

doubt_intelligence_service = DoubtIntelligenceService()
semantic_search_service = DoubtSemanticSearchService()
answer_suggestion_service = DoubtAnswerSuggestionService()
tagging_service = DoubtTaggingService()
priority_service = DoubtPriorityService()
teacher_assignment_service = DoubtTeacherAssignmentService()


@router.post("/{doubt_id}/process")
async def process_doubt_with_ai(
    doubt_id: int,
    enable_auto_assignment: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = doubt_intelligence_service.process_new_doubt(
        db, doubt_id, current_user.institution_id, enable_auto_assignment
    )
    
    if not result['success']:
        raise HTTPException(status_code=404, detail=result['message'])
    
    return result


@router.get("/{doubt_id}/intelligence")
async def get_doubt_intelligence(
    doubt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = doubt_intelligence_service.get_doubt_intelligence_summary(
        db, doubt_id, current_user.institution_id
    )
    
    if not result['success']:
        raise HTTPException(status_code=404, detail=result['message'])
    
    return result


@router.get("/{doubt_id}/similar")
async def find_similar_doubts(
    doubt_id: int,
    top_k: int = Query(10, ge=1, le=50),
    similarity_threshold: float = Query(0.7, ge=0.0, le=1.0),
    same_subject_only: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    similar_doubts = semantic_search_service.find_similar_doubts(
        db, doubt_id, current_user.institution_id, top_k, 
        similarity_threshold, same_subject_only
    )
    
    return {
        'doubt_id': doubt_id,
        'similar_doubts': similar_doubts,
        'count': len(similar_doubts)
    }


@router.post("/search/semantic")
async def semantic_search_doubts(
    query_text: str,
    subject_id: Optional[int] = None,
    top_k: int = Query(10, ge=1, le=50),
    similarity_threshold: float = Query(0.6, ge=0.0, le=1.0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = semantic_search_service.search_similar_by_text(
        db, query_text, current_user.institution_id, 
        subject_id, top_k, similarity_threshold
    )
    
    return {
        'query': query_text,
        'results': results,
        'count': len(results)
    }


@router.get("/{doubt_id}/suggestions")
async def get_answer_suggestions(
    doubt_id: int,
    min_confidence: float = Query(0.5, ge=0.0, le=1.0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    suggestions = answer_suggestion_service.get_suggestions_for_doubt(
        db, doubt_id, current_user.institution_id, min_confidence
    )
    
    return {
        'doubt_id': doubt_id,
        'suggestions': suggestions,
        'count': len(suggestions)
    }


@router.post("/{doubt_id}/suggestions/generate")
async def generate_answer_suggestions(
    doubt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    suggestions = answer_suggestion_service.generate_answer_suggestions(
        db, doubt_id, current_user.institution_id
    )
    
    return {
        'doubt_id': doubt_id,
        'suggestions': suggestions,
        'count': len(suggestions)
    }


@router.post("/suggestions/{suggestion_id}/vote")
async def vote_suggestion_helpful(
    suggestion_id: int,
    is_helpful: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    suggestion = answer_suggestion_service.vote_suggestion_helpful(
        db, suggestion_id, is_helpful
    )
    
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    return {
        'suggestion_id': suggestion_id,
        'is_helpful': suggestion.is_helpful,
        'helpful_votes': suggestion.helpful_votes
    }


@router.post("/{doubt_id}/tags/auto-generate")
async def auto_generate_tags(
    doubt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = tagging_service.auto_tag_doubt(db, doubt_id)
    
    if not result['success']:
        raise HTTPException(status_code=404, detail=result['message'])
    
    return result


@router.get("/{doubt_id}/tags/suggestions")
async def get_tag_suggestions(
    doubt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    suggested_tags = tagging_service.suggest_tags(
        db, doubt_id, current_user.institution_id
    )
    
    return {
        'doubt_id': doubt_id,
        'suggested_tags': suggested_tags
    }


@router.post("/{doubt_id}/priority/calculate")
async def calculate_priority(
    doubt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = priority_service.calculate_priority_score(db, doubt_id)
    
    if not result['success']:
        raise HTTPException(status_code=404, detail=result['message'])
    
    return result


@router.get("/prioritized")
async def get_prioritized_doubts(
    status: Optional[str] = None,
    subject_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doubts = priority_service.get_prioritized_doubts(
        db, current_user.institution_id, status, subject_id, limit
    )
    
    return {
        'doubts': [
            {
                'id': d.id,
                'title': d.title,
                'status': d.status.value,
                'priority': d.priority.value if d.priority else None,
                'priority_score': d.priority_score,
                'urgency_score': d.urgency_score,
                'difficulty_score': d.difficulty_score,
                'created_at': d.created_at,
                'assigned_teacher_id': d.assigned_teacher_id
            }
            for d in doubts
        ],
        'count': len(doubts)
    }


@router.post("/{doubt_id}/assign-teacher")
async def assign_teacher(
    doubt_id: int,
    auto_assign: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = teacher_assignment_service.assign_teacher_to_doubt(
        db, doubt_id, current_user.institution_id, auto_assign
    )
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['message'])
    
    return result


@router.post("/{doubt_id}/reassign-teacher")
async def reassign_teacher(
    doubt_id: int,
    new_teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = teacher_assignment_service.reassign_doubt(
        db, doubt_id, new_teacher_id, current_user.institution_id
    )
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['message'])
    
    return result


@router.get("/teachers/{teacher_id}/workload")
async def get_teacher_workload(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workload = teacher_assignment_service.get_teacher_workload(
        db, teacher_id, current_user.institution_id
    )
    
    return workload


@router.post("/batch/process")
async def batch_process_doubts(
    batch_size: int = Query(50, ge=1, le=100),
    enable_auto_assignment: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = doubt_intelligence_service.batch_process_doubts(
        db, current_user.institution_id, batch_size, enable_auto_assignment
    )
    
    return result


@router.post("/batch/generate-embeddings")
async def batch_generate_embeddings(
    batch_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = semantic_search_service.batch_generate_embeddings(
        db, current_user.institution_id, batch_size
    )
    
    return result


@router.post("/batch/auto-tag")
async def batch_auto_tag_doubts(
    batch_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = tagging_service.batch_auto_tag_doubts(
        db, current_user.institution_id, batch_size
    )
    
    return result


@router.post("/batch/recalculate-priorities")
async def batch_recalculate_priorities(
    batch_size: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = priority_service.recalculate_priorities(
        db, current_user.institution_id, batch_size
    )
    
    return result


@router.post("/batch/auto-assign-teachers")
async def batch_auto_assign_teachers(
    batch_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = teacher_assignment_service.auto_assign_pending_doubts(
        db, current_user.institution_id, batch_size
    )
    
    return result


@router.get("/analytics/intelligence")
async def get_intelligence_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analytics = doubt_intelligence_service.get_intelligence_analytics(
        db, current_user.institution_id
    )
    
    return analytics


@router.post("/{doubt_id}/reprocess")
async def reprocess_doubt(
    doubt_id: int,
    steps: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = doubt_intelligence_service.reprocess_doubt(
        db, doubt_id, current_user.institution_id, steps
    )
    
    if not result['success']:
        raise HTTPException(status_code=404, detail=result.get('message', 'Processing failed'))
    
    return result
