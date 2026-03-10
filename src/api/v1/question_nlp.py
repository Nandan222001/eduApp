from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.schemas.nlp_schemas import (
    QuestionSimilarityRequest,
    SimilarQuestionResponse,
    ClusteringRequest,
    ClusteringResponse,
    ClusterInfoResponse,
    ClusterSummaryResponse,
    VariationGenerationRequest,
    VariationResponse,
    BloomClassificationRequest,
    BloomClassificationResponse,
    BatchBloomClassificationRequest,
    BloomUpdateResponse,
    EmbeddingResponse,
    BatchEmbeddingRequest
)
from src.services.question_nlp_service import QuestionNLPService
from src.services.bloom_taxonomy_classifier import BloomTaxonomyClassifier
from src.services.question_variation_service import QuestionVariationService

router = APIRouter(prefix="/question-nlp", tags=["Question NLP"])


@router.post("/embeddings/generate", response_model=EmbeddingResponse)
def generate_question_embedding(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionNLPService(db)
    embedding = service.generate_embedding(question_id)
    
    if not embedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    return embedding


@router.post("/embeddings/batch-generate")
def batch_generate_embeddings(
    request: BatchEmbeddingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionNLPService(db)
    embeddings = service.batch_generate_embeddings(
        question_ids=request.question_ids,
        batch_size=request.batch_size
    )
    
    return {
        'status': 'success',
        'embeddings_generated': len(embeddings),
        'question_ids': [e.question_id for e in embeddings]
    }


@router.post("/similarity/find", response_model=List[SimilarQuestionResponse])
def find_similar_questions(
    request: QuestionSimilarityRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionNLPService(db)
    similar_questions = service.find_similar_questions(
        question_id=request.question_id,
        top_k=request.top_k,
        min_similarity=request.min_similarity,
        same_subject_only=request.same_subject_only
    )
    
    return similar_questions


@router.get("/similarity/calculate")
def calculate_similarity(
    question_id1: int,
    question_id2: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionNLPService(db)
    similarity = service.calculate_similarity(question_id1, question_id2)
    
    if similarity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both questions not found or embeddings not generated"
        )
    
    return {
        'question_id1': question_id1,
        'question_id2': question_id2,
        'similarity_score': similarity
    }


@router.post("/clustering/cluster", response_model=ClusteringResponse)
def cluster_questions(
    request: ClusteringRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionNLPService(db)
    result = service.cluster_questions(
        grade_id=request.grade_id,
        subject_id=request.subject_id,
        institution_id=current_user.institution_id,
        min_cluster_size=request.min_cluster_size,
        min_samples=request.min_samples
    )
    
    return result


@router.get("/clustering/cluster/{cluster_id}", response_model=ClusterInfoResponse)
def get_cluster_info(
    cluster_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionNLPService(db)
    cluster_info = service.get_cluster_info(cluster_id)
    
    if not cluster_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found"
        )
    
    return cluster_info


@router.get("/clustering/list", response_model=List[ClusterSummaryResponse])
def list_clusters(
    grade_id: int,
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionNLPService(db)
    clusters = service.get_all_clusters(
        institution_id=current_user.institution_id,
        grade_id=grade_id,
        subject_id=subject_id
    )
    
    return clusters


@router.post("/variations/generate", response_model=List[VariationResponse])
def generate_question_variations(
    request: VariationGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionVariationService(db)
    variations = service.generate_multiple_variations(
        original_question_id=request.question_id,
        variation_types=request.variation_types,
        user_id=current_user.id
    )
    
    return variations


@router.get("/variations/question/{question_id}", response_model=List[VariationResponse])
def get_question_variations(
    question_id: int,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionVariationService(db)
    variations = service.get_variations_for_question(
        question_id=question_id,
        active_only=active_only
    )
    
    return variations


@router.post("/variations/{variation_id}/verify", response_model=VariationResponse)
def verify_variation(
    variation_id: int,
    is_verified: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuestionVariationService(db)
    variation = service.verify_variation(
        variation_id=variation_id,
        verified_by=current_user.id,
        is_verified=is_verified
    )
    
    if not variation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variation not found"
        )
    
    return variation


@router.post("/bloom-taxonomy/classify", response_model=BloomClassificationResponse)
def classify_bloom_taxonomy(
    request: BloomClassificationRequest,
    current_user: User = Depends(get_current_user)
):
    classifier = BloomTaxonomyClassifier()
    result = classifier.classify_question(request.question_text)
    
    return result


@router.post("/bloom-taxonomy/batch-classify")
def batch_classify_bloom_taxonomy(
    request: BatchBloomClassificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    classifier = BloomTaxonomyClassifier()
    results = []
    
    for question_id in request.question_ids:
        result = classifier.update_question_bloom_level(
            db=db,
            question_id=question_id,
            auto_classify=request.auto_update
        )
        
        if result:
            results.append(result)
    
    return {
        'status': 'success',
        'total_processed': len(results),
        'results': results
    }


@router.post("/bloom-taxonomy/update/{question_id}", response_model=BloomUpdateResponse)
def update_question_bloom_level(
    question_id: int,
    auto_classify: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    classifier = BloomTaxonomyClassifier()
    result = classifier.update_question_bloom_level(
        db=db,
        question_id=question_id,
        auto_classify=auto_classify
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    return result
