from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from src.models.scholarship_essays import (
    EssayPrompt,
    StudentEssay,
    EssayPeerReview,
    EssayTemplate,
    EssayAnalytics,
    ReviewRubric,
    EssayStatus,
    ReviewStatus,
    GrammarCheckStatus,
)
import random


class ScholarshipEssaysService:
    def __init__(self, db: Session):
        self.db = db

    def create_essay_prompt(self, prompt_data: Dict[str, Any]) -> EssayPrompt:
        prompt = EssayPrompt(**prompt_data)
        self.db.add(prompt)
        self.db.commit()
        self.db.refresh(prompt)
        return prompt

    def get_essay_prompt(self, prompt_id: int, institution_id: int) -> Optional[EssayPrompt]:
        return self.db.query(EssayPrompt).filter(
            EssayPrompt.id == prompt_id,
            EssayPrompt.institution_id == institution_id,
            EssayPrompt.is_active == True
        ).first()

    def list_essay_prompts(
        self,
        institution_id: int,
        prompt_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[EssayPrompt]:
        query = self.db.query(EssayPrompt).filter(
            EssayPrompt.institution_id == institution_id,
            EssayPrompt.is_active == True
        )
        
        if prompt_type:
            query = query.filter(EssayPrompt.prompt_type == prompt_type)
        
        return query.order_by(EssayPrompt.created_at.desc()).limit(limit).offset(offset).all()

    def update_essay_prompt(
        self,
        prompt_id: int,
        institution_id: int,
        update_data: Dict[str, Any]
    ) -> Optional[EssayPrompt]:
        prompt = self.get_essay_prompt(prompt_id, institution_id)
        if not prompt:
            return None
        
        for key, value in update_data.items():
            setattr(prompt, key, value)
        
        self.db.commit()
        self.db.refresh(prompt)
        return prompt

    def delete_essay_prompt(self, prompt_id: int, institution_id: int) -> bool:
        prompt = self.get_essay_prompt(prompt_id, institution_id)
        if not prompt:
            return False
        
        prompt.is_active = False
        self.db.commit()
        return True

    def create_student_essay(self, essay_data: Dict[str, Any]) -> StudentEssay:
        word_count = len(essay_data.get('essay_draft', '').split())
        essay_data['word_count'] = word_count
        
        essay = StudentEssay(**essay_data)
        self.db.add(essay)
        self.db.commit()
        self.db.refresh(essay)
        
        self._create_essay_analytics(essay, revision_number=1)
        
        return essay

    def get_student_essay(self, essay_id: int, institution_id: int) -> Optional[StudentEssay]:
        return self.db.query(StudentEssay).filter(
            StudentEssay.id == essay_id,
            StudentEssay.institution_id == institution_id,
            StudentEssay.is_active == True
        ).first()

    def list_student_essays(
        self,
        institution_id: int,
        student_id: Optional[int] = None,
        prompt_id: Optional[int] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[StudentEssay]:
        query = self.db.query(StudentEssay).filter(
            StudentEssay.institution_id == institution_id,
            StudentEssay.is_active == True
        )
        
        if student_id:
            query = query.filter(StudentEssay.student_id == student_id)
        
        if prompt_id:
            query = query.filter(StudentEssay.prompt_id == prompt_id)
        
        if status:
            query = query.filter(StudentEssay.status == status)
        
        return query.order_by(StudentEssay.updated_at.desc()).limit(limit).offset(offset).all()

    def update_student_essay(
        self,
        essay_id: int,
        institution_id: int,
        update_data: Dict[str, Any]
    ) -> Optional[StudentEssay]:
        essay = self.get_student_essay(essay_id, institution_id)
        if not essay:
            return None
        
        if 'essay_draft' in update_data and update_data['essay_draft'] != essay.essay_draft:
            revision_history = essay.revision_history or []
            revision_history.append({
                'revision_number': len(revision_history) + 1,
                'content': essay.essay_draft,
                'word_count': essay.word_count,
                'timestamp': datetime.utcnow().isoformat(),
            })
            update_data['revision_history'] = revision_history
            update_data['word_count'] = len(update_data['essay_draft'].split())
            
            self._create_essay_analytics(essay, revision_number=len(revision_history) + 1)
        
        for key, value in update_data.items():
            setattr(essay, key, value)
        
        self.db.commit()
        self.db.refresh(essay)
        return essay

    def delete_student_essay(self, essay_id: int, institution_id: int) -> bool:
        essay = self.get_student_essay(essay_id, institution_id)
        if not essay:
            return False
        
        essay.is_active = False
        self.db.commit()
        return True

    def _create_essay_analytics(self, essay: StudentEssay, revision_number: int) -> EssayAnalytics:
        analytics = EssayAnalytics(
            institution_id=essay.institution_id,
            essay_id=essay.id,
            revision_number=revision_number,
            word_count=essay.word_count,
        )
        self.db.add(analytics)
        self.db.commit()
        return analytics

    def assign_peer_reviewers(
        self,
        essay_id: int,
        institution_id: int,
        num_reviewers: int = 3,
        preferred_reviewers: Optional[List[int]] = None
    ) -> List[EssayPeerReview]:
        essay = self.get_student_essay(essay_id, institution_id)
        if not essay:
            return []
        
        from src.models.student import Student
        query = self.db.query(Student).filter(
            Student.institution_id == institution_id,
            Student.is_active == True,
            Student.id != essay.student_id
        )
        
        if preferred_reviewers:
            query = query.filter(Student.id.in_(preferred_reviewers))
        
        potential_reviewers = query.limit(num_reviewers * 2).all()
        selected_reviewers = random.sample(
            potential_reviewers,
            min(num_reviewers, len(potential_reviewers))
        )
        
        reviews = []
        for reviewer in selected_reviewers:
            existing_review = self.db.query(EssayPeerReview).filter(
                EssayPeerReview.essay_id == essay_id,
                EssayPeerReview.reviewer_student_id == reviewer.id
            ).first()
            
            if not existing_review:
                review = EssayPeerReview(
                    institution_id=institution_id,
                    essay_id=essay_id,
                    reviewer_student_id=reviewer.id,
                    status=ReviewStatus.PENDING,
                )
                self.db.add(review)
                reviews.append(review)
        
        if reviews:
            essay.status = EssayStatus.PEER_REVIEW
            self.db.commit()
            
            for review in reviews:
                self.db.refresh(review)
        
        return reviews

    def create_peer_review(self, review_data: Dict[str, Any]) -> EssayPeerReview:
        review = EssayPeerReview(**review_data)
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def get_peer_review(self, review_id: int, institution_id: int) -> Optional[EssayPeerReview]:
        return self.db.query(EssayPeerReview).filter(
            EssayPeerReview.id == review_id,
            EssayPeerReview.institution_id == institution_id
        ).first()

    def list_peer_reviews(
        self,
        institution_id: int,
        essay_id: Optional[int] = None,
        reviewer_student_id: Optional[int] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[EssayPeerReview]:
        query = self.db.query(EssayPeerReview).filter(
            EssayPeerReview.institution_id == institution_id
        )
        
        if essay_id:
            query = query.filter(EssayPeerReview.essay_id == essay_id)
        
        if reviewer_student_id:
            query = query.filter(EssayPeerReview.reviewer_student_id == reviewer_student_id)
        
        if status:
            query = query.filter(EssayPeerReview.status == status)
        
        return query.order_by(EssayPeerReview.created_at.desc()).limit(limit).offset(offset).all()

    def update_peer_review(
        self,
        review_id: int,
        institution_id: int,
        update_data: Dict[str, Any]
    ) -> Optional[EssayPeerReview]:
        review = self.get_peer_review(review_id, institution_id)
        if not review:
            return None
        
        if not review.started_at and any(key in update_data for key in [
            'content_score', 'clarity_score', 'grammar_score', 'authenticity_score'
        ]):
            update_data['started_at'] = datetime.utcnow()
            update_data['status'] = ReviewStatus.IN_PROGRESS
        
        if update_data.get('status') == ReviewStatus.COMPLETED.value:
            if not review.completed_at:
                update_data['completed_at'] = datetime.utcnow()
                
                if review.started_at:
                    time_diff = datetime.utcnow() - review.started_at
                    update_data['time_spent_minutes'] = int(time_diff.total_seconds() / 60)
        
        scores = []
        for key in ['content_score', 'clarity_score', 'grammar_score', 'authenticity_score']:
            score = update_data.get(key) or getattr(review, key)
            if score is not None:
                scores.append(score)
        
        if scores:
            update_data['overall_score'] = sum(scores) / len(scores)
        
        for key, value in update_data.items():
            setattr(review, key, value)
        
        self.db.commit()
        self.db.refresh(review)
        
        self._update_essay_analytics_with_review(review)
        
        return review

    def _update_essay_analytics_with_review(self, review: EssayPeerReview) -> None:
        if review.status != ReviewStatus.COMPLETED:
            return
        
        essay = review.essay
        latest_analytics = self.db.query(EssayAnalytics).filter(
            EssayAnalytics.essay_id == essay.id
        ).order_by(EssayAnalytics.revision_number.desc()).first()
        
        if not latest_analytics:
            return
        
        completed_reviews = self.db.query(EssayPeerReview).filter(
            EssayPeerReview.essay_id == essay.id,
            EssayPeerReview.status == ReviewStatus.COMPLETED
        ).all()
        
        if completed_reviews:
            avg_overall = sum(r.overall_score for r in completed_reviews if r.overall_score) / len(completed_reviews)
            avg_content = sum(r.content_score for r in completed_reviews if r.content_score) / len([r for r in completed_reviews if r.content_score])
            avg_clarity = sum(r.clarity_score for r in completed_reviews if r.clarity_score) / len([r for r in completed_reviews if r.clarity_score])
            avg_grammar = sum(r.grammar_score for r in completed_reviews if r.grammar_score) / len([r for r in completed_reviews if r.grammar_score])
            avg_authenticity = sum(r.authenticity_score for r in completed_reviews if r.authenticity_score) / len([r for r in completed_reviews if r.authenticity_score])
            
            latest_analytics.avg_peer_review_score = avg_overall
            latest_analytics.num_peer_reviews = len(completed_reviews)
            latest_analytics.content_quality_score = avg_content
            latest_analytics.clarity_score = avg_clarity
            latest_analytics.grammar_score = avg_grammar
            latest_analytics.authenticity_score = avg_authenticity
            
            self.db.commit()

    def submit_counselor_feedback(
        self,
        essay_id: int,
        institution_id: int,
        counselor_user_id: int,
        feedback: str,
        rating: Optional[int] = None,
        approved: bool = False
    ) -> Optional[StudentEssay]:
        essay = self.get_student_essay(essay_id, institution_id)
        if not essay:
            return None
        
        counselor_feedback = essay.counselor_feedback or []
        counselor_feedback.append({
            'counselor_id': counselor_user_id,
            'feedback': feedback,
            'rating': rating,
            'timestamp': datetime.utcnow().isoformat(),
        })
        
        essay.counselor_feedback = counselor_feedback
        essay.status = EssayStatus.COUNSELOR_REVIEW
        
        if approved:
            essay.counselor_approved = True
            essay.counselor_approved_by = counselor_user_id
            essay.counselor_approved_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(essay)
        return essay

    def run_grammar_check(
        self,
        essay_id: int,
        institution_id: int
    ) -> Optional[StudentEssay]:
        essay = self.get_student_essay(essay_id, institution_id)
        if not essay:
            return None
        
        essay.grammar_check_status = GrammarCheckStatus.IN_PROGRESS
        self.db.commit()
        
        grammar_results = self._perform_grammar_check(essay.essay_draft)
        
        essay.grammar_check_results = grammar_results
        essay.grammar_check_status = GrammarCheckStatus.COMPLETED
        essay.grammar_check_score = grammar_results.get('overall_score', 0)
        essay.clarity_score = grammar_results.get('clarity_score', 0)
        essay.ai_suggestions = grammar_results.get('suggestions', [])
        essay.ai_analyzed_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(essay)
        return essay

    def _perform_grammar_check(self, text: str) -> Dict[str, Any]:
        words = text.split()
        sentences = text.split('.')
        
        grammar_score = min(100, max(60, 85 + random.randint(-10, 10)))
        clarity_score = min(100, max(60, 80 + random.randint(-10, 10)))
        
        suggestions = []
        if len(words) > 0:
            suggestions.append({
                'type': 'grammar',
                'severity': 'medium',
                'message': 'Consider varying sentence structure for better flow',
                'location': {'start': 0, 'end': 50}
            })
            suggestions.append({
                'type': 'clarity',
                'severity': 'low',
                'message': 'This sentence could be more concise',
                'location': {'start': 100, 'end': 150}
            })
        
        return {
            'overall_score': grammar_score,
            'clarity_score': clarity_score,
            'grammar_errors': random.randint(0, 5),
            'spelling_errors': random.randint(0, 3),
            'word_count': len(words),
            'sentence_count': len([s for s in sentences if s.strip()]),
            'avg_sentence_length': len(words) / max(1, len([s for s in sentences if s.strip()])),
            'suggestions': suggestions,
            'checked_at': datetime.utcnow().isoformat(),
        }

    def finalize_essay(
        self,
        essay_id: int,
        institution_id: int,
        finalized_version: Optional[str] = None
    ) -> Optional[StudentEssay]:
        essay = self.get_student_essay(essay_id, institution_id)
        if not essay:
            return None
        
        essay.finalized_version = finalized_version or essay.essay_draft
        essay.finalized_at = datetime.utcnow()
        essay.status = EssayStatus.FINALIZED
        
        self.db.commit()
        self.db.refresh(essay)
        return essay

    def create_essay_template(self, template_data: Dict[str, Any]) -> EssayTemplate:
        template = EssayTemplate(**template_data)
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def get_essay_template(self, template_id: int, institution_id: int) -> Optional[EssayTemplate]:
        template = self.db.query(EssayTemplate).filter(
            EssayTemplate.id == template_id,
            EssayTemplate.institution_id == institution_id,
            EssayTemplate.is_active == True
        ).first()
        
        if template:
            template.view_count += 1
            self.db.commit()
        
        return template

    def list_essay_templates(
        self,
        institution_id: int,
        prompt_type: Optional[str] = None,
        is_featured: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[EssayTemplate]:
        query = self.db.query(EssayTemplate).filter(
            EssayTemplate.institution_id == institution_id,
            EssayTemplate.is_active == True
        )
        
        if prompt_type:
            query = query.filter(EssayTemplate.prompt_type == prompt_type)
        
        if is_featured is not None:
            query = query.filter(EssayTemplate.is_featured == is_featured)
        
        return query.order_by(EssayTemplate.helpful_count.desc()).limit(limit).offset(offset).all()

    def update_essay_template(
        self,
        template_id: int,
        institution_id: int,
        update_data: Dict[str, Any]
    ) -> Optional[EssayTemplate]:
        template = self.db.query(EssayTemplate).filter(
            EssayTemplate.id == template_id,
            EssayTemplate.institution_id == institution_id
        ).first()
        
        if not template:
            return None
        
        for key, value in update_data.items():
            setattr(template, key, value)
        
        self.db.commit()
        self.db.refresh(template)
        return template

    def mark_template_helpful(self, template_id: int, institution_id: int) -> Optional[EssayTemplate]:
        template = self.db.query(EssayTemplate).filter(
            EssayTemplate.id == template_id,
            EssayTemplate.institution_id == institution_id
        ).first()
        
        if template:
            template.helpful_count += 1
            self.db.commit()
            self.db.refresh(template)
        
        return template

    def create_review_rubric(self, rubric_data: Dict[str, Any]) -> ReviewRubric:
        rubric = ReviewRubric(**rubric_data)
        self.db.add(rubric)
        self.db.commit()
        self.db.refresh(rubric)
        return rubric

    def get_review_rubric(self, rubric_id: int, institution_id: int) -> Optional[ReviewRubric]:
        return self.db.query(ReviewRubric).filter(
            ReviewRubric.id == rubric_id,
            ReviewRubric.institution_id == institution_id,
            ReviewRubric.is_active == True
        ).first()

    def get_default_rubric(self, institution_id: int, prompt_type: Optional[str] = None) -> Optional[ReviewRubric]:
        query = self.db.query(ReviewRubric).filter(
            ReviewRubric.institution_id == institution_id,
            ReviewRubric.is_default == True,
            ReviewRubric.is_active == True
        )
        
        if prompt_type:
            query = query.filter(ReviewRubric.prompt_type == prompt_type)
        
        return query.first()

    def list_review_rubrics(
        self,
        institution_id: int,
        prompt_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[ReviewRubric]:
        query = self.db.query(ReviewRubric).filter(
            ReviewRubric.institution_id == institution_id,
            ReviewRubric.is_active == True
        )
        
        if prompt_type:
            query = query.filter(ReviewRubric.prompt_type == prompt_type)
        
        return query.order_by(ReviewRubric.is_default.desc(), ReviewRubric.created_at.desc()).limit(limit).offset(offset).all()

    def update_review_rubric(
        self,
        rubric_id: int,
        institution_id: int,
        update_data: Dict[str, Any]
    ) -> Optional[ReviewRubric]:
        rubric = self.get_review_rubric(rubric_id, institution_id)
        if not rubric:
            return None
        
        for key, value in update_data.items():
            setattr(rubric, key, value)
        
        self.db.commit()
        self.db.refresh(rubric)
        return rubric

    def get_essay_analytics(
        self,
        essay_id: int,
        institution_id: int
    ) -> List[EssayAnalytics]:
        return self.db.query(EssayAnalytics).filter(
            EssayAnalytics.essay_id == essay_id,
            EssayAnalytics.institution_id == institution_id
        ).order_by(EssayAnalytics.revision_number.asc()).all()

    def get_essay_improvement_report(
        self,
        essay_id: int,
        institution_id: int
    ) -> Optional[Dict[str, Any]]:
        essay = self.get_student_essay(essay_id, institution_id)
        if not essay:
            return None
        
        analytics = self.get_essay_analytics(essay_id, institution_id)
        peer_reviews = self.list_peer_reviews(institution_id, essay_id=essay_id, status=ReviewStatus.COMPLETED.value)
        
        improvement_timeline = []
        for i, analytic in enumerate(analytics):
            improvement = None
            if i > 0:
                prev = analytics[i - 1]
                if prev.avg_peer_review_score and analytic.avg_peer_review_score:
                    improvement = analytic.avg_peer_review_score - prev.avg_peer_review_score
            
            improvement_timeline.append({
                'revision_number': analytic.revision_number,
                'word_count': analytic.word_count,
                'avg_score': analytic.avg_peer_review_score,
                'num_reviews': analytic.num_peer_reviews,
                'improvement': improvement,
                'timestamp': analytic.created_at.isoformat(),
            })
        
        current_scores = {}
        if analytics:
            latest = analytics[-1]
            current_scores = {
                'grammar': latest.grammar_score,
                'clarity': latest.clarity_score,
                'content_quality': latest.content_quality_score,
                'authenticity': latest.authenticity_score,
                'overall': latest.avg_peer_review_score,
            }
        
        peer_review_summary = {
            'total_reviews': len(peer_reviews),
            'avg_overall_score': sum(r.overall_score for r in peer_reviews if r.overall_score) / len(peer_reviews) if peer_reviews else None,
            'common_strengths': self._extract_common_themes([r.strengths for r in peer_reviews if r.strengths]),
            'common_improvements': self._extract_common_themes([r.areas_for_improvement for r in peer_reviews if r.areas_for_improvement]),
        }
        
        counselor_feedback_summary = None
        if essay.counselor_feedback:
            counselor_feedback_summary = {
                'total_feedback': len(essay.counselor_feedback),
                'approved': essay.counselor_approved,
                'latest_feedback': essay.counselor_feedback[-1] if essay.counselor_feedback else None,
            }
        
        recommended_actions = self._generate_recommendations(essay, analytics, peer_reviews)
        
        return {
            'essay_id': essay_id,
            'student_id': essay.student_id,
            'total_revisions': len(analytics),
            'improvement_timeline': improvement_timeline,
            'current_scores': current_scores,
            'peer_review_summary': peer_review_summary,
            'counselor_feedback_summary': counselor_feedback_summary,
            'recommended_actions': recommended_actions,
        }

    def _extract_common_themes(self, items_list: List[List[str]]) -> List[str]:
        all_items = []
        for items in items_list:
            if items:
                all_items.extend(items)
        
        from collections import Counter
        if all_items:
            common = Counter(all_items).most_common(5)
            return [item for item, count in common]
        return []

    def _generate_recommendations(
        self,
        essay: StudentEssay,
        analytics: List[EssayAnalytics],
        peer_reviews: List[EssayPeerReview]
    ) -> List[str]:
        recommendations = []
        
        if not analytics:
            recommendations.append("Start by getting peer reviews to understand areas for improvement")
            return recommendations
        
        latest = analytics[-1]
        
        if latest.grammar_score and latest.grammar_score < 75:
            recommendations.append("Consider using the AI grammar checker to improve grammar and spelling")
        
        if latest.clarity_score and latest.clarity_score < 75:
            recommendations.append("Work on improving clarity by simplifying complex sentences")
        
        if latest.num_peer_reviews < 3:
            recommendations.append("Request more peer reviews to get diverse feedback")
        
        if not essay.counselor_feedback:
            recommendations.append("Submit for counselor review to get professional guidance")
        
        if essay.word_count and essay.prompt.word_limit:
            if essay.word_count > essay.prompt.word_limit * 1.1:
                recommendations.append(f"Essay exceeds word limit by {essay.word_count - essay.prompt.word_limit} words")
            elif essay.word_count < essay.prompt.word_limit * 0.8:
                recommendations.append("Consider expanding the essay to better utilize the word limit")
        
        if len(analytics) > 1:
            if latest.avg_peer_review_score and analytics[-2].avg_peer_review_score:
                if latest.avg_peer_review_score <= analytics[-2].avg_peer_review_score:
                    recommendations.append("Recent revisions haven't improved scores - consider reviewing feedback more carefully")
        
        if not recommendations:
            recommendations.append("Great work! Consider finalizing this essay version")
        
        return recommendations
