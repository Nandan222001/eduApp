from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
import logging

from src.models.doubt import DoubtPost, TeacherDoubtStats, DoubtAnswer
from src.models.teacher import Teacher, TeacherSubject
from src.models.academic import Subject

logger = logging.getLogger(__name__)


class DoubtTeacherAssignmentService:
    def __init__(self):
        self.assignment_weights = {
            'expertise': 0.35,
            'workload': 0.25,
            'availability': 0.20,
            'performance': 0.15,
            'subject_match': 0.05
        }
    
    def assign_teacher_to_doubt(
        self,
        db: Session,
        doubt_id: int,
        institution_id: int,
        auto_assign: bool = True
    ) -> Dict:
        doubt = db.query(DoubtPost).filter(
            DoubtPost.id == doubt_id,
            DoubtPost.institution_id == institution_id
        ).first()
        
        if not doubt:
            return {'success': False, 'message': 'Doubt not found'}
        
        if doubt.assigned_teacher_id and not auto_assign:
            return {
                'success': False,
                'message': 'Doubt already assigned to a teacher'
            }
        
        best_teacher = self._find_best_teacher(db, doubt)
        
        if not best_teacher:
            return {
                'success': False,
                'message': 'No suitable teacher found'
            }
        
        doubt.assigned_teacher_id = best_teacher['teacher_id']
        doubt.auto_assigned = auto_assign
        doubt.assignment_score = best_teacher['score']
        
        stats = self._get_or_create_teacher_stats(
            db, best_teacher['teacher_id'], institution_id, doubt.subject_id
        )
        stats.total_assigned += 1
        stats.active_doubts += 1
        stats.last_assigned_at = datetime.utcnow()
        
        db.commit()
        db.refresh(doubt)
        
        return {
            'success': True,
            'assigned_teacher_id': best_teacher['teacher_id'],
            'teacher_name': best_teacher['teacher_name'],
            'assignment_score': best_teacher['score'],
            'auto_assigned': auto_assign
        }
    
    def _find_best_teacher(
        self,
        db: Session,
        doubt: DoubtPost
    ) -> Optional[Dict]:
        if not doubt.subject_id:
            eligible_teachers = db.query(Teacher).filter(
                Teacher.institution_id == doubt.institution_id,
                Teacher.is_active == True
            ).all()
        else:
            eligible_teachers = db.query(Teacher).join(
                TeacherSubject,
                Teacher.id == TeacherSubject.teacher_id
            ).filter(
                Teacher.institution_id == doubt.institution_id,
                Teacher.is_active == True,
                TeacherSubject.subject_id == doubt.subject_id
            ).all()
        
        if not eligible_teachers:
            return None
        
        teacher_scores = []
        
        for teacher in eligible_teachers:
            score = self._calculate_teacher_score(db, teacher, doubt)
            teacher_scores.append({
                'teacher_id': teacher.id,
                'teacher_name': f"{teacher.first_name} {teacher.last_name}",
                'score': score,
                'teacher': teacher
            })
        
        teacher_scores.sort(key=lambda x: x['score'], reverse=True)
        
        return teacher_scores[0] if teacher_scores else None
    
    def _calculate_teacher_score(
        self,
        db: Session,
        teacher: Teacher,
        doubt: DoubtPost
    ) -> float:
        score = 0.0
        
        stats = self._get_or_create_teacher_stats(
            db, teacher.id, doubt.institution_id, doubt.subject_id
        )
        
        expertise_score = self._calculate_expertise_score(db, teacher, doubt, stats)
        score += expertise_score * self.assignment_weights['expertise']
        
        workload_score = self._calculate_workload_score(stats)
        score += workload_score * self.assignment_weights['workload']
        
        availability_score = self._calculate_availability_score(db, teacher, stats)
        score += availability_score * self.assignment_weights['availability']
        
        performance_score = self._calculate_performance_score(stats)
        score += performance_score * self.assignment_weights['performance']
        
        subject_match_score = self._calculate_subject_match_score(db, teacher, doubt)
        score += subject_match_score * self.assignment_weights['subject_match']
        
        return round(score, 3)
    
    def _calculate_expertise_score(
        self,
        db: Session,
        teacher: Teacher,
        doubt: DoubtPost,
        stats: 'TeacherDoubtStats'
    ) -> float:
        score = stats.expertise_score
        
        if teacher.specialization:
            specialization_lower = teacher.specialization.lower()
            if doubt.subject and doubt.subject.name.lower() in specialization_lower:
                score = min(score + 0.2, 1.0)
        
        if stats.total_answered > 50:
            score = min(score + 0.15, 1.0)
        elif stats.total_answered > 20:
            score = min(score + 0.10, 1.0)
        elif stats.total_answered > 10:
            score = min(score + 0.05, 1.0)
        
        if stats.total_accepted > 0 and stats.total_answered > 0:
            acceptance_rate = stats.total_accepted / stats.total_answered
            score = min(score + (acceptance_rate * 0.2), 1.0)
        
        return round(score, 3)
    
    def _calculate_workload_score(
        self,
        stats: 'TeacherDoubtStats'
    ) -> float:
        if stats.active_doubts == 0:
            return 1.0
        elif stats.active_doubts < 5:
            return 0.9
        elif stats.active_doubts < 10:
            return 0.7
        elif stats.active_doubts < 15:
            return 0.5
        elif stats.active_doubts < 20:
            return 0.3
        else:
            return 0.1
    
    def _calculate_availability_score(
        self,
        db: Session,
        teacher: Teacher,
        stats: 'TeacherDoubtStats'
    ) -> float:
        if not stats.last_assigned_at:
            return 1.0
        
        hours_since_assignment = (
            datetime.utcnow() - stats.last_assigned_at
        ).total_seconds() / 3600
        
        if hours_since_assignment > 24:
            return 1.0
        elif hours_since_assignment > 12:
            return 0.8
        elif hours_since_assignment > 6:
            return 0.6
        elif hours_since_assignment > 3:
            return 0.4
        else:
            return 0.2
    
    def _calculate_performance_score(
        self,
        stats: 'TeacherDoubtStats'
    ) -> float:
        score = 0.0
        
        if stats.avg_rating:
            score += (stats.avg_rating / 5.0) * 0.5
        else:
            score += 0.3
        
        if stats.avg_response_time_minutes:
            if stats.avg_response_time_minutes < 60:
                score += 0.3
            elif stats.avg_response_time_minutes < 180:
                score += 0.2
            elif stats.avg_response_time_minutes < 360:
                score += 0.1
            else:
                score += 0.05
        else:
            score += 0.15
        
        if stats.total_answered > 0:
            response_rate = stats.total_answered / stats.total_assigned
            score += response_rate * 0.2
        else:
            score += 0.1
        
        return round(min(score, 1.0), 3)
    
    def _calculate_subject_match_score(
        self,
        db: Session,
        teacher: Teacher,
        doubt: DoubtPost
    ) -> float:
        if not doubt.subject_id:
            return 0.5
        
        teacher_subject = db.query(TeacherSubject).filter(
            TeacherSubject.teacher_id == teacher.id,
            TeacherSubject.subject_id == doubt.subject_id
        ).first()
        
        if teacher_subject:
            return 1.0 if teacher_subject.is_primary else 0.8
        
        return 0.0
    
    def _get_or_create_teacher_stats(
        self,
        db: Session,
        teacher_id: int,
        institution_id: int,
        subject_id: Optional[int]
    ) -> TeacherDoubtStats:
        stats = db.query(TeacherDoubtStats).filter(
            TeacherDoubtStats.teacher_id == teacher_id,
            TeacherDoubtStats.subject_id == subject_id
        ).first()
        
        if not stats:
            stats = TeacherDoubtStats(
                teacher_id=teacher_id,
                institution_id=institution_id,
                subject_id=subject_id,
                expertise_score=0.5
            )
            db.add(stats)
            db.commit()
            db.refresh(stats)
        
        return stats
    
    def update_teacher_stats(
        self,
        db: Session,
        teacher_id: int,
        doubt: DoubtPost,
        action: str
    ) -> None:
        stats = self._get_or_create_teacher_stats(
            db, teacher_id, doubt.institution_id, doubt.subject_id
        )
        
        if action == 'answered':
            stats.total_answered += 1
            stats.active_doubts = max(0, stats.active_doubts - 1)
            
            if doubt.accepted_answer_id:
                answer = db.query(DoubtAnswer).filter(
                    DoubtAnswer.id == doubt.accepted_answer_id
                ).first()
                if answer and answer.user_id == teacher_id:
                    stats.total_accepted += 1
            
            stats.expertise_score = min(
                stats.expertise_score + 0.01,
                1.0
            )
        
        elif action == 'accepted':
            stats.total_accepted += 1
            stats.expertise_score = min(
                stats.expertise_score + 0.02,
                1.0
            )
        
        elif action == 'unassigned':
            stats.active_doubts = max(0, stats.active_doubts - 1)
        
        db.commit()
    
    def get_teacher_workload(
        self,
        db: Session,
        teacher_id: int,
        institution_id: int
    ) -> Dict:
        stats = db.query(TeacherDoubtStats).filter(
            TeacherDoubtStats.teacher_id == teacher_id,
            TeacherDoubtStats.institution_id == institution_id
        ).all()
        
        total_stats = {
            'total_assigned': sum(s.total_assigned for s in stats),
            'total_answered': sum(s.total_answered for s in stats),
            'total_accepted': sum(s.total_accepted for s in stats),
            'active_doubts': sum(s.active_doubts for s in stats),
            'avg_expertise_score': sum(s.expertise_score for s in stats) / len(stats) if stats else 0
        }
        
        subject_breakdown = [
            {
                'subject_id': s.subject_id,
                'total_assigned': s.total_assigned,
                'total_answered': s.total_answered,
                'active_doubts': s.active_doubts,
                'expertise_score': s.expertise_score
            }
            for s in stats
        ]
        
        return {
            'teacher_id': teacher_id,
            'total_stats': total_stats,
            'subject_breakdown': subject_breakdown
        }
    
    def reassign_doubt(
        self,
        db: Session,
        doubt_id: int,
        new_teacher_id: int,
        institution_id: int
    ) -> Dict:
        doubt = db.query(DoubtPost).filter(
            DoubtPost.id == doubt_id,
            DoubtPost.institution_id == institution_id
        ).first()
        
        if not doubt:
            return {'success': False, 'message': 'Doubt not found'}
        
        old_teacher_id = doubt.assigned_teacher_id
        
        if old_teacher_id:
            self.update_teacher_stats(db, old_teacher_id, doubt, 'unassigned')
        
        doubt.assigned_teacher_id = new_teacher_id
        doubt.auto_assigned = False
        
        stats = self._get_or_create_teacher_stats(
            db, new_teacher_id, institution_id, doubt.subject_id
        )
        stats.total_assigned += 1
        stats.active_doubts += 1
        stats.last_assigned_at = datetime.utcnow()
        
        db.commit()
        
        return {
            'success': True,
            'old_teacher_id': old_teacher_id,
            'new_teacher_id': new_teacher_id
        }
    
    def auto_assign_pending_doubts(
        self,
        db: Session,
        institution_id: int,
        batch_size: int = 50
    ) -> Dict[str, int]:
        pending_doubts = db.query(DoubtPost).filter(
            DoubtPost.institution_id == institution_id,
            DoubtPost.assigned_teacher_id.is_(None),
            DoubtPost.status == 'unanswered'
        ).order_by(
            desc(DoubtPost.priority_score)
        ).limit(batch_size).all()
        
        successful = 0
        failed = 0
        
        for doubt in pending_doubts:
            try:
                result = self.assign_teacher_to_doubt(
                    db, doubt.id, institution_id, auto_assign=True
                )
                if result['success']:
                    successful += 1
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Failed to assign teacher to doubt {doubt.id}: {e}")
                failed += 1
                continue
        
        return {
            'successful': successful,
            'failed': failed,
            'total_processed': successful + failed
        }
