from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from src.models.plagiarism import PlagiarismResult, PlagiarismMatchSegment
from src.models.assignment import Submission
from src.repositories.plagiarism_repository import (
    PlagiarismResultRepository, MatchSegmentRepository
)


class PlagiarismVisualizationService:
    """Service for creating plagiarism visualization data"""
    
    def __init__(self, db: Session):
        self.db = db
        self.result_repo = PlagiarismResultRepository(db)
        self.segment_repo = MatchSegmentRepository(db)
    
    def get_result_with_details(
        self,
        result_id: int,
        institution_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get plagiarism result with full details"""
        result = self.result_repo.get_by_id(result_id)
        
        if not result:
            return None
        
        check = result.check
        if check.institution_id != institution_id:
            return None
        
        matched_segments = self.segment_repo.list_by_result(result_id)
        
        submission_info = self._get_submission_info(
            result.submission_id,
            check.anonymize_cross_institution and result.is_cross_institution
        )
        
        matched_submission_info = None
        if result.matched_submission_id:
            matched_submission_info = self._get_submission_info(
                result.matched_submission_id,
                check.anonymize_cross_institution and result.is_cross_institution
            )
        
        return {
            **result.__dict__,
            'matched_segments': [seg.__dict__ for seg in matched_segments],
            'submission_info': submission_info,
            'matched_submission_info': matched_submission_info
        }
    
    def _get_submission_info(
        self,
        submission_id: int,
        anonymize: bool = False
    ) -> Dict[str, Any]:
        """Get submission information"""
        submission = self.db.query(Submission).filter(
            Submission.id == submission_id
        ).first()
        
        if not submission:
            return {}
        
        if anonymize:
            return {
                'submission_id': submission.id,
                'assignment_id': submission.assignment_id,
                'student_name': f"Student {submission.student_id}",
                'institution': "External Institution",
                'submitted_at': submission.submitted_at
            }
        
        student = submission.student
        user = student.user if student else None
        
        return {
            'submission_id': submission.id,
            'assignment_id': submission.assignment_id,
            'student_id': submission.student_id,
            'student_name': f"{user.first_name} {user.last_name}" if user else "Unknown",
            'submitted_at': submission.submitted_at,
            'marks_obtained': submission.marks_obtained
        }
    
    def create_visualization(
        self,
        result_id: int,
        institution_id: int
    ) -> Optional[Dict[str, Any]]:
        """Create side-by-side comparison visualization"""
        result = self.result_repo.get_by_id(result_id)
        
        if not result:
            return None
        
        check = result.check
        if check.institution_id != institution_id:
            return None
        
        matched_segments = self.segment_repo.list_by_result(result_id)
        
        source_submission = self.db.query(Submission).filter(
            Submission.id == result.submission_id
        ).first()
        
        target_submission = None
        if result.matched_submission_id:
            target_submission = self.db.query(Submission).filter(
                Submission.id == result.matched_submission_id
            ).first()
        
        if not source_submission:
            return None
        
        source_text = source_submission.submission_text or ""
        target_text = target_submission.submission_text if target_submission else ""
        
        source_highlighted = self._highlight_text(
            source_text,
            [(seg.source_start, seg.source_end) for seg in matched_segments]
        )
        
        target_highlighted = self._highlight_text(
            target_text,
            [(seg.match_start, seg.match_end) for seg in matched_segments]
        )
        
        return {
            'submission_id': result.submission_id,
            'matched_submission_id': result.matched_submission_id,
            'similarity_score': result.similarity_score,
            'total_segments': len(matched_segments),
            'matched_segments': [
                {
                    'id': seg.id,
                    'source_start': seg.source_start,
                    'source_end': seg.source_end,
                    'source_text': seg.source_text,
                    'match_start': seg.match_start,
                    'match_end': seg.match_end,
                    'match_text': seg.match_text,
                    'segment_similarity': seg.segment_similarity,
                    'segment_length': seg.segment_length,
                    'is_code_segment': seg.is_code_segment,
                    'is_citation': seg.is_citation
                }
                for seg in matched_segments
            ],
            'content_comparison': {
                'source': {
                    'text': source_text,
                    'highlighted': source_highlighted,
                    'length': len(source_text),
                    'matched_percentage': (
                        sum(seg.segment_length for seg in matched_segments) / len(source_text) * 100
                        if len(source_text) > 0 else 0
                    )
                },
                'target': {
                    'text': target_text,
                    'highlighted': target_highlighted,
                    'length': len(target_text),
                    'matched_percentage': (
                        sum(seg.segment_length for seg in matched_segments) / len(target_text) * 100
                        if len(target_text) > 0 else 0
                    )
                }
            }
        }
    
    def _highlight_text(
        self,
        text: str,
        ranges: List[tuple]
    ) -> List[Dict[str, Any]]:
        """Create highlighted text segments"""
        if not text:
            return []
        
        segments = []
        last_end = 0
        
        sorted_ranges = sorted(ranges, key=lambda x: x[0])
        
        for start, end in sorted_ranges:
            if start > last_end:
                segments.append({
                    'type': 'normal',
                    'text': text[last_end:start],
                    'start': last_end,
                    'end': start
                })
            
            segments.append({
                'type': 'highlighted',
                'text': text[start:end],
                'start': start,
                'end': end
            })
            
            last_end = max(last_end, end)
        
        if last_end < len(text):
            segments.append({
                'type': 'normal',
                'text': text[last_end:],
                'start': last_end,
                'end': len(text)
            })
        
        return segments
    
    def create_comparison_matrix(
        self,
        assignment_id: int,
        min_similarity: float = 0.5
    ) -> Dict[str, Any]:
        """Create similarity matrix for all submissions"""
        from src.models.plagiarism import PlagiarismCheck, PlagiarismCheckStatus
        
        check = self.db.query(PlagiarismCheck).filter(
            PlagiarismCheck.assignment_id == assignment_id,
            PlagiarismCheck.status == PlagiarismCheckStatus.COMPLETED
        ).order_by(PlagiarismCheck.completed_at.desc()).first()
        
        if not check:
            return {'error': 'No completed plagiarism check found'}
        
        results = self.result_repo.list_by_check(check.id, min_similarity)
        
        submissions = set()
        for result in results:
            submissions.add(result.submission_id)
            if result.matched_submission_id:
                submissions.add(result.matched_submission_id)
        
        submissions = sorted(list(submissions))
        
        matrix = {}
        for sub_id in submissions:
            matrix[sub_id] = {}
            for other_id in submissions:
                if sub_id == other_id:
                    matrix[sub_id][other_id] = 1.0
                else:
                    matrix[sub_id][other_id] = 0.0
        
        for result in results:
            if result.matched_submission_id:
                matrix[result.submission_id][result.matched_submission_id] = result.similarity_score
                matrix[result.matched_submission_id][result.submission_id] = result.similarity_score
        
        submission_info = {}
        for sub_id in submissions:
            info = self._get_submission_info(sub_id, False)
            submission_info[sub_id] = info
        
        return {
            'assignment_id': assignment_id,
            'check_id': check.id,
            'submissions': submissions,
            'matrix': matrix,
            'submission_info': submission_info,
            'min_similarity': min_similarity
        }
