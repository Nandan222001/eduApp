from typing import Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
import logging

from src.models.doubt import DoubtPost, DoubtPriority, DoubtDifficulty
from src.models.student import Student

logger = logging.getLogger(__name__)


class DoubtPriorityService:
    def __init__(self):
        self.urgency_weights = {
            'time_since_created': 0.25,
            'urgency_keywords': 0.20,
            'unanswered_duration': 0.25,
            'student_history': 0.15,
            'engagement': 0.15
        }
        
        self.difficulty_weights = {
            'explicit_difficulty': 0.30,
            'question_complexity': 0.25,
            'subject_difficulty': 0.20,
            'previous_attempts': 0.15,
            'description_length': 0.10
        }
    
    def calculate_priority_score(
        self,
        db: Session,
        doubt_id: int
    ) -> Dict:
        doubt = db.query(DoubtPost).filter(DoubtPost.id == doubt_id).first()
        
        if not doubt:
            return {'success': False, 'message': 'Doubt not found'}
        
        urgency_score = self._calculate_urgency_score(db, doubt)
        difficulty_score = self._calculate_difficulty_score(db, doubt)
        
        priority_score = (urgency_score * 0.6) + (difficulty_score * 0.4)
        
        priority = self._determine_priority_level(priority_score, urgency_score)
        
        doubt.urgency_score = urgency_score
        doubt.difficulty_score = difficulty_score
        doubt.priority_score = priority_score
        doubt.priority = priority
        
        db.commit()
        db.refresh(doubt)
        
        return {
            'success': True,
            'priority': priority.value,
            'priority_score': priority_score,
            'urgency_score': urgency_score,
            'difficulty_score': difficulty_score
        }
    
    def _calculate_urgency_score(
        self,
        db: Session,
        doubt: DoubtPost
    ) -> float:
        score = 0.0
        
        time_since_created = datetime.utcnow() - doubt.created_at
        hours_passed = time_since_created.total_seconds() / 3600
        
        if hours_passed < 2:
            time_score = 0.3
        elif hours_passed < 6:
            time_score = 0.5
        elif hours_passed < 12:
            time_score = 0.7
        elif hours_passed < 24:
            time_score = 0.85
        else:
            time_score = 1.0
        
        score += time_score * self.urgency_weights['time_since_created']
        
        urgency_keywords = [
            'urgent', 'asap', 'immediately', 'today', 'tomorrow',
            'exam tomorrow', 'test tomorrow', 'exam next week', 'deadline'
        ]
        combined_text = f"{doubt.title} {doubt.description}".lower()
        keyword_count = sum(1 for keyword in urgency_keywords if keyword in combined_text)
        keyword_score = min(keyword_count * 0.3, 1.0)
        score += keyword_score * self.urgency_weights['urgency_keywords']
        
        if doubt.status == 'unanswered':
            unanswered_hours = (datetime.utcnow() - doubt.created_at).total_seconds() / 3600
            if unanswered_hours > 48:
                unanswered_score = 1.0
            elif unanswered_hours > 24:
                unanswered_score = 0.8
            elif unanswered_hours > 12:
                unanswered_score = 0.6
            else:
                unanswered_score = 0.3
        else:
            unanswered_score = 0.0
        
        score += unanswered_score * self.urgency_weights['unanswered_duration']
        
        student_doubts = db.query(DoubtPost).filter(
            DoubtPost.user_id == doubt.user_id,
            DoubtPost.institution_id == doubt.institution_id,
            DoubtPost.created_at >= datetime.utcnow() - timedelta(days=7)
        ).count()
        
        if student_doubts > 10:
            student_score = 0.9
        elif student_doubts > 5:
            student_score = 0.7
        elif student_doubts > 2:
            student_score = 0.5
        else:
            student_score = 0.3
        
        score += student_score * self.urgency_weights['student_history']
        
        engagement_score = min((doubt.view_count * 0.05) + (doubt.upvote_count * 0.15), 1.0)
        score += engagement_score * self.urgency_weights['engagement']
        
        return round(score, 3)
    
    def _calculate_difficulty_score(
        self,
        db: Session,
        doubt: DoubtPost
    ) -> float:
        score = 0.0
        
        if doubt.difficulty:
            difficulty_map = {
                'easy': 0.2,
                'medium': 0.5,
                'hard': 0.8,
                'expert': 1.0
            }
            explicit_score = difficulty_map.get(doubt.difficulty.value, 0.5)
        else:
            explicit_score = 0.5
        
        score += explicit_score * self.difficulty_weights['explicit_difficulty']
        
        description_length = len(doubt.description)
        if description_length > 1000:
            length_score = 0.9
        elif description_length > 500:
            length_score = 0.7
        elif description_length > 200:
            length_score = 0.5
        else:
            length_score = 0.3
        
        score += length_score * self.difficulty_weights['description_length']
        
        complex_keywords = [
            'prove', 'derive', 'explain why', 'compare', 'analyze', 'evaluate',
            'synthesis', 'theorem', 'proof', 'complex', 'advanced', 'difficult'
        ]
        combined_text = f"{doubt.title} {doubt.description}".lower()
        complexity_count = sum(1 for keyword in complex_keywords if keyword in combined_text)
        complexity_score = min(complexity_count * 0.25, 1.0)
        score += complexity_score * self.difficulty_weights['question_complexity']
        
        subject_difficulty_map = {
            'Physics': 0.8,
            'Chemistry': 0.8,
            'Mathematics': 0.9,
            'Biology': 0.6,
            'Computer Science': 0.7,
            'English': 0.5,
            'History': 0.4,
            'Geography': 0.4
        }
        
        subject_score = 0.5
        if doubt.subject:
            subject_score = subject_difficulty_map.get(doubt.subject.name, 0.5)
        
        score += subject_score * self.difficulty_weights['subject_difficulty']
        
        similar_doubts = db.query(DoubtPost).filter(
            DoubtPost.subject_id == doubt.subject_id,
            DoubtPost.chapter_id == doubt.chapter_id,
            DoubtPost.institution_id == doubt.institution_id,
            DoubtPost.id != doubt.id
        ).limit(10).all()
        
        if similar_doubts:
            avg_answers = sum(d.answer_count for d in similar_doubts) / len(similar_doubts)
            if avg_answers < 1:
                attempts_score = 0.9
            elif avg_answers < 2:
                attempts_score = 0.6
            else:
                attempts_score = 0.3
        else:
            attempts_score = 0.5
        
        score += attempts_score * self.difficulty_weights['previous_attempts']
        
        return round(score, 3)
    
    def _determine_priority_level(
        self,
        priority_score: float,
        urgency_score: float
    ) -> DoubtPriority:
        if urgency_score > 0.8 or priority_score > 0.85:
            return DoubtPriority.URGENT
        elif priority_score > 0.7:
            return DoubtPriority.HIGH
        elif priority_score > 0.4:
            return DoubtPriority.MEDIUM
        else:
            return DoubtPriority.LOW
    
    def get_prioritized_doubts(
        self,
        db: Session,
        institution_id: int,
        status: Optional[str] = None,
        subject_id: Optional[int] = None,
        limit: int = 50
    ) -> list:
        query = db.query(DoubtPost).filter(
            DoubtPost.institution_id == institution_id
        )
        
        if status:
            query = query.filter(DoubtPost.status == status)
        
        if subject_id:
            query = query.filter(DoubtPost.subject_id == subject_id)
        
        doubts = query.order_by(
            DoubtPost.priority_score.desc(),
            DoubtPost.created_at.desc()
        ).limit(limit).all()
        
        return doubts
    
    def recalculate_priorities(
        self,
        db: Session,
        institution_id: int,
        batch_size: int = 100
    ) -> Dict[str, int]:
        doubts = db.query(DoubtPost).filter(
            DoubtPost.institution_id == institution_id,
            DoubtPost.status.in_(['unanswered', 'answered'])
        ).limit(batch_size).all()
        
        successful = 0
        failed = 0
        
        for doubt in doubts:
            try:
                self.calculate_priority_score(db, doubt.id)
                successful += 1
            except Exception as e:
                logger.error(f"Failed to calculate priority for doubt {doubt.id}: {e}")
                failed += 1
                continue
        
        return {
            'successful': successful,
            'failed': failed,
            'total_processed': successful + failed
        }
