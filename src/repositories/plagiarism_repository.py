from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc

from src.models.plagiarism import (
    PlagiarismCheck, PlagiarismResult, PlagiarismMatchSegment,
    CodeASTFingerprint, CitationPattern, PlagiarismPrivacyConsent,
    PlagiarismCheckStatus, ReviewDecision
)


class PlagiarismCheckRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, **kwargs) -> PlagiarismCheck:
        check = PlagiarismCheck(**kwargs)
        self.db.add(check)
        self.db.flush()
        return check
    
    def get_by_id(self, check_id: int) -> Optional[PlagiarismCheck]:
        return self.db.query(PlagiarismCheck).filter(
            PlagiarismCheck.id == check_id
        ).first()
    
    def list_by_assignment(
        self,
        assignment_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[PlagiarismCheck]:
        return self.db.query(PlagiarismCheck).filter(
            PlagiarismCheck.assignment_id == assignment_id
        ).order_by(desc(PlagiarismCheck.created_at)).offset(skip).limit(limit).all()
    
    def list_by_institution(
        self,
        institution_id: int,
        status: Optional[PlagiarismCheckStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[PlagiarismCheck]:
        query = self.db.query(PlagiarismCheck).filter(
            PlagiarismCheck.institution_id == institution_id
        )
        
        if status:
            query = query.filter(PlagiarismCheck.status == status)
        
        return query.order_by(desc(PlagiarismCheck.created_at)).offset(skip).limit(limit).all()
    
    def update(self, check: PlagiarismCheck, **kwargs) -> PlagiarismCheck:
        for key, value in kwargs.items():
            setattr(check, key, value)
        self.db.flush()
        return check
    
    def delete(self, check: PlagiarismCheck) -> None:
        self.db.delete(check)
        self.db.flush()


class PlagiarismResultRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, **kwargs) -> PlagiarismResult:
        result = PlagiarismResult(**kwargs)
        self.db.add(result)
        self.db.flush()
        return result
    
    def get_by_id(self, result_id: int) -> Optional[PlagiarismResult]:
        return self.db.query(PlagiarismResult).filter(
            PlagiarismResult.id == result_id
        ).first()
    
    def list_by_check(
        self,
        check_id: int,
        min_similarity: Optional[float] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[PlagiarismResult]:
        query = self.db.query(PlagiarismResult).filter(
            PlagiarismResult.check_id == check_id
        )
        
        if min_similarity is not None:
            query = query.filter(PlagiarismResult.similarity_score >= min_similarity)
        
        return query.order_by(desc(PlagiarismResult.similarity_score)).offset(skip).limit(limit).all()
    
    def list_by_submission(
        self,
        submission_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[PlagiarismResult]:
        return self.db.query(PlagiarismResult).filter(
            or_(
                PlagiarismResult.submission_id == submission_id,
                PlagiarismResult.matched_submission_id == submission_id
            )
        ).order_by(desc(PlagiarismResult.similarity_score)).offset(skip).limit(limit).all()
    
    def list_flagged(
        self,
        check_id: int,
        min_similarity: float = 0.7,
        exclude_false_positives: bool = True
    ) -> List[PlagiarismResult]:
        query = self.db.query(PlagiarismResult).filter(
            PlagiarismResult.check_id == check_id,
            PlagiarismResult.similarity_score >= min_similarity
        )
        
        if exclude_false_positives:
            query = query.filter(PlagiarismResult.is_false_positive == False)
        
        return query.order_by(desc(PlagiarismResult.similarity_score)).all()
    
    def list_pending_review(
        self,
        check_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[PlagiarismResult]:
        return self.db.query(PlagiarismResult).filter(
            PlagiarismResult.check_id == check_id,
            PlagiarismResult.review_status.is_(None)
        ).order_by(desc(PlagiarismResult.similarity_score)).offset(skip).limit(limit).all()
    
    def update(self, result: PlagiarismResult, **kwargs) -> PlagiarismResult:
        for key, value in kwargs.items():
            setattr(result, key, value)
        self.db.flush()
        return result
    
    def delete(self, result: PlagiarismResult) -> None:
        self.db.delete(result)
        self.db.flush()


class MatchSegmentRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, **kwargs) -> PlagiarismMatchSegment:
        segment = PlagiarismMatchSegment(**kwargs)
        self.db.add(segment)
        self.db.flush()
        return segment
    
    def list_by_result(self, result_id: int) -> List[PlagiarismMatchSegment]:
        return self.db.query(PlagiarismMatchSegment).filter(
            PlagiarismMatchSegment.result_id == result_id
        ).order_by(PlagiarismMatchSegment.source_start).all()


class CodeASTFingerprintRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, **kwargs) -> CodeASTFingerprint:
        fingerprint = CodeASTFingerprint(**kwargs)
        self.db.add(fingerprint)
        self.db.flush()
        return fingerprint
    
    def get_by_submission(self, submission_id: int) -> Optional[CodeASTFingerprint]:
        return self.db.query(CodeASTFingerprint).filter(
            CodeASTFingerprint.submission_id == submission_id
        ).first()
    
    def find_similar_fingerprints(
        self,
        structure_hash: str,
        limit: int = 100
    ) -> List[CodeASTFingerprint]:
        return self.db.query(CodeASTFingerprint).filter(
            CodeASTFingerprint.structure_hash == structure_hash
        ).limit(limit).all()


class CitationPatternRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, **kwargs) -> CitationPattern:
        citation = CitationPattern(**kwargs)
        self.db.add(citation)
        self.db.flush()
        return citation
    
    def list_by_submission(self, submission_id: int) -> List[CitationPattern]:
        return self.db.query(CitationPattern).filter(
            CitationPattern.submission_id == submission_id
        ).order_by(CitationPattern.start_position).all()


class PrivacyConsentRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, **kwargs) -> PlagiarismPrivacyConsent:
        consent = PlagiarismPrivacyConsent(**kwargs)
        self.db.add(consent)
        self.db.flush()
        return consent
    
    def get_by_institution(self, institution_id: int) -> Optional[PlagiarismPrivacyConsent]:
        return self.db.query(PlagiarismPrivacyConsent).filter(
            PlagiarismPrivacyConsent.institution_id == institution_id,
            PlagiarismPrivacyConsent.is_active == True
        ).first()
    
    def update(self, consent: PlagiarismPrivacyConsent, **kwargs) -> PlagiarismPrivacyConsent:
        for key, value in kwargs.items():
            setattr(consent, key, value)
        self.db.flush()
        return consent
