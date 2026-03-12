import re
import ast
import hashlib
import time
from typing import List, Dict, Any, Optional, Tuple, Set
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from src.models.plagiarism import (
    PlagiarismCheck, PlagiarismResult, PlagiarismMatchSegment,
    CodeASTFingerprint, CitationPattern, PlagiarismPrivacyConsent,
    PlagiarismCheckStatus, ComparisonScope, ContentType, ReviewDecision
)
from src.models.assignment import Submission
from src.schemas.plagiarism import (
    PlagiarismCheckCreate, MatchSegmentCreate, CodeASTFingerprintCreate,
    CitationPatternCreate
)


class TextSimilarityAnalyzer:
    """TF-IDF and cosine similarity based text comparison"""
    
    def __init__(self, min_segment_length: int = 50, min_similarity: float = 0.7):
        self.min_segment_length = min_segment_length
        self.min_similarity = min_similarity
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            min_df=1,
            stop_words='english'
        )
    
    def preprocess_text(self, text: str) -> str:
        """Clean and normalize text"""
        text = text.lower()
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        return text
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate cosine similarity between two texts"""
        try:
            text1 = self.preprocess_text(text1)
            text2 = self.preprocess_text(text2)
            
            if not text1 or not text2:
                return 0.0
            
            tfidf_matrix = self.vectorizer.fit_transform([text1, text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity)
        except Exception:
            return 0.0
    
    def find_matching_segments(
        self,
        source_text: str,
        target_text: str,
        window_size: int = 100
    ) -> List[Dict[str, Any]]:
        """Find matching text segments using sliding window"""
        matches = []
        source_text = self.preprocess_text(source_text)
        target_text = self.preprocess_text(target_text)
        
        source_words = source_text.split()
        target_words = target_text.split()
        
        if len(source_words) < self.min_segment_length:
            return matches
        
        for i in range(len(source_words) - window_size + 1):
            source_segment = ' '.join(source_words[i:i + window_size])
            
            for j in range(len(target_words) - window_size + 1):
                target_segment = ' '.join(target_words[j:j + window_size])
                
                try:
                    tfidf_matrix = self.vectorizer.fit_transform([source_segment, target_segment])
                    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
                    
                    if similarity >= self.min_similarity:
                        matches.append({
                            'source_start': i,
                            'source_end': i + window_size,
                            'source_text': source_segment,
                            'match_start': j,
                            'match_end': j + window_size,
                            'match_text': target_segment,
                            'similarity': float(similarity),
                            'length': window_size
                        })
                except Exception:
                    continue
        
        return self._merge_overlapping_segments(matches)
    
    def _merge_overlapping_segments(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Merge overlapping matching segments"""
        if not segments:
            return []
        
        segments = sorted(segments, key=lambda x: (x['source_start'], -x['similarity']))
        merged = [segments[0]]
        
        for current in segments[1:]:
            last = merged[-1]
            
            if current['source_start'] <= last['source_end']:
                if current['similarity'] > last['similarity']:
                    merged[-1] = current
            else:
                merged.append(current)
        
        return merged


class CodeASTAnalyzer:
    """AST-based code plagiarism detection"""
    
    SUPPORTED_LANGUAGES = ['python', 'javascript', 'java']
    
    def __init__(self):
        self.common_patterns = self._load_common_patterns()
    
    def _load_common_patterns(self) -> Set[str]:
        """Load common code patterns to ignore"""
        return {
            'print', 'console.log', 'System.out.println',
            'if', 'else', 'for', 'while', 'return',
            'import', 'from', 'include', 'require'
        }
    
    def analyze_python_code(self, code: str) -> Dict[str, Any]:
        """Analyze Python code using AST"""
        try:
            tree = ast.parse(code)
            
            features = {
                'functions': [],
                'classes': [],
                'variables': [],
                'imports': [],
                'control_flow': [],
                'complexity': 0
            }
            
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    features['functions'].append({
                        'name': node.name,
                        'args': len(node.args.args),
                        'body_length': len(node.body)
                    })
                elif isinstance(node, ast.ClassDef):
                    features['classes'].append({
                        'name': node.name,
                        'methods': len([n for n in node.body if isinstance(n, ast.FunctionDef)])
                    })
                elif isinstance(node, ast.Name):
                    features['variables'].append(node.id)
                elif isinstance(node, (ast.Import, ast.ImportFrom)):
                    features['imports'].append(ast.unparse(node))
                elif isinstance(node, (ast.If, ast.For, ast.While)):
                    features['control_flow'].append(type(node).__name__)
                    features['complexity'] += 1
            
            return features
        except Exception as e:
            return {'error': str(e)}
    
    def create_fingerprint(
        self,
        code: str,
        language: str = 'python'
    ) -> Dict[str, Any]:
        """Create AST fingerprint for code"""
        if language == 'python':
            features = self.analyze_python_code(code)
        else:
            features = {'error': f'Unsupported language: {language}'}
        
        if 'error' in features:
            return features
        
        structure = self._extract_structure(features)
        variable_pattern = self._extract_variable_pattern(features)
        function_pattern = self._extract_function_pattern(features)
        
        fingerprint = {
            'structure_hash': self._hash_structure(structure),
            'variable_pattern_hash': self._hash_pattern(variable_pattern),
            'function_pattern_hash': self._hash_pattern(function_pattern),
            'features': features,
            'total_nodes': sum([
                len(features.get('functions', [])),
                len(features.get('classes', [])),
                len(features.get('variables', []))
            ]),
            'total_functions': len(features.get('functions', [])),
            'total_variables': len(set(features.get('variables', []))),
            'complexity_score': float(features.get('complexity', 0))
        }
        
        return fingerprint
    
    def _extract_structure(self, features: Dict[str, Any]) -> str:
        """Extract structural pattern from features"""
        structure = []
        structure.extend([f"F:{f['args']}" for f in features.get('functions', [])])
        structure.extend([f"C:{c['methods']}" for c in features.get('classes', [])])
        structure.extend(features.get('control_flow', []))
        return '|'.join(structure)
    
    def _extract_variable_pattern(self, features: Dict[str, Any]) -> str:
        """Extract variable naming pattern"""
        variables = features.get('variables', [])
        filtered = [v for v in variables if v not in self.common_patterns]
        pattern = [self._categorize_name(v) for v in filtered]
        return '|'.join(sorted(set(pattern)))
    
    def _extract_function_pattern(self, features: Dict[str, Any]) -> str:
        """Extract function pattern"""
        functions = features.get('functions', [])
        pattern = [f"{f['args']}:{f['body_length']}" for f in functions]
        return '|'.join(pattern)
    
    def _categorize_name(self, name: str) -> str:
        """Categorize variable/function name"""
        if name.isupper():
            return 'CONST'
        elif '_' in name:
            return 'SNAKE'
        elif name[0].isupper():
            return 'PASCAL'
        else:
            return 'CAMEL'
    
    def _hash_structure(self, structure: str) -> str:
        """Hash structure pattern"""
        return hashlib.sha256(structure.encode()).hexdigest()[:16]
    
    def _hash_pattern(self, pattern: str) -> str:
        """Hash pattern"""
        return hashlib.sha256(pattern.encode()).hexdigest()[:16]
    
    def compare_fingerprints(
        self,
        fingerprint1: Dict[str, Any],
        fingerprint2: Dict[str, Any]
    ) -> float:
        """Compare two code fingerprints"""
        similarity_scores = []
        
        if fingerprint1['structure_hash'] == fingerprint2['structure_hash']:
            similarity_scores.append(1.0)
        else:
            similarity_scores.append(0.0)
        
        if fingerprint1['variable_pattern_hash'] == fingerprint2['variable_pattern_hash']:
            similarity_scores.append(0.8)
        else:
            similarity_scores.append(0.0)
        
        if fingerprint1['function_pattern_hash'] == fingerprint2['function_pattern_hash']:
            similarity_scores.append(0.9)
        else:
            similarity_scores.append(0.0)
        
        complexity_diff = abs(
            fingerprint1['complexity_score'] - fingerprint2['complexity_score']
        )
        max_complexity = max(
            fingerprint1['complexity_score'],
            fingerprint2['complexity_score']
        )
        
        if max_complexity > 0:
            complexity_similarity = 1.0 - (complexity_diff / max_complexity)
            similarity_scores.append(complexity_similarity)
        
        return float(np.mean(similarity_scores)) if similarity_scores else 0.0


class CitationDetector:
    """Detect and validate citations in text"""
    
    CITATION_PATTERNS = {
        'apa': r'\([A-Z][a-z]+(?:\s+&\s+[A-Z][a-z]+)?,\s+\d{4}\)',
        'mla': r'[A-Z][a-z]+(?:\s+and\s+[A-Z][a-z]+)?\.\s+".+?"',
        'chicago': r'[A-Z][a-z]+,\s+[A-Z][a-z]+\.\s+".+?"\s+\d+',
        'ieee': r'\[\d+\]',
        'harvard': r'\([A-Z][a-z]+\s+\d{4}\)',
        'quotes': r'(?:"|").*?(?:"|")',
        'reference': r'(?:according to|as cited in|references|bibliography)',
    }
    
    def detect_citations(self, text: str) -> List[Dict[str, Any]]:
        """Detect citations in text"""
        citations = []
        
        for citation_type, pattern in self.CITATION_PATTERNS.items():
            matches = re.finditer(pattern, text, re.IGNORECASE)
            
            for match in matches:
                citations.append({
                    'type': citation_type,
                    'text': match.group(),
                    'start': match.start(),
                    'end': match.end(),
                    'context': text[max(0, match.start() - 50):min(len(text), match.end() + 50)]
                })
        
        return citations
    
    def is_properly_cited(
        self,
        text: str,
        position: int,
        citation_window: int = 200
    ) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Check if text at position is properly cited"""
        start = max(0, position - citation_window)
        end = min(len(text), position + citation_window)
        context = text[start:end]
        
        citations = self.detect_citations(context)
        
        if citations:
            return True, citations[0]
        
        return False, None
    
    def calculate_citation_coverage(
        self,
        text: str,
        matched_segments: List[Dict[str, Any]]
    ) -> float:
        """Calculate percentage of matched text that is cited"""
        if not matched_segments:
            return 0.0
        
        cited_length = 0
        total_length = 0
        
        for segment in matched_segments:
            segment_length = segment['source_end'] - segment['source_start']
            total_length += segment_length
            
            is_cited, _ = self.is_properly_cited(text, segment['source_start'])
            if is_cited:
                cited_length += segment_length
        
        return (cited_length / total_length * 100) if total_length > 0 else 0.0


class PlagiarismDetectionService:
    """Main plagiarism detection service"""
    
    def __init__(self, db: Session):
        self.db = db
        self.text_analyzer = TextSimilarityAnalyzer()
        self.code_analyzer = CodeASTAnalyzer()
        self.citation_detector = CitationDetector()
    
    def create_plagiarism_check(
        self,
        institution_id: int,
        data: PlagiarismCheckCreate
    ) -> PlagiarismCheck:
        """Create a new plagiarism check"""
        check = PlagiarismCheck(
            institution_id=institution_id,
            assignment_id=data.assignment_id,
            submission_id=data.submission_id,
            content_type=data.content_type,
            comparison_scope=data.comparison_scope,
            enable_cross_institution=data.enable_cross_institution,
            anonymize_cross_institution=data.anonymize_cross_institution,
            check_settings=data.check_settings,
            status=PlagiarismCheckStatus.PENDING
        )
        
        self.db.add(check)
        self.db.commit()
        self.db.refresh(check)
        
        return check
    
    def run_plagiarism_check(self, check_id: int) -> PlagiarismCheck:
        """Execute plagiarism detection"""
        check = self.db.query(PlagiarismCheck).filter(
            PlagiarismCheck.id == check_id
        ).first()
        
        if not check:
            raise ValueError(f"Check {check_id} not found")
        
        check.status = PlagiarismCheckStatus.PROCESSING
        check.started_at = datetime.utcnow()
        self.db.commit()
        
        start_time = time.time()
        
        try:
            if check.submission_id:
                submissions = [self._get_submission(check.submission_id)]
            else:
                submissions = self._get_assignment_submissions(check.assignment_id)
            
            comparison_pool = self._build_comparison_pool(
                check,
                submissions
            )
            
            total_comparisons = 0
            matches_found = 0
            
            for submission in submissions:
                results = self._compare_submission(
                    submission,
                    comparison_pool,
                    check
                )
                
                total_comparisons += len(comparison_pool)
                matches_found += len(results)
                
                for result_data in results:
                    self._save_plagiarism_result(check.id, result_data)
            
            check.status = PlagiarismCheckStatus.COMPLETED
            check.total_comparisons = total_comparisons
            check.matches_found = matches_found
            check.processing_time_seconds = time.time() - start_time
            check.completed_at = datetime.utcnow()
            
        except Exception as e:
            check.status = PlagiarismCheckStatus.FAILED
            check.error_message = str(e)
        
        self.db.commit()
        self.db.refresh(check)
        
        return check
    
    def _get_submission(self, submission_id: int) -> Submission:
        """Get submission by ID"""
        return self.db.query(Submission).filter(
            Submission.id == submission_id
        ).first()
    
    def _get_assignment_submissions(self, assignment_id: int) -> List[Submission]:
        """Get all submissions for an assignment"""
        return self.db.query(Submission).filter(
            Submission.assignment_id == assignment_id,
            Submission.submission_text.isnot(None)
        ).all()
    
    def _build_comparison_pool(
        self,
        check: PlagiarismCheck,
        current_submissions: List[Submission]
    ) -> List[Submission]:
        """Build pool of submissions to compare against"""
        pool = []
        
        if check.comparison_scope == ComparisonScope.WITHIN_BATCH:
            pool = current_submissions
        
        elif check.comparison_scope == ComparisonScope.CROSS_BATCH:
            pool = self.db.query(Submission).filter(
                Submission.assignment_id != check.assignment_id,
                Submission.submission_text.isnot(None)
            ).limit(check.check_settings.get('max_comparisons', 1000)).all()
        
        elif check.comparison_scope == ComparisonScope.CROSS_INSTITUTION:
            if check.enable_cross_institution:
                pool = self.db.query(Submission).filter(
                    Submission.submission_text.isnot(None)
                ).limit(check.check_settings.get('max_comparisons', 1000)).all()
        
        elif check.comparison_scope == ComparisonScope.ALL:
            pool = self.db.query(Submission).filter(
                Submission.submission_text.isnot(None)
            ).limit(check.check_settings.get('max_comparisons', 1000)).all()
        
        return pool
    
    def _compare_submission(
        self,
        submission: Submission,
        comparison_pool: List[Submission],
        check: PlagiarismCheck
    ) -> List[Dict[str, Any]]:
        """Compare submission against pool"""
        results = []
        settings = check.check_settings or {}
        min_threshold = settings.get('min_similarity_threshold', 0.7)
        
        if not submission.submission_text:
            return results
        
        citations = []
        if settings.get('enable_citation_detection', True):
            citations = self.citation_detector.detect_citations(submission.submission_text)
        
        for target in comparison_pool:
            if target.id == submission.id:
                continue
            
            if not target.submission_text:
                continue
            
            if check.content_type == ContentType.SOURCE_CODE:
                similarity = self._compare_code(submission, target, settings)
            else:
                similarity = self.text_analyzer.calculate_similarity(
                    submission.submission_text,
                    target.submission_text
                )
            
            if similarity >= min_threshold:
                matched_segments = self.text_analyzer.find_matching_segments(
                    submission.submission_text,
                    target.submission_text,
                    window_size=settings.get('min_segment_length', 50)
                )
                
                citation_info = None
                has_citations = False
                
                if citations:
                    citation_coverage = self.citation_detector.calculate_citation_coverage(
                        submission.submission_text,
                        matched_segments
                    )
                    has_citations = citation_coverage > 30.0
                    citation_info = {
                        'coverage': citation_coverage,
                        'total_citations': len(citations)
                    }
                
                is_false_positive = self._detect_false_positive(
                    matched_segments,
                    citations,
                    settings
                )
                
                results.append({
                    'submission_id': submission.id,
                    'matched_submission_id': target.id,
                    'similarity_score': similarity,
                    'text_similarity': similarity,
                    'matched_segments': matched_segments,
                    'matched_segments_count': len(matched_segments),
                    'has_citations': has_citations,
                    'citation_info': citation_info,
                    'is_false_positive': is_false_positive
                })
        
        return results
    
    def _compare_code(
        self,
        submission1: Submission,
        submission2: Submission,
        settings: Dict[str, Any]
    ) -> float:
        """Compare code submissions using AST"""
        if not settings.get('enable_code_analysis', True):
            return 0.0
        
        fingerprint1 = self.code_analyzer.create_fingerprint(
            submission1.submission_text or '',
            language='python'
        )
        
        fingerprint2 = self.code_analyzer.create_fingerprint(
            submission2.submission_text or '',
            language='python'
        )
        
        if 'error' in fingerprint1 or 'error' in fingerprint2:
            return 0.0
        
        return self.code_analyzer.compare_fingerprints(fingerprint1, fingerprint2)
    
    def _detect_false_positive(
        self,
        matched_segments: List[Dict[str, Any]],
        citations: List[Dict[str, Any]],
        settings: Dict[str, Any]
    ) -> bool:
        """Detect if match is likely a false positive"""
        if not matched_segments:
            return True
        
        if settings.get('ignore_common_phrases', True):
            common_phrases = [
                'in conclusion', 'in summary', 'for example',
                'on the other hand', 'it is important to note'
            ]
            
            for segment in matched_segments:
                segment_text = segment.get('source_text', '').lower()
                if any(phrase in segment_text for phrase in common_phrases):
                    return True
        
        if citations:
            citation_positions = [(c['start'], c['end']) for c in citations]
            
            cited_segments = 0
            for segment in matched_segments:
                for start, end in citation_positions:
                    if (segment['source_start'] >= start - 100 and
                        segment['source_end'] <= end + 100):
                        cited_segments += 1
                        break
            
            if cited_segments / len(matched_segments) > 0.5:
                return True
        
        return False
    
    def _save_plagiarism_result(
        self,
        check_id: int,
        result_data: Dict[str, Any]
    ) -> PlagiarismResult:
        """Save plagiarism result to database"""
        matched_segments = result_data.pop('matched_segments', [])
        
        result = PlagiarismResult(
            check_id=check_id,
            **result_data
        )
        
        self.db.add(result)
        self.db.flush()
        
        for segment_data in matched_segments:
            segment = PlagiarismMatchSegment(
                result_id=result.id,
                source_start=segment_data['source_start'],
                source_end=segment_data['source_end'],
                source_text=segment_data['source_text'],
                match_start=segment_data['match_start'],
                match_end=segment_data['match_end'],
                match_text=segment_data['match_text'],
                segment_similarity=segment_data['similarity'],
                segment_length=segment_data['length']
            )
            self.db.add(segment)
        
        self.db.commit()
        self.db.refresh(result)
        
        return result
    
    def get_plagiarism_results(
        self,
        check_id: int,
        min_similarity: Optional[float] = None
    ) -> List[PlagiarismResult]:
        """Get plagiarism results for a check"""
        query = self.db.query(PlagiarismResult).filter(
            PlagiarismResult.check_id == check_id
        )
        
        if min_similarity:
            query = query.filter(PlagiarismResult.similarity_score >= min_similarity)
        
        return query.order_by(PlagiarismResult.similarity_score.desc()).all()
    
    def review_result(
        self,
        result_id: int,
        teacher_id: int,
        decision: ReviewDecision,
        notes: Optional[str] = None,
        is_false_positive: bool = False,
        false_positive_reason: Optional[str] = None
    ) -> PlagiarismResult:
        """Review a plagiarism result"""
        result = self.db.query(PlagiarismResult).filter(
            PlagiarismResult.id == result_id
        ).first()
        
        if not result:
            raise ValueError(f"Result {result_id} not found")
        
        result.review_status = "reviewed"
        result.reviewed_by = teacher_id
        result.reviewed_at = datetime.utcnow()
        result.review_decision = decision
        result.review_notes = notes
        result.is_false_positive = is_false_positive
        result.false_positive_reason = false_positive_reason
        
        self.db.commit()
        self.db.refresh(result)
        
        return result
    
    def generate_plagiarism_report(
        self,
        assignment_id: int
    ) -> Dict[str, Any]:
        """Generate plagiarism report for assignment"""
        checks = self.db.query(PlagiarismCheck).filter(
            PlagiarismCheck.assignment_id == assignment_id,
            PlagiarismCheck.status == PlagiarismCheckStatus.COMPLETED
        ).all()
        
        if not checks:
            return {'error': 'No completed checks found'}
        
        latest_check = max(checks, key=lambda x: x.completed_at)
        
        results = self.get_plagiarism_results(latest_check.id)
        
        high_similarity = [r for r in results if r.similarity_score >= 0.8]
        medium_similarity = [r for r in results if 0.5 <= r.similarity_score < 0.8]
        low_similarity = [r for r in results if r.similarity_score < 0.5]
        
        flagged_pairs = []
        for result in high_similarity:
            if not result.is_false_positive:
                flagged_pairs.append({
                    'submission_id_1': result.submission_id,
                    'submission_id_2': result.matched_submission_id,
                    'similarity_score': result.similarity_score,
                    'matched_segments': result.matched_segments_count
                })
        
        avg_similarity = (
            sum(r.similarity_score for r in results) / len(results)
            if results else 0.0
        )
        
        max_similarity = (
            max(r.similarity_score for r in results)
            if results else 0.0
        )
        
        return {
            'check_id': latest_check.id,
            'assignment_id': assignment_id,
            'total_submissions': len(set(r.submission_id for r in results)),
            'submissions_checked': latest_check.total_comparisons,
            'high_similarity_count': len(high_similarity),
            'medium_similarity_count': len(medium_similarity),
            'low_similarity_count': len(low_similarity),
            'flagged_pairs': flagged_pairs,
            'average_similarity': avg_similarity,
            'max_similarity': max_similarity,
            'processing_time_seconds': latest_check.processing_time_seconds,
            'check_completed_at': latest_check.completed_at
        }
