"""
Configuration settings for the Smart Content Recommendation Engine.
Centralized configuration for all recommendation algorithms and thresholds.
"""

from typing import Dict, Any


class CollaborativeFilteringConfig:
    """Configuration for collaborative filtering algorithm"""
    
    SIMILARITY_THRESHOLD = 0.5
    MIN_COMMON_CHAPTERS = 3
    MAX_SIMILAR_STUDENTS = 20
    
    PEER_MATERIAL_LIMIT = 10
    
    SIMILARITY_CACHE_TTL_SECONDS = 3600
    
    PERFORMANCE_VECTOR_WEIGHTS = {
        'mastery_score': 1.0,
        'success_rate': 0.8,
        'average_score': 0.6
    }


class ContentEffectivenessConfig:
    """Configuration for content effectiveness scoring"""
    
    IMPROVEMENT_WINDOW_DAYS = 30
    
    MIN_ACCESSES_FOR_SCORING = 5
    MIN_STUDENTS_FOR_SCORING = 3
    
    EFFECTIVENESS_WEIGHTS = {
        'improvement': 0.5,
        'engagement': 0.2,
        'correlation': 0.3
    }
    
    ENGAGEMENT_WEIGHTS = {
        'views': 0.4,
        'downloads': 0.3,
        'accesses': 0.3
    }
    
    MAX_VIEW_COUNT_NORMALIZATION = 100
    MAX_DOWNLOAD_COUNT_NORMALIZATION = 50
    MAX_ACCESS_COUNT_NORMALIZATION = 50
    
    IMPROVEMENT_NORMALIZATION_FACTOR = 20.0
    
    RECALCULATION_INTERVAL_HOURS = 24


class DifficultyDetectionConfig:
    """Configuration for difficulty level detection"""
    
    DIFFICULTY_THRESHOLDS = {
        'very_easy': 30,
        'easy': 50,
        'medium': 70,
        'hard': 85,
        'very_hard': 100
    }
    
    CONFIDENCE_LEVELS = {
        'very_easy': 0.9,
        'easy': 0.85,
        'medium': 0.8,
        'hard': 0.85,
        'very_hard': 0.9
    }
    
    MIN_PERFORMANCE_DATA_POINTS = 5


class LearningStyleConfig:
    """Configuration for multi-modal learning style detection"""
    
    VARK_DEFAULT_SCORES = {
        'visual': 0.25,
        'auditory': 0.25,
        'reading_writing': 0.25,
        'kinesthetic': 0.25
    }
    
    MATERIAL_TYPE_MAPPING = {
        'video': 'visual',
        'audio': 'auditory',
        'pdf': 'reading_writing',
        'document': 'reading_writing',
        'presentation': ['visual', 'reading_writing'],
    }
    
    QUIZ_KINESTHETIC_WEIGHT = 0.5
    
    MIN_ACCESSES_FOR_DETECTION = 10
    
    STYLE_CONFIDENCE_THRESHOLD = 0.35
    
    PREFERENCE_CACHE_TTL_SECONDS = 86400


class StudyPathConfig:
    """Configuration for study path sequencing"""
    
    PRIORITY_WEIGHTS = {
        'weakness': 50.0,
        'low_mastery': 0.3,
        'sequence': 0.1
    }
    
    BASE_HOURS_PER_TOPIC = 2.0
    
    MASTERY_MULTIPLIER_RANGE = (1.0, 2.0)
    
    MAX_CHAPTERS_PER_PATH = 20
    
    PREREQUISITE_STRICT_MODE = False


class ExternalContentConfig:
    """Configuration for external content library integration"""
    
    ENABLED_SOURCES = [
        'khan_academy',
        'youtube_edu',
        'openstax',
        'coursera',
        'mit_ocw'
    ]
    
    API_KEYS = {
        'khan_academy': None,
        'youtube': None,
        'coursera': None,
    }
    
    SEARCH_RESULT_LIMITS = {
        'khan_academy': 5,
        'youtube_edu': 5,
        'openstax': 5,
        'coursera': 3,
        'mit_ocw': 3
    }
    
    CACHE_TTL_SECONDS = 604800
    
    DEFAULT_LANGUAGE = 'en'
    
    QUALITY_FILTERS = {
        'min_rating': 4.0,
        'min_views': 100,
        'verified_only': False
    }


class RecommendationMergingConfig:
    """Configuration for merging recommendations from multiple sources"""
    
    SOURCE_WEIGHTS = {
        'learning_style': 0.4,
        'difficulty_match': 0.3,
        'peer_success': 0.3,
        'effectiveness': 0.2
    }
    
    MAX_RECOMMENDATIONS = 20
    
    DIVERSITY_THRESHOLD = 0.7
    
    MIN_SCORE_THRESHOLD = 0.3
    
    DEDUPLICATION_ENABLED = True


class PerformanceConfig:
    """Configuration for performance optimization"""
    
    ENABLE_CACHING = True
    
    CACHE_TTL = {
        'similar_students': 3600,
        'learning_style': 86400,
        'effectiveness_scores': 43200,
        'external_content': 604800,
        'study_paths': 7200
    }
    
    BATCH_SIZE = {
        'effectiveness_calculation': 100,
        'similarity_calculation': 50,
        'recommendation_generation': 20
    }
    
    ENABLE_ASYNC_PROCESSING = True
    
    MAX_WORKERS = 4
    
    QUERY_TIMEOUT_SECONDS = 30


class RecommendationConfig:
    """Main configuration class combining all sub-configurations"""
    
    collaborative_filtering = CollaborativeFilteringConfig()
    content_effectiveness = ContentEffectivenessConfig()
    difficulty_detection = DifficultyDetectionConfig()
    learning_style = LearningStyleConfig()
    study_path = StudyPathConfig()
    external_content = ExternalContentConfig()
    merging = RecommendationMergingConfig()
    performance = PerformanceConfig()
    
    DEBUG_MODE = False
    
    ENABLE_LOGGING = True
    LOG_LEVEL = 'INFO'
    
    ALGORITHM_VERSIONS = {
        'collaborative_filtering': '1.0',
        'effectiveness_scoring': '1.0',
        'difficulty_detection': '1.0',
        'learning_style': '1.0',
        'study_path': '1.0'
    }
    
    @classmethod
    def get_all_config(cls) -> Dict[str, Any]:
        """Get all configuration as a dictionary"""
        return {
            'collaborative_filtering': {
                'similarity_threshold': cls.collaborative_filtering.SIMILARITY_THRESHOLD,
                'min_common_chapters': cls.collaborative_filtering.MIN_COMMON_CHAPTERS,
                'max_similar_students': cls.collaborative_filtering.MAX_SIMILAR_STUDENTS,
            },
            'content_effectiveness': {
                'improvement_window_days': cls.content_effectiveness.IMPROVEMENT_WINDOW_DAYS,
                'min_accesses': cls.content_effectiveness.MIN_ACCESSES_FOR_SCORING,
                'weights': cls.content_effectiveness.EFFECTIVENESS_WEIGHTS,
            },
            'difficulty_detection': {
                'thresholds': cls.difficulty_detection.DIFFICULTY_THRESHOLDS,
                'confidence_levels': cls.difficulty_detection.CONFIDENCE_LEVELS,
            },
            'learning_style': {
                'default_scores': cls.learning_style.VARK_DEFAULT_SCORES,
                'min_accesses': cls.learning_style.MIN_ACCESSES_FOR_DETECTION,
            },
            'external_content': {
                'enabled_sources': cls.external_content.ENABLED_SOURCES,
                'search_limits': cls.external_content.SEARCH_RESULT_LIMITS,
            },
            'performance': {
                'enable_caching': cls.performance.ENABLE_CACHING,
                'cache_ttl': cls.performance.CACHE_TTL,
            }
        }


recommendation_config = RecommendationConfig()
