import json
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_

from src.models.previous_year_papers import (
    QuestionBank,
    QuestionVariation,
    QuestionType,
    DifficultyLevel,
    BloomTaxonomyLevel
)
from src.services.question_nlp_service import QuestionNLPService


class QuestionVariationService:
    def __init__(self, db: Session):
        self.db = db
        self.nlp_service = QuestionNLPService(db)
    
    def generate_paraphrase_variation(
        self,
        original_question_id: int,
        user_id: Optional[int] = None
    ) -> Optional[QuestionVariation]:
        question = self.db.query(QuestionBank).filter(
            QuestionBank.id == original_question_id
        ).first()
        
        if not question:
            return None
        
        paraphrased = self._paraphrase_question(question.question_text)
        
        variation = QuestionVariation(
            original_question_id=original_question_id,
            institution_id=question.institution_id,
            variation_text=paraphrased,
            variation_type='paraphrase',
            question_type=question.question_type,
            difficulty_level=question.difficulty_level,
            bloom_taxonomy_level=question.bloom_taxonomy_level,
            options=question.options,
            correct_option=question.correct_option,
            answer_text=question.answer_text,
            explanation=question.explanation,
            generation_method='rule_based',
            generation_metadata=json.dumps({
                'original_length': len(question.question_text),
                'variation_length': len(paraphrased),
                'technique': 'synonym_replacement'
            }),
            created_by=user_id
        )
        
        self.db.add(variation)
        self.db.commit()
        self.db.refresh(variation)
        
        return variation
    
    def generate_difficulty_variation(
        self,
        original_question_id: int,
        target_difficulty: DifficultyLevel,
        user_id: Optional[int] = None
    ) -> Optional[QuestionVariation]:
        question = self.db.query(QuestionBank).filter(
            QuestionBank.id == original_question_id
        ).first()
        
        if not question:
            return None
        
        current_difficulty = question.difficulty_level
        
        if target_difficulty == DifficultyLevel.EASY and current_difficulty != DifficultyLevel.EASY:
            variation_text = self._simplify_question(question.question_text)
        elif target_difficulty == DifficultyLevel.HARD and current_difficulty != DifficultyLevel.HARD:
            variation_text = self._complicate_question(question.question_text)
        else:
            variation_text = question.question_text
        
        variation = QuestionVariation(
            original_question_id=original_question_id,
            institution_id=question.institution_id,
            variation_text=variation_text,
            variation_type='difficulty_adjusted',
            question_type=question.question_type,
            difficulty_level=target_difficulty,
            bloom_taxonomy_level=question.bloom_taxonomy_level,
            options=question.options,
            correct_option=question.correct_option,
            answer_text=question.answer_text,
            explanation=question.explanation,
            generation_method='rule_based',
            generation_metadata=json.dumps({
                'original_difficulty': current_difficulty.value,
                'target_difficulty': target_difficulty.value
            }),
            created_by=user_id
        )
        
        self.db.add(variation)
        self.db.commit()
        self.db.refresh(variation)
        
        return variation
    
    def generate_bloom_variation(
        self,
        original_question_id: int,
        target_bloom_level: BloomTaxonomyLevel,
        user_id: Optional[int] = None
    ) -> Optional[QuestionVariation]:
        question = self.db.query(QuestionBank).filter(
            QuestionBank.id == original_question_id
        ).first()
        
        if not question:
            return None
        
        variation_text = self._adjust_bloom_level(
            question.question_text,
            question.bloom_taxonomy_level,
            target_bloom_level
        )
        
        variation = QuestionVariation(
            original_question_id=original_question_id,
            institution_id=question.institution_id,
            variation_text=variation_text,
            variation_type='bloom_adjusted',
            question_type=question.question_type,
            difficulty_level=question.difficulty_level,
            bloom_taxonomy_level=target_bloom_level,
            options=question.options,
            correct_option=question.correct_option,
            answer_text=question.answer_text,
            explanation=question.explanation,
            generation_method='rule_based',
            generation_metadata=json.dumps({
                'original_bloom': question.bloom_taxonomy_level.value,
                'target_bloom': target_bloom_level.value
            }),
            created_by=user_id
        )
        
        self.db.add(variation)
        self.db.commit()
        self.db.refresh(variation)
        
        return variation
    
    def generate_multiple_variations(
        self,
        original_question_id: int,
        variation_types: List[str],
        user_id: Optional[int] = None
    ) -> List[QuestionVariation]:
        variations = []
        
        for vtype in variation_types:
            if vtype == 'paraphrase':
                var = self.generate_paraphrase_variation(original_question_id, user_id)
                if var:
                    variations.append(var)
            elif vtype == 'difficulty_easy':
                var = self.generate_difficulty_variation(
                    original_question_id,
                    DifficultyLevel.EASY,
                    user_id
                )
                if var:
                    variations.append(var)
            elif vtype == 'difficulty_hard':
                var = self.generate_difficulty_variation(
                    original_question_id,
                    DifficultyLevel.HARD,
                    user_id
                )
                if var:
                    variations.append(var)
        
        return variations
    
    def get_variations_for_question(
        self,
        question_id: int,
        active_only: bool = True
    ) -> List[QuestionVariation]:
        query = self.db.query(QuestionVariation).filter(
            QuestionVariation.original_question_id == question_id
        )
        
        if active_only:
            query = query.filter(QuestionVariation.is_active == True)
        
        return query.order_by(QuestionVariation.created_at.desc()).all()
    
    def verify_variation(
        self,
        variation_id: int,
        verified_by: int,
        is_verified: bool = True
    ) -> Optional[QuestionVariation]:
        variation = self.db.query(QuestionVariation).filter(
            QuestionVariation.id == variation_id
        ).first()
        
        if not variation:
            return None
        
        variation.is_verified = is_verified
        variation.verified_by = verified_by
        variation.verified_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(variation)
        
        return variation
    
    def _paraphrase_question(self, text: str) -> str:
        synonyms = {
            'calculate': 'compute',
            'find': 'determine',
            'explain': 'describe',
            'define': 'state',
            'list': 'enumerate',
            'identify': 'recognize',
            'compare': 'contrast',
            'evaluate': 'assess',
            'analyze': 'examine',
            'discuss': 'elaborate',
            'solve': 'resolve',
            'prove': 'demonstrate',
            'show': 'illustrate',
            'determine': 'find out'
        }
        
        result = text
        for original, replacement in synonyms.items():
            pattern = r'\b' + re.escape(original) + r'\b'
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        
        if result == text:
            result = "Rephrase: " + text
        
        return result
    
    def _simplify_question(self, text: str) -> str:
        simplified = text
        
        simplified = re.sub(r'\b(however|nevertheless|furthermore|moreover)\b', 'but', simplified, flags=re.IGNORECASE)
        simplified = re.sub(r'\b(utilize|employ)\b', 'use', simplified, flags=re.IGNORECASE)
        simplified = re.sub(r'\b(demonstrate|illustrate)\b', 'show', simplified, flags=re.IGNORECASE)
        
        if not simplified.startswith(('What', 'How', 'Why', 'When', 'Where', 'Which')):
            simplified = "What is " + simplified[0].lower() + simplified[1:]
        
        return simplified
    
    def _complicate_question(self, text: str) -> str:
        complicated = text
        
        if complicated.startswith('What is'):
            complicated = complicated.replace('What is', 'Analyze and explain', 1)
        elif complicated.startswith('What'):
            complicated = complicated.replace('What', 'Critically evaluate what', 1)
        
        if '?' in complicated:
            base = complicated.rstrip('?')
            complicated = f"{base} and justify your answer with appropriate reasoning?"
        
        return complicated
    
    def _adjust_bloom_level(
        self,
        text: str,
        current_level: BloomTaxonomyLevel,
        target_level: BloomTaxonomyLevel
    ) -> str:
        bloom_verbs = {
            BloomTaxonomyLevel.REMEMBER: ['State', 'List', 'Define', 'Identify', 'Name'],
            BloomTaxonomyLevel.UNDERSTAND: ['Explain', 'Describe', 'Summarize', 'Interpret'],
            BloomTaxonomyLevel.APPLY: ['Apply', 'Calculate', 'Solve', 'Demonstrate', 'Use'],
            BloomTaxonomyLevel.ANALYZE: ['Analyze', 'Compare', 'Contrast', 'Examine', 'Investigate'],
            BloomTaxonomyLevel.EVALUATE: ['Evaluate', 'Assess', 'Justify', 'Critique', 'Judge'],
            BloomTaxonomyLevel.CREATE: ['Create', 'Design', 'Develop', 'Formulate', 'Construct']
        }
        
        target_verb = bloom_verbs.get(target_level, ['Discuss'])[0]
        
        question_starters = ['What', 'How', 'Why', 'When', 'Where', 'Which', 'Who']
        
        for starter in question_starters:
            if text.startswith(starter):
                return f"{target_verb} {text[0].lower()}{text[1:]}"
        
        return f"{target_verb}: {text}"
