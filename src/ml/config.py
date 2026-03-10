"""
ML System Configuration

This module provides configuration settings for the ML prediction system.
"""

from typing import Dict, List, Any
from dataclasses import dataclass


@dataclass
class MLConfig:
    """ML System Configuration"""
    
    # Model Storage
    LOCAL_MODEL_DIR: str = "ml_models"
    USE_S3_STORAGE: bool = False
    
    # Default Training Parameters
    DEFAULT_TEST_SIZE: float = 0.2
    DEFAULT_CV_FOLDS: int = 5
    DEFAULT_RANDOM_STATE: int = 42
    DEFAULT_CONFIDENCE_LEVEL: float = 0.95
    
    # Cache Settings
    CACHE_TTL_PREDICTION: int = 3600  # 1 hour
    CACHE_TTL_METRICS: int = 1800     # 30 minutes
    CACHE_TTL_LIST: int = 600         # 10 minutes
    
    # Algorithm Defaults
    RANDOM_FOREST_PARAMS: Dict[str, Any] = None
    GRADIENT_BOOSTING_PARAMS: Dict[str, Any] = None
    RIDGE_PARAMS: Dict[str, Any] = None
    LASSO_PARAMS: Dict[str, Any] = None
    
    # Feature Engineering
    ROLLING_WINDOWS: List[int] = None
    LAG_PERIODS: List[int] = None
    
    # Model Performance Thresholds
    MIN_R2_SCORE: float = 0.4
    MIN_TRAINING_SAMPLES: int = 50
    
    # Prediction Limits
    MAX_BATCH_SIZE: int = 100
    MAX_SCENARIOS: int = 10
    
    def __post_init__(self):
        """Initialize default values"""
        if self.RANDOM_FOREST_PARAMS is None:
            self.RANDOM_FOREST_PARAMS = {
                'n_estimators': 100,
                'max_depth': 10,
                'min_samples_split': 5,
                'min_samples_leaf': 2,
                'max_features': 'sqrt',
                'bootstrap': True
            }
        
        if self.GRADIENT_BOOSTING_PARAMS is None:
            self.GRADIENT_BOOSTING_PARAMS = {
                'n_estimators': 100,
                'learning_rate': 0.1,
                'max_depth': 5,
                'min_samples_split': 5,
                'min_samples_leaf': 2,
                'subsample': 0.8
            }
        
        if self.RIDGE_PARAMS is None:
            self.RIDGE_PARAMS = {
                'alpha': 1.0,
                'solver': 'auto'
            }
        
        if self.LASSO_PARAMS is None:
            self.LASSO_PARAMS = {
                'alpha': 1.0,
                'max_iter': 1000
            }
        
        if self.ROLLING_WINDOWS is None:
            self.ROLLING_WINDOWS = [3, 7, 14, 30]
        
        if self.LAG_PERIODS is None:
            self.LAG_PERIODS = [1, 2, 3, 5, 10]
    
    def get_algorithm_params(self, algorithm: str) -> Dict[str, Any]:
        """Get default parameters for an algorithm"""
        params_map = {
            'random_forest': self.RANDOM_FOREST_PARAMS,
            'gradient_boosting': self.GRADIENT_BOOSTING_PARAMS,
            'ridge': self.RIDGE_PARAMS,
            'lasso': self.LASSO_PARAMS,
            'linear_regression': {}
        }
        return params_map.get(algorithm, {})
    
    def validate_training_config(
        self,
        test_size: float,
        cv_folds: int,
        confidence_level: float
    ) -> bool:
        """Validate training configuration"""
        if not 0.1 <= test_size <= 0.5:
            raise ValueError("test_size must be between 0.1 and 0.5")
        
        if not 2 <= cv_folds <= 10:
            raise ValueError("cv_folds must be between 2 and 10")
        
        if not 0.8 <= confidence_level <= 0.99:
            raise ValueError("confidence_level must be between 0.8 and 0.99")
        
        return True
    
    def validate_batch_size(self, batch_size: int) -> bool:
        """Validate batch prediction size"""
        if batch_size > self.MAX_BATCH_SIZE:
            raise ValueError(f"Batch size cannot exceed {self.MAX_BATCH_SIZE}")
        return True
    
    def validate_scenarios(self, num_scenarios: int) -> bool:
        """Validate number of scenarios"""
        if num_scenarios > self.MAX_SCENARIOS:
            raise ValueError(f"Number of scenarios cannot exceed {self.MAX_SCENARIOS}")
        return True


# Global configuration instance
ml_config = MLConfig()


class FeatureConfig:
    """Feature Engineering Configuration"""
    
    # Feature categories
    ATTENDANCE_FEATURES = [
        'attendance_percentage',
        'attendance_high',
        'attendance_medium',
        'attendance_low',
        'subject_attendance_percentage'
    ]
    
    ASSIGNMENT_FEATURES = [
        'avg_assignment_score',
        'total_assignments',
        'completed_assignments',
        'assignment_completion_rate',
        'missing_assignments',
        'subject_avg_assignment_score'
    ]
    
    EXAM_FEATURES = [
        'avg_exam_score',
        'exam_count',
        'exam_trend_slope',
        'highest_exam_score',
        'lowest_exam_score',
        'subject_avg_exam_score'
    ]
    
    COMPOSITE_FEATURES = [
        'overall_performance_score',
        'engagement_score',
        'performance_consistency'
    ]
    
    # Required features for basic predictions
    REQUIRED_FEATURES = [
        'attendance_percentage',
        'avg_assignment_score',
        'avg_exam_score'
    ]
    
    # Features to exclude from model training
    EXCLUDED_FEATURES = [
        'student_id',
        'institution_id',
        'created_at',
        'updated_at'
    ]
    
    @classmethod
    def get_all_feature_categories(cls) -> Dict[str, List[str]]:
        """Get all feature categories"""
        return {
            'attendance': cls.ATTENDANCE_FEATURES,
            'assignment': cls.ASSIGNMENT_FEATURES,
            'exam': cls.EXAM_FEATURES,
            'composite': cls.COMPOSITE_FEATURES
        }
    
    @classmethod
    def get_required_features(cls) -> List[str]:
        """Get required features"""
        return cls.REQUIRED_FEATURES
    
    @classmethod
    def should_exclude_feature(cls, feature_name: str) -> bool:
        """Check if feature should be excluded"""
        return feature_name in cls.EXCLUDED_FEATURES


class PredictionTypeConfig:
    """Configuration for different prediction types"""
    
    OVERALL_PERCENTAGE = {
        'target_column': 'exam_percentage',
        'preferred_algorithm': 'random_forest',
        'required_features': ['attendance_percentage', 'avg_assignment_score', 'avg_exam_score'],
        'min_samples': 50
    }
    
    EXAM_PERFORMANCE = {
        'target_column': 'exam_score',
        'preferred_algorithm': 'gradient_boosting',
        'required_features': ['avg_exam_score', 'exam_count', 'exam_trend_slope'],
        'min_samples': 30
    }
    
    SUBJECT_SCORE = {
        'target_column': 'subject_score',
        'preferred_algorithm': 'random_forest',
        'required_features': ['subject_avg_assignment_score', 'subject_avg_exam_score'],
        'min_samples': 30
    }
    
    PASS_FAIL = {
        'target_column': 'is_pass',
        'preferred_algorithm': 'random_forest',
        'required_features': ['attendance_percentage', 'avg_assignment_score', 'avg_exam_score'],
        'min_samples': 50
    }
    
    @classmethod
    def get_config(cls, prediction_type: str) -> Dict[str, Any]:
        """Get configuration for prediction type"""
        configs = {
            'overall_percentage': cls.OVERALL_PERCENTAGE,
            'exam_performance': cls.EXAM_PERFORMANCE,
            'subject_score': cls.SUBJECT_SCORE,
            'pass_fail': cls.PASS_FAIL
        }
        return configs.get(prediction_type.lower(), cls.OVERALL_PERCENTAGE)


# Export configuration instances
__all__ = [
    'MLConfig',
    'FeatureConfig',
    'PredictionTypeConfig',
    'ml_config'
]
