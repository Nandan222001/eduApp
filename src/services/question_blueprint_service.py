import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from collections import Counter

from src.models.previous_year_papers import (
    QuestionBank,
    QuestionBlueprint,
    Board,
    QuestionType,
    DifficultyLevel,
    BloomTaxonomyLevel,
    PreviousYearPaper,
    TopicPrediction
)
from src.models.academic import Chapter


class QuestionBlueprintService:
    def __init__(self, db: Session):
        self.db = db
    
    def analyze_historical_patterns(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        year_start: Optional[int] = None,
        year_end: Optional[int] = None
    ) -> Dict[str, Any]:
        current_year = datetime.now().year
        year_end = year_end or current_year
        year_start = year_start or (year_end - 5)
        
        papers = self.db.query(PreviousYearPaper).filter(
            and_(
                PreviousYearPaper.institution_id == institution_id,
                PreviousYearPaper.board == board,
                PreviousYearPaper.grade_id == grade_id,
                PreviousYearPaper.subject_id == subject_id,
                PreviousYearPaper.year >= year_start,
                PreviousYearPaper.year <= year_end
            )
        ).all()
        
        if not papers:
            return {
                'status': 'no_data',
                'message': 'No historical papers found for analysis'
            }
        
        paper_ids = [p.id for p in papers]
        
        questions = self.db.query(QuestionBank).filter(
            QuestionBank.paper_id.in_(paper_ids)
        ).all()
        
        total_marks_list = [p.total_marks for p in papers if p.total_marks]
        avg_total_marks = sum(total_marks_list) / len(total_marks_list) if total_marks_list else 100
        
        duration_list = [p.duration_minutes for p in papers if p.duration_minutes]
        avg_duration = sum(duration_list) / len(duration_list) if duration_list else 180
        
        difficulty_counts = Counter([q.difficulty_level.value for q in questions])
        total_questions = len(questions)
        difficulty_distribution = {
            level: (count / total_questions * 100) if total_questions > 0 else 0
            for level, count in difficulty_counts.items()
        }
        
        bloom_counts = Counter([q.bloom_taxonomy_level.value for q in questions])
        bloom_distribution = {
            level: (count / total_questions * 100) if total_questions > 0 else 0
            for level, count in bloom_counts.items()
        }
        
        type_counts = Counter([q.question_type.value for q in questions])
        type_distribution = {
            qtype: (count / total_questions * 100) if total_questions > 0 else 0
            for qtype, count in type_counts.items()
        }
        
        chapter_marks = {}
        for question in questions:
            if question.chapter_id and question.marks:
                chapter_marks[question.chapter_id] = chapter_marks.get(question.chapter_id, 0) + question.marks
        
        total_chapter_marks = sum(chapter_marks.values())
        chapter_weightage = {}
        
        for chapter_id, marks in chapter_marks.items():
            chapter = self.db.query(Chapter).filter(Chapter.id == chapter_id).first()
            if chapter:
                chapter_weightage[chapter.name] = {
                    'marks': marks,
                    'percentage': (marks / total_chapter_marks * 100) if total_chapter_marks > 0 else 0
                }
        
        return {
            'status': 'success',
            'papers_analyzed': len(papers),
            'questions_analyzed': total_questions,
            'year_range': f"{year_start}-{year_end}",
            'avg_total_marks': int(avg_total_marks),
            'avg_duration_minutes': int(avg_duration),
            'difficulty_distribution': difficulty_distribution,
            'bloom_taxonomy_distribution': bloom_distribution,
            'question_type_distribution': type_distribution,
            'chapter_weightage': chapter_weightage
        }
    
    def create_blueprint(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        blueprint_name: str,
        total_marks: int,
        duration_minutes: int,
        difficulty_distribution: Dict[str, float],
        bloom_taxonomy_distribution: Dict[str, float],
        question_type_distribution: Dict[str, float],
        chapter_weightage: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> QuestionBlueprint:
        blueprint = QuestionBlueprint(
            institution_id=institution_id,
            blueprint_name=blueprint_name,
            description=description,
            board=board,
            grade_id=grade_id,
            subject_id=subject_id,
            total_marks=total_marks,
            duration_minutes=duration_minutes,
            difficulty_distribution=json.dumps(difficulty_distribution),
            bloom_taxonomy_distribution=json.dumps(bloom_taxonomy_distribution),
            question_type_distribution=json.dumps(question_type_distribution),
            chapter_weightage=json.dumps(chapter_weightage) if chapter_weightage else None,
            created_by=user_id
        )
        
        self.db.add(blueprint)
        self.db.commit()
        self.db.refresh(blueprint)
        
        return blueprint
    
    def create_blueprint_from_analysis(
        self,
        institution_id: int,
        board: Board,
        grade_id: int,
        subject_id: int,
        blueprint_name: str,
        description: Optional[str] = None,
        user_id: Optional[int] = None,
        year_start: Optional[int] = None,
        year_end: Optional[int] = None
    ) -> QuestionBlueprint:
        analysis = self.analyze_historical_patterns(
            institution_id, board, grade_id, subject_id, year_start, year_end
        )
        
        if analysis['status'] != 'success':
            raise ValueError(f"Cannot create blueprint: {analysis.get('message', 'Analysis failed')}")
        
        return self.create_blueprint(
            institution_id=institution_id,
            board=board,
            grade_id=grade_id,
            subject_id=subject_id,
            blueprint_name=blueprint_name,
            total_marks=analysis['avg_total_marks'],
            duration_minutes=analysis['avg_duration_minutes'],
            difficulty_distribution=analysis['difficulty_distribution'],
            bloom_taxonomy_distribution=analysis['bloom_taxonomy_distribution'],
            question_type_distribution=analysis['question_type_distribution'],
            chapter_weightage=analysis['chapter_weightage'],
            description=description or f"Auto-generated blueprint based on {analysis['year_range']} analysis",
            user_id=user_id
        )
    
    def generate_question_paper_suggestions(
        self,
        blueprint_id: int,
        include_predictions: bool = True
    ) -> Dict[str, Any]:
        blueprint = self.db.query(QuestionBlueprint).filter(
            QuestionBlueprint.id == blueprint_id
        ).first()
        
        if not blueprint:
            return {'status': 'not_found'}
        
        difficulty_dist = json.loads(blueprint.difficulty_distribution)
        bloom_dist = json.loads(blueprint.bloom_taxonomy_distribution)
        type_dist = json.loads(blueprint.question_type_distribution)
        
        suggestions = []
        
        for diff_level, diff_percentage in difficulty_dist.items():
            target_marks = int((diff_percentage / 100) * blueprint.total_marks)
            
            for bloom_level, bloom_percentage in bloom_dist.items():
                bloom_marks = int((bloom_percentage / 100) * target_marks)
                
                if bloom_marks < 1:
                    continue
                
                query = self.db.query(QuestionBank).filter(
                    and_(
                        QuestionBank.institution_id == blueprint.institution_id,
                        QuestionBank.grade_id == blueprint.grade_id,
                        QuestionBank.subject_id == blueprint.subject_id,
                        QuestionBank.difficulty_level == DifficultyLevel(diff_level),
                        QuestionBank.bloom_taxonomy_level == BloomTaxonomyLevel(bloom_level),
                        QuestionBank.is_active == True
                    )
                )
                
                if include_predictions:
                    predictions = self.db.query(TopicPrediction).filter(
                        and_(
                            TopicPrediction.institution_id == blueprint.institution_id,
                            TopicPrediction.board == blueprint.board,
                            TopicPrediction.grade_id == blueprint.grade_id,
                            TopicPrediction.subject_id == blueprint.subject_id,
                            TopicPrediction.is_due == True
                        )
                    ).order_by(TopicPrediction.probability_score.desc()).limit(10).all()
                    
                    high_priority_topics = [p.topic_id for p in predictions if p.topic_id]
                    
                    if high_priority_topics:
                        query = query.filter(QuestionBank.topic_id.in_(high_priority_topics))
                
                questions = query.limit(5).all()
                
                if questions:
                    suggestions.append({
                        'difficulty_level': diff_level,
                        'bloom_level': bloom_level,
                        'target_marks': bloom_marks,
                        'suggested_questions': [
                            {
                                'question_id': q.id,
                                'question_text': q.question_text[:200] + '...' if len(q.question_text) > 200 else q.question_text,
                                'marks': q.marks,
                                'question_type': q.question_type.value,
                                'topic_id': q.topic_id,
                                'chapter_id': q.chapter_id
                            }
                            for q in questions
                        ]
                    })
        
        return {
            'status': 'success',
            'blueprint_id': blueprint_id,
            'blueprint_name': blueprint.blueprint_name,
            'total_marks': blueprint.total_marks,
            'duration_minutes': blueprint.duration_minutes,
            'suggestions': suggestions,
            'total_suggestion_groups': len(suggestions)
        }
    
    def get_blueprint(self, blueprint_id: int) -> Optional[QuestionBlueprint]:
        return self.db.query(QuestionBlueprint).filter(
            QuestionBlueprint.id == blueprint_id
        ).first()
    
    def get_all_blueprints(
        self,
        institution_id: int,
        grade_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        active_only: bool = True
    ) -> List[QuestionBlueprint]:
        query = self.db.query(QuestionBlueprint).filter(
            QuestionBlueprint.institution_id == institution_id
        )
        
        if grade_id:
            query = query.filter(QuestionBlueprint.grade_id == grade_id)
        
        if subject_id:
            query = query.filter(QuestionBlueprint.subject_id == subject_id)
        
        if active_only:
            query = query.filter(QuestionBlueprint.is_active == True)
        
        return query.order_by(QuestionBlueprint.created_at.desc()).all()
    
    def update_blueprint(
        self,
        blueprint_id: int,
        **updates
    ) -> Optional[QuestionBlueprint]:
        blueprint = self.db.query(QuestionBlueprint).filter(
            QuestionBlueprint.id == blueprint_id
        ).first()
        
        if not blueprint:
            return None
        
        allowed_fields = [
            'blueprint_name', 'description', 'total_marks', 'duration_minutes',
            'difficulty_distribution', 'bloom_taxonomy_distribution',
            'question_type_distribution', 'chapter_weightage', 'is_active'
        ]
        
        for field, value in updates.items():
            if field in allowed_fields and value is not None:
                if field in ['difficulty_distribution', 'bloom_taxonomy_distribution', 
                           'question_type_distribution', 'chapter_weightage']:
                    value = json.dumps(value) if isinstance(value, dict) else value
                setattr(blueprint, field, value)
        
        blueprint.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(blueprint)
        
        return blueprint
    
    def delete_blueprint(self, blueprint_id: int) -> bool:
        blueprint = self.db.query(QuestionBlueprint).filter(
            QuestionBlueprint.id == blueprint_id
        ).first()
        
        if not blueprint:
            return False
        
        self.db.delete(blueprint)
        self.db.commit()
        
        return True
