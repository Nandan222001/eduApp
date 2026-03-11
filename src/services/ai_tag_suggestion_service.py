from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from src.models.previous_year_papers import QuestionBank
from src.models.academic import Chapter, Topic
import re


class AITagSuggestionService:
    def __init__(self, db: Session):
        self.db = db

    def suggest_tags_for_question(self, question_id: int) -> Dict:
        question = self.db.query(QuestionBank).filter(
            QuestionBank.id == question_id
        ).first()

        if not question:
            return {
                "question_id": question_id,
                "suggested_tags": [],
                "suggested_chapter": None,
                "suggested_topic": None,
                "suggested_difficulty": None,
                "suggested_bloom_level": None,
                "confidence_score": 0.0
            }

        suggested_tags = self._extract_keywords_from_text(question.question_text)
        
        suggested_chapter = None
        suggested_topic = None
        
        if question.subject_id:
            chapters = self.db.query(Chapter).filter(
                Chapter.subject_id == question.subject_id,
                Chapter.is_active == True
            ).all()
            
            suggested_chapter = self._match_chapter(question.question_text, chapters)
            
            if suggested_chapter and question.chapter_id:
                topics = self.db.query(Topic).filter(
                    Topic.chapter_id == question.chapter_id,
                    Topic.is_active == True
                ).all()
                
                suggested_topic = self._match_topic(question.question_text, topics)

        suggested_difficulty = self._predict_difficulty(question.question_text)
        suggested_bloom_level = self._predict_bloom_level(question.question_text)
        
        confidence_score = 0.75

        return {
            "question_id": question_id,
            "suggested_tags": suggested_tags[:10],
            "suggested_chapter": suggested_chapter,
            "suggested_topic": suggested_topic,
            "suggested_difficulty": suggested_difficulty,
            "suggested_bloom_level": suggested_bloom_level,
            "confidence_score": confidence_score
        }

    def _extract_keywords_from_text(self, text: str) -> List[str]:
        text = text.lower()
        
        text = re.sub(r'[^\w\s]', ' ', text)
        
        stopwords = {
            'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
            'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'what', 'how',
            'when', 'where', 'why', 'can', 'could', 'should', 'would', 'will',
            'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do',
            'does', 'did', 'this', 'that', 'these', 'those', 'it', 'its'
        }
        
        words = text.split()
        keywords = [word for word in words if len(word) > 3 and word not in stopwords]
        
        word_freq = {}
        for word in keywords:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        
        return [word for word, _ in sorted_words[:10]]

    def _match_chapter(self, text: str, chapters: List[Chapter]) -> Optional[str]:
        text_lower = text.lower()
        
        for chapter in chapters:
            chapter_name_lower = chapter.chapter_name.lower()
            if chapter_name_lower in text_lower:
                return chapter.chapter_name
        
        return None

    def _match_topic(self, text: str, topics: List[Topic]) -> Optional[str]:
        text_lower = text.lower()
        
        for topic in topics:
            topic_name_lower = topic.topic_name.lower()
            if topic_name_lower in text_lower:
                return topic.topic_name
        
        return None

    def _predict_difficulty(self, text: str) -> str:
        text_lower = text.lower()
        
        hard_indicators = ['prove', 'derive', 'analyze', 'evaluate', 'complex', 'comprehensive']
        medium_indicators = ['explain', 'describe', 'compare', 'contrast', 'calculate']
        easy_indicators = ['define', 'identify', 'list', 'name', 'state', 'what is']
        
        hard_count = sum(1 for word in hard_indicators if word in text_lower)
        medium_count = sum(1 for word in medium_indicators if word in text_lower)
        easy_count = sum(1 for word in easy_indicators if word in text_lower)
        
        text_length = len(text.split())
        
        if hard_count > 0 or text_length > 100:
            return "hard"
        elif medium_count > 0 or text_length > 50:
            return "medium"
        elif easy_count > 0:
            return "easy"
        else:
            return "medium"

    def _predict_bloom_level(self, text: str) -> str:
        text_lower = text.lower()
        
        bloom_keywords = {
            'create': ['create', 'design', 'construct', 'develop', 'formulate', 'build'],
            'evaluate': ['evaluate', 'assess', 'judge', 'critique', 'justify', 'defend'],
            'analyze': ['analyze', 'examine', 'investigate', 'compare', 'contrast', 'differentiate'],
            'apply': ['apply', 'demonstrate', 'solve', 'use', 'implement', 'calculate'],
            'understand': ['explain', 'describe', 'interpret', 'summarize', 'discuss', 'clarify'],
            'remember': ['define', 'identify', 'list', 'name', 'state', 'recall', 'recognize']
        }
        
        for level, keywords in bloom_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return level
        
        return "understand"
