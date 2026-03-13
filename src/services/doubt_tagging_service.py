import re
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
import logging

from src.models.doubt import DoubtPost
from src.models.academic import Subject, Chapter, Topic

logger = logging.getLogger(__name__)


class DoubtTaggingService:
    def __init__(self):
        self.subject_keywords = {
            'mathematics': ['algebra', 'geometry', 'calculus', 'trigonometry', 'statistics', 'equation', 
                          'theorem', 'proof', 'function', 'derivative', 'integral', 'matrix', 'vector'],
            'physics': ['force', 'motion', 'energy', 'electricity', 'magnetism', 'optics', 'thermodynamics',
                       'mechanics', 'quantum', 'wave', 'light', 'circuit', 'momentum', 'acceleration'],
            'chemistry': ['atom', 'molecule', 'reaction', 'compound', 'element', 'bond', 'acid', 'base',
                        'organic', 'inorganic', 'periodic', 'solution', 'equilibrium', 'oxidation'],
            'biology': ['cell', 'organism', 'genetics', 'evolution', 'ecology', 'dna', 'protein',
                       'photosynthesis', 'respiration', 'chromosome', 'tissue', 'organ', 'species'],
            'english': ['grammar', 'literature', 'comprehension', 'essay', 'poem', 'novel', 'verb',
                       'noun', 'adjective', 'sentence', 'paragraph', 'writing', 'reading'],
            'history': ['war', 'empire', 'civilization', 'revolution', 'dynasty', 'ancient', 'medieval',
                       'modern', 'treaty', 'independence', 'colonial', 'freedom', 'constitution'],
            'geography': ['continent', 'ocean', 'climate', 'mountain', 'river', 'map', 'latitude',
                        'longitude', 'population', 'agriculture', 'resource', 'terrain', 'ecosystem'],
            'computer_science': ['algorithm', 'programming', 'code', 'function', 'loop', 'array',
                               'database', 'network', 'software', 'hardware', 'binary', 'syntax']
        }
        
        self.difficulty_keywords = {
            'easy': ['basic', 'simple', 'easy', 'beginner', 'introduction', 'fundamental'],
            'medium': ['intermediate', 'moderate', 'standard', 'average'],
            'hard': ['complex', 'difficult', 'advanced', 'challenging', 'complicated'],
            'expert': ['expert', 'master', 'olympiad', 'competitive', 'research']
        }
        
        self.urgency_keywords = {
            'urgent': ['urgent', 'asap', 'immediately', 'today', 'tomorrow', 'exam tomorrow', 'test tomorrow'],
            'high': ['soon', 'this week', 'exam', 'test', 'assignment', 'homework'],
            'medium': ['help', 'need', 'please', 'confused'],
            'low': ['curious', 'wondering', 'interested', 'optional']
        }
    
    def auto_tag_doubt(
        self,
        db: Session,
        doubt_id: int
    ) -> Dict:
        doubt = db.query(DoubtPost).filter(DoubtPost.id == doubt_id).first()
        
        if not doubt:
            return {'success': False, 'message': 'Doubt not found'}
        
        combined_text = f"{doubt.title} {doubt.description}".lower()
        
        auto_tags = []
        
        subject_detected = self._detect_subject(db, doubt, combined_text)
        if subject_detected:
            auto_tags.append(subject_detected['subject_name'])
            doubt.subject_id = subject_detected['subject_id']
        
        chapter_detected = self._detect_chapter(db, doubt, combined_text)
        if chapter_detected:
            auto_tags.append(chapter_detected['chapter_name'])
            doubt.chapter_id = chapter_detected['chapter_id']
        
        topic_detected = self._detect_topic(db, doubt, combined_text)
        if topic_detected:
            auto_tags.append(topic_detected['topic_name'])
            doubt.topic_id = str(topic_detected['topic_id'])
        
        difficulty = self._detect_difficulty(combined_text)
        if difficulty:
            auto_tags.append(f"difficulty:{difficulty}")
            doubt.difficulty = difficulty
        
        concept_tags = self._extract_concept_tags(combined_text)
        auto_tags.extend(concept_tags)
        
        doubt.auto_generated_tags = list(set(auto_tags))
        
        db.commit()
        db.refresh(doubt)
        
        return {
            'success': True,
            'auto_tags': doubt.auto_generated_tags,
            'subject_id': doubt.subject_id,
            'chapter_id': doubt.chapter_id,
            'topic_id': doubt.topic_id,
            'difficulty': doubt.difficulty
        }
    
    def _detect_subject(
        self,
        db: Session,
        doubt: DoubtPost,
        text: str
    ) -> Optional[Dict]:
        if doubt.subject_id:
            subject = db.query(Subject).filter(Subject.id == doubt.subject_id).first()
            if subject:
                return {'subject_id': subject.id, 'subject_name': subject.name}
        
        subjects = db.query(Subject).filter(
            Subject.institution_id == doubt.institution_id,
            Subject.is_active == True
        ).all()
        
        best_match = None
        best_score = 0
        
        for subject in subjects:
            subject_name_lower = subject.name.lower()
            score = 0
            
            if subject_name_lower in text:
                score += 10
            
            subject_key = self._normalize_subject_name(subject_name_lower)
            if subject_key in self.subject_keywords:
                for keyword in self.subject_keywords[subject_key]:
                    if keyword in text:
                        score += 1
            
            if score > best_score:
                best_score = score
                best_match = {'subject_id': subject.id, 'subject_name': subject.name}
        
        return best_match if best_score >= 2 else None
    
    def _detect_chapter(
        self,
        db: Session,
        doubt: DoubtPost,
        text: str
    ) -> Optional[Dict]:
        if doubt.chapter_id:
            chapter = db.query(Chapter).filter(Chapter.id == doubt.chapter_id).first()
            if chapter:
                return {'chapter_id': chapter.id, 'chapter_name': chapter.name}
        
        if not doubt.subject_id:
            return None
        
        chapters = db.query(Chapter).filter(
            Chapter.institution_id == doubt.institution_id,
            Chapter.subject_id == doubt.subject_id,
            Chapter.is_active == True
        ).all()
        
        best_match = None
        best_score = 0
        
        for chapter in chapters:
            chapter_name_lower = chapter.name.lower()
            score = 0
            
            if chapter_name_lower in text:
                score += 10
            
            words = re.findall(r'\b\w+\b', chapter_name_lower)
            for word in words:
                if len(word) > 3 and word in text:
                    score += 2
            
            if score > best_score:
                best_score = score
                best_match = {'chapter_id': chapter.id, 'chapter_name': chapter.name}
        
        return best_match if best_score >= 5 else None
    
    def _detect_topic(
        self,
        db: Session,
        doubt: DoubtPost,
        text: str
    ) -> Optional[Dict]:
        if not doubt.chapter_id:
            return None
        
        topics = db.query(Topic).filter(
            Topic.institution_id == doubt.institution_id,
            Topic.chapter_id == doubt.chapter_id,
            Topic.is_active == True
        ).all()
        
        best_match = None
        best_score = 0
        
        for topic in topics:
            topic_name_lower = topic.name.lower()
            score = 0
            
            if topic_name_lower in text:
                score += 10
            
            words = re.findall(r'\b\w+\b', topic_name_lower)
            for word in words:
                if len(word) > 3 and word in text:
                    score += 2
            
            if score > best_score:
                best_score = score
                best_match = {'topic_id': topic.id, 'topic_name': topic.name}
        
        return best_match if best_score >= 5 else None
    
    def _detect_difficulty(self, text: str) -> Optional[str]:
        difficulty_scores = {level: 0 for level in self.difficulty_keywords.keys()}
        
        for level, keywords in self.difficulty_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    difficulty_scores[level] += 1
        
        max_score = max(difficulty_scores.values())
        if max_score > 0:
            for level, score in difficulty_scores.items():
                if score == max_score:
                    return level
        
        return None
    
    def _extract_concept_tags(self, text: str) -> List[str]:
        concept_patterns = [
            r'\b(theorem|formula|law|principle|rule|method|technique|algorithm)\b',
            r'\b(\w+\'s\s+(?:theorem|law|principle|rule))\b',
            r'\b(chapter\s+\d+|unit\s+\d+)\b',
        ]
        
        concepts = []
        for pattern in concept_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            concepts.extend([match if isinstance(match, str) else match[0] for match in matches])
        
        return list(set(concepts[:5]))
    
    def _normalize_subject_name(self, name: str) -> str:
        name = name.lower().strip()
        mappings = {
            'math': 'mathematics',
            'maths': 'mathematics',
            'phys': 'physics',
            'chem': 'chemistry',
            'bio': 'biology',
            'comp': 'computer_science',
            'cs': 'computer_science',
            'computer': 'computer_science',
            'geo': 'geography',
            'hist': 'history'
        }
        return mappings.get(name, name.replace(' ', '_'))
    
    def suggest_tags(
        self,
        db: Session,
        doubt_id: int,
        institution_id: int
    ) -> List[str]:
        doubt = db.query(DoubtPost).filter(
            DoubtPost.id == doubt_id,
            DoubtPost.institution_id == institution_id
        ).first()
        
        if not doubt:
            return []
        
        suggested_tags = []
        
        if doubt.subject_id:
            subject = db.query(Subject).filter(Subject.id == doubt.subject_id).first()
            if subject:
                suggested_tags.append(subject.name)
        
        if doubt.chapter_id:
            chapter = db.query(Chapter).filter(Chapter.id == doubt.chapter_id).first()
            if chapter:
                suggested_tags.append(chapter.name)
        
        combined_text = f"{doubt.title} {doubt.description}".lower()
        
        for subject_key, keywords in self.subject_keywords.items():
            for keyword in keywords:
                if keyword in combined_text and keyword not in suggested_tags:
                    suggested_tags.append(keyword)
        
        if doubt.difficulty:
            suggested_tags.append(f"difficulty:{doubt.difficulty}")
        
        similar_doubts = db.query(DoubtPost).filter(
            DoubtPost.institution_id == institution_id,
            DoubtPost.subject_id == doubt.subject_id,
            DoubtPost.id != doubt.id,
            DoubtPost.tags.isnot(None)
        ).limit(10).all()
        
        tag_frequency = {}
        for similar in similar_doubts:
            if similar.tags:
                for tag in similar.tags:
                    tag_frequency[tag] = tag_frequency.get(tag, 0) + 1
        
        popular_tags = sorted(tag_frequency.items(), key=lambda x: x[1], reverse=True)
        for tag, _ in popular_tags[:5]:
            if tag not in suggested_tags:
                suggested_tags.append(tag)
        
        return suggested_tags[:15]
    
    def batch_auto_tag_doubts(
        self,
        db: Session,
        institution_id: int,
        batch_size: int = 50
    ) -> Dict[str, int]:
        doubts_without_tags = db.query(DoubtPost).filter(
            DoubtPost.institution_id == institution_id,
            DoubtPost.auto_generated_tags.is_(None)
        ).limit(batch_size).all()
        
        successful = 0
        failed = 0
        
        for doubt in doubts_without_tags:
            try:
                self.auto_tag_doubt(db, doubt.id)
                successful += 1
            except Exception as e:
                logger.error(f"Failed to auto-tag doubt {doubt.id}: {e}")
                failed += 1
                continue
        
        return {
            'successful': successful,
            'failed': failed,
            'total_processed': successful + failed
        }
