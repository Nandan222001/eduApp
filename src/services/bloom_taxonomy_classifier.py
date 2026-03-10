from typing import Dict, Any, Optional
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import re
from sqlalchemy.orm import Session

from src.models.previous_year_papers import QuestionBank, BloomTaxonomyLevel


class BloomTaxonomyClassifier:
    def __init__(self):
        self._classifier = None
        self.bloom_keywords = {
            'remember': [
                'define', 'identify', 'list', 'name', 'recall', 'state', 'describe',
                'recognize', 'select', 'match', 'what is', 'who is', 'when did', 'where is'
            ],
            'understand': [
                'explain', 'summarize', 'interpret', 'paraphrase', 'classify', 'compare',
                'contrast', 'demonstrate', 'illustrate', 'infer', 'discuss', 'distinguish',
                'why', 'how does'
            ],
            'apply': [
                'apply', 'calculate', 'compute', 'solve', 'use', 'demonstrate', 'modify',
                'operate', 'prepare', 'produce', 'show', 'sketch', 'implement', 'execute'
            ],
            'analyze': [
                'analyze', 'categorize', 'compare', 'contrast', 'differentiate', 'distinguish',
                'examine', 'experiment', 'question', 'test', 'investigate', 'organize',
                'deconstruct', 'relate', 'diagram'
            ],
            'evaluate': [
                'assess', 'critique', 'evaluate', 'judge', 'justify', 'argue', 'defend',
                'rate', 'select', 'support', 'value', 'prioritize', 'recommend', 'conclude'
            ],
            'create': [
                'create', 'design', 'develop', 'formulate', 'construct', 'produce', 'invent',
                'compose', 'generate', 'plan', 'propose', 'assemble', 'devise', 'hypothesize'
            ]
        }
    
    @property
    def classifier(self):
        if self._classifier is None:
            self._classifier = pipeline(
                "text-classification",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1
            )
        return self._classifier
    
    def classify_question(self, question_text: str) -> Dict[str, Any]:
        question_lower = question_text.lower()
        
        keyword_scores = {level: 0 for level in self.bloom_keywords.keys()}
        
        for level, keywords in self.bloom_keywords.items():
            for keyword in keywords:
                if keyword in question_lower:
                    keyword_scores[level] += 1
        
        complexity_score = self._calculate_complexity(question_text)
        
        if keyword_scores['create'] > 0 or complexity_score > 0.8:
            predicted_level = 'create'
        elif keyword_scores['evaluate'] > 0 or complexity_score > 0.7:
            predicted_level = 'evaluate'
        elif keyword_scores['analyze'] > 0 or complexity_score > 0.6:
            predicted_level = 'analyze'
        elif keyword_scores['apply'] > 0 or complexity_score > 0.5:
            predicted_level = 'apply'
        elif keyword_scores['understand'] > 0 or complexity_score > 0.3:
            predicted_level = 'understand'
        else:
            predicted_level = 'remember'
        
        confidence = self._calculate_confidence(keyword_scores, predicted_level)
        
        return {
            'predicted_level': predicted_level,
            'confidence': confidence,
            'keyword_scores': keyword_scores,
            'complexity_score': complexity_score,
            'explanation': self._get_explanation(predicted_level, question_text)
        }
    
    def _calculate_complexity(self, text: str) -> float:
        words = text.split()
        word_count = len(words)
        
        sentence_count = len(re.split(r'[.!?]+', text))
        
        avg_word_length = sum(len(word) for word in words) / max(word_count, 1)
        
        has_multiple_parts = ',' in text or ';' in text or ' and ' in text.lower()
        
        complexity = 0.0
        
        if word_count > 50:
            complexity += 0.3
        elif word_count > 30:
            complexity += 0.2
        elif word_count > 15:
            complexity += 0.1
        
        if avg_word_length > 7:
            complexity += 0.2
        elif avg_word_length > 5:
            complexity += 0.1
        
        if sentence_count > 2:
            complexity += 0.2
        
        if has_multiple_parts:
            complexity += 0.2
        
        reasoning_keywords = ['why', 'how', 'justify', 'explain', 'analyze', 'evaluate', 'compare']
        if any(kw in text.lower() for kw in reasoning_keywords):
            complexity += 0.2
        
        return min(complexity, 1.0)
    
    def _calculate_confidence(self, keyword_scores: Dict[str, int], predicted_level: str) -> float:
        total_keywords = sum(keyword_scores.values())
        
        if total_keywords == 0:
            return 0.5
        
        level_keywords = keyword_scores.get(predicted_level, 0)
        
        confidence = (level_keywords / total_keywords) * 0.7 + 0.3
        
        return min(confidence, 1.0)
    
    def _get_explanation(self, level: str, question_text: str) -> str:
        explanations = {
            'remember': 'This question requires recalling facts, terms, or basic concepts.',
            'understand': 'This question requires explaining ideas or concepts.',
            'apply': 'This question requires using information in new situations or solving problems.',
            'analyze': 'This question requires breaking down information and examining relationships.',
            'evaluate': 'This question requires making judgments based on criteria and standards.',
            'create': 'This question requires producing new or original work.'
        }
        
        return explanations.get(level, 'Unable to determine explanation.')
    
    def classify_batch(self, questions: list[str]) -> list[Dict[str, Any]]:
        return [self.classify_question(q) for q in questions]
    
    def update_question_bloom_level(
        self,
        db: Session,
        question_id: int,
        auto_classify: bool = True
    ) -> Optional[Dict[str, Any]]:
        question = db.query(QuestionBank).filter(QuestionBank.id == question_id).first()
        
        if not question:
            return None
        
        if not auto_classify:
            return {
                'question_id': question_id,
                'current_level': question.bloom_taxonomy_level.value,
                'status': 'no_change'
            }
        
        classification = self.classify_question(question.question_text)
        
        new_level = BloomTaxonomyLevel(classification['predicted_level'])
        old_level = question.bloom_taxonomy_level
        
        question.bloom_taxonomy_level = new_level
        db.commit()
        
        return {
            'question_id': question_id,
            'old_level': old_level.value,
            'new_level': new_level.value,
            'confidence': classification['confidence'],
            'explanation': classification['explanation'],
            'status': 'updated' if old_level != new_level else 'confirmed'
        }
