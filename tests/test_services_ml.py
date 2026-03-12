import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from unittest.mock import MagicMock, patch
from sqlalchemy.orm import Session

from src.ml.ml_service import MLService


@pytest.mark.unit
class TestMLService:
    """Unit tests for MLService"""

    @patch('src.ml.ml_service.StudentPerformanceDataPipeline')
    @patch('src.ml.ml_service.StudentFeatureEngineering')
    def test_extract_and_prepare_features(
        self, mock_feature_eng, mock_pipeline, db_session: Session
    ):
        """Test extracting and preparing features"""
        mock_pipeline_instance = MagicMock()
        mock_pipeline.return_value = mock_pipeline_instance
        
        mock_feature_eng_instance = MagicMock()
        mock_feature_eng.return_value = mock_feature_eng_instance
        
        raw_data = {
            'attendance': pd.DataFrame({
                'student_id': [1, 2],
                'date': [date.today(), date.today()],
                'status': ['present', 'present']
            }),
            'assignments': pd.DataFrame(),
            'exams': pd.DataFrame()
        }
        mock_pipeline_instance.extract_all_data.return_value = raw_data
        
        feature_matrix = pd.DataFrame({
            'student_id': [1, 2],
            'attendance_percentage': [95.0, 90.0]
        })
        mock_feature_eng_instance.build_feature_matrix.return_value = feature_matrix
        
        service = MLService(db_session)
        result = service.extract_and_prepare_features(
            institution_id=1,
            student_ids=[1, 2]
        )
        
        assert isinstance(result, pd.DataFrame)
        mock_pipeline_instance.extract_all_data.assert_called_once()
        mock_feature_eng_instance.build_feature_matrix.assert_called_once()

    @patch('src.ml.ml_service.StudentPerformanceDataPipeline')
    @patch('src.ml.ml_service.StudentFeatureEngineering')
    @patch('src.ml.ml_service.TrainingDataPreparation')
    def test_prepare_training_dataset(
        self, mock_train_prep, mock_feature_eng, mock_pipeline, db_session: Session
    ):
        """Test preparing training dataset"""
        mock_pipeline_instance = MagicMock()
        mock_pipeline.return_value = mock_pipeline_instance
        
        mock_feature_eng_instance = MagicMock()
        mock_feature_eng.return_value = mock_feature_eng_instance
        
        raw_data = {
            'attendance': pd.DataFrame(),
            'assignments': pd.DataFrame(),
            'exams': pd.DataFrame()
        }
        mock_pipeline_instance.extract_all_data.return_value = raw_data
        
        feature_matrix = pd.DataFrame({
            'student_id': [1, 2, 3],
            'attendance_percentage': [95.0, 90.0, 85.0],
            'avg_score': [80.0, 75.0, 70.0]
        })
        mock_feature_eng_instance.build_feature_matrix.return_value = feature_matrix
        
        mock_train_prep_instance = MagicMock()
        mock_train_prep.return_value = mock_train_prep_instance
        
        splits = {
            'X_train': np.array([[95.0, 80.0], [90.0, 75.0]]),
            'X_test': np.array([[85.0, 70.0]]),
            'y_train': np.array([1, 1]),
            'y_test': np.array([0]),
            'feature_names': ['attendance_percentage', 'avg_score']
        }
        mock_train_prep_instance.prepare_training_data.return_value = splits
        
        service = MLService(db_session)
        service.data_validator.check_data_quality = MagicMock(return_value={
            'missing_percentage': 0.0,
            'total_samples': 3,
            'total_features': 2
        })
        
        result = service.prepare_training_dataset(
            institution_id=1,
            test_size=0.2,
            normalize=True
        )
        
        assert 'X_train' in result
        assert 'X_test' in result
        assert 'quality_report' in result

    @patch('src.ml.ml_service.StudentPerformanceDataPipeline')
    @patch('src.ml.ml_service.StudentFeatureEngineering')
    def test_prepare_training_dataset_empty_data(
        self, mock_feature_eng, mock_pipeline, db_session: Session
    ):
        """Test preparing training dataset with empty data"""
        mock_pipeline_instance = MagicMock()
        mock_pipeline.return_value = mock_pipeline_instance
        
        mock_feature_eng_instance = MagicMock()
        mock_feature_eng.return_value = mock_feature_eng_instance
        
        raw_data = {
            'attendance': pd.DataFrame(),
            'assignments': pd.DataFrame(),
            'exams': pd.DataFrame()
        }
        mock_pipeline_instance.extract_all_data.return_value = raw_data
        mock_feature_eng_instance.build_feature_matrix.return_value = pd.DataFrame()
        
        service = MLService(db_session)
        
        with pytest.raises(ValueError) as exc_info:
            service.prepare_training_dataset(institution_id=1)
        
        assert "No data available" in str(exc_info.value)

    @patch('src.ml.ml_service.StudentPerformanceDataPipeline')
    @patch('src.ml.ml_service.StudentFeatureEngineering')
    def test_get_student_performance_summary(
        self, mock_feature_eng, mock_pipeline, db_session: Session
    ):
        """Test getting student performance summary"""
        mock_pipeline_instance = MagicMock()
        mock_pipeline.return_value = mock_pipeline_instance
        
        mock_feature_eng_instance = MagicMock()
        mock_feature_eng.return_value = mock_feature_eng_instance
        
        raw_data = {
            'attendance': pd.DataFrame({
                'student_id': [1],
                'subject_id': [1],
                'status': ['present']
            }),
            'assignments': pd.DataFrame({
                'student_id': [1],
                'subject_id': [1],
                'score': [85.0],
                'total_marks': [100.0]
            }),
            'exams': pd.DataFrame({
                'student_id': [1],
                'subject_id': [1],
                'score': [90.0],
                'total_marks': [100.0]
            })
        }
        mock_pipeline_instance.extract_all_data.return_value = raw_data
        
        mock_feature_eng_instance.calculate_attendance_percentage.return_value = pd.DataFrame({
            'attendance_percentage': [95.0]
        })
        mock_feature_eng_instance.calculate_subject_wise_attendance.return_value = pd.DataFrame()
        mock_feature_eng_instance.calculate_assignment_scores.return_value = pd.DataFrame({
            'avg_assignment_score': [85.0]
        })
        mock_feature_eng_instance.calculate_subject_wise_assignment_scores.return_value = pd.DataFrame()
        mock_feature_eng_instance.calculate_chapter_wise_performance.return_value = pd.DataFrame()
        mock_feature_eng_instance.calculate_exam_performance.return_value = pd.DataFrame({
            'avg_exam_score': [90.0]
        })
        mock_feature_eng_instance.calculate_test_trends.return_value = pd.DataFrame()
        mock_feature_eng_instance.calculate_subject_wise_exam_performance.return_value = pd.DataFrame()
        
        service = MLService(db_session)
        summary = service.get_student_performance_summary(
            institution_id=1,
            student_id=1
        )
        
        assert summary['student_id'] == 1
        assert 'attendance_percentage' in summary
        assert summary['attendance_percentage'] == 95.0

    @patch('src.ml.ml_service.StudentPerformanceDataPipeline')
    @patch('src.ml.ml_service.StudentFeatureEngineering')
    def test_get_batch_performance_summary(
        self, mock_feature_eng, mock_pipeline, db_session: Session
    ):
        """Test getting batch performance summary"""
        mock_pipeline_instance = MagicMock()
        mock_pipeline.return_value = mock_pipeline_instance
        
        mock_feature_eng_instance = MagicMock()
        mock_feature_eng.return_value = mock_feature_eng_instance
        
        raw_data = {
            'attendance': pd.DataFrame(),
            'assignments': pd.DataFrame(),
            'exams': pd.DataFrame()
        }
        mock_pipeline_instance.extract_all_data.return_value = raw_data
        
        feature_matrix = pd.DataFrame({
            'student_id': [1, 2, 3],
            'attendance_percentage': [95.0, 90.0, 85.0],
            'avg_score': [80.0, 75.0, 70.0]
        })
        mock_feature_eng_instance.build_feature_matrix.return_value = feature_matrix
        
        service = MLService(db_session)
        result = service.get_batch_performance_summary(
            institution_id=1,
            student_ids=[1, 2, 3]
        )
        
        assert isinstance(result, pd.DataFrame)
        assert len(result) == 3

    @patch('src.ml.ml_service.StudentPerformanceDataPipeline')
    @patch('src.ml.ml_service.StudentFeatureEngineering')
    def test_identify_at_risk_students(
        self, mock_feature_eng, mock_pipeline, db_session: Session
    ):
        """Test identifying at-risk students"""
        mock_pipeline_instance = MagicMock()
        mock_pipeline.return_value = mock_pipeline_instance
        
        mock_feature_eng_instance = MagicMock()
        mock_feature_eng.return_value = mock_feature_eng_instance
        
        raw_data = {
            'attendance': pd.DataFrame(),
            'assignments': pd.DataFrame(),
            'exams': pd.DataFrame()
        }
        mock_pipeline_instance.extract_all_data.return_value = raw_data
        
        feature_matrix = pd.DataFrame({
            'student_id': [1, 2, 3],
            'attendance_percentage': [70.0, 80.0, 90.0],
            'avg_assignment_score': [55.0, 65.0, 85.0],
            'avg_exam_score': [45.0, 60.0, 80.0],
            'exam_trend_slope': [-8.0, -3.0, 5.0]
        })
        mock_feature_eng_instance.build_feature_matrix.return_value = feature_matrix
        
        service = MLService(db_session)
        at_risk = service.identify_at_risk_students(
            institution_id=1,
            attendance_threshold=75.0,
            assignment_threshold=60.0,
            exam_threshold=50.0
        )
        
        assert isinstance(at_risk, list)
        assert len(at_risk) >= 1
        assert at_risk[0]['student_id'] == 1
        assert at_risk[0]['risk_score'] > 0

    @patch('src.ml.ml_service.StudentPerformanceDataPipeline')
    @patch('src.ml.ml_service.StudentFeatureEngineering')
    def test_identify_at_risk_students_empty_data(
        self, mock_feature_eng, mock_pipeline, db_session: Session
    ):
        """Test identifying at-risk students with empty data"""
        mock_pipeline_instance = MagicMock()
        mock_pipeline.return_value = mock_pipeline_instance
        
        mock_feature_eng_instance = MagicMock()
        mock_feature_eng.return_value = mock_feature_eng_instance
        
        raw_data = {
            'attendance': pd.DataFrame(),
            'assignments': pd.DataFrame(),
            'exams': pd.DataFrame()
        }
        mock_pipeline_instance.extract_all_data.return_value = raw_data
        mock_feature_eng_instance.build_feature_matrix.return_value = pd.DataFrame()
        
        service = MLService(db_session)
        at_risk = service.identify_at_risk_students(institution_id=1)
        
        assert at_risk == []

    @patch('src.ml.ml_service.StudentPerformanceDataPipeline')
    @patch('src.ml.ml_service.StudentFeatureEngineering')
    def test_get_subject_difficulty_analysis(
        self, mock_feature_eng, mock_pipeline, db_session: Session
    ):
        """Test getting subject difficulty analysis"""
        mock_pipeline_instance = MagicMock()
        mock_pipeline.return_value = mock_pipeline_instance
        
        mock_feature_eng_instance = MagicMock()
        mock_feature_eng.return_value = mock_feature_eng_instance
        
        raw_data = {
            'attendance': pd.DataFrame(),
            'assignments': pd.DataFrame({
                'student_id': [1, 2],
                'subject_id': [1, 1],
                'score': [45.0, 50.0]
            }),
            'exams': pd.DataFrame({
                'student_id': [1, 2],
                'subject_id': [1, 1],
                'score': [48.0, 52.0]
            })
        }
        mock_pipeline_instance.extract_all_data.return_value = raw_data
        
        mock_feature_eng_instance.calculate_subject_wise_assignment_scores.return_value = pd.DataFrame({
            'student_id': [1, 2],
            'subject_id': [1, 1],
            'subject_avg_assignment_score': [47.5, 47.5]
        })
        
        mock_feature_eng_instance.calculate_subject_wise_exam_performance.return_value = pd.DataFrame({
            'student_id': [1, 2],
            'subject_id': [1, 1],
            'subject_avg_exam_score': [50.0, 50.0]
        })
        
        service = MLService(db_session)
        analysis = service.get_subject_difficulty_analysis(institution_id=1)
        
        assert isinstance(analysis, list)
        assert len(analysis) >= 1
        assert 'subject_id' in analysis[0]
        assert 'difficulty_level' in analysis[0]

    @patch('src.ml.ml_service.StudentPerformanceDataPipeline')
    @patch('src.ml.ml_service.StudentFeatureEngineering')
    def test_get_subject_difficulty_analysis_empty_data(
        self, mock_feature_eng, mock_pipeline, db_session: Session
    ):
        """Test subject difficulty analysis with empty data"""
        mock_pipeline_instance = MagicMock()
        mock_pipeline.return_value = mock_pipeline_instance
        
        mock_feature_eng_instance = MagicMock()
        mock_feature_eng.return_value = mock_feature_eng_instance
        
        raw_data = {
            'attendance': pd.DataFrame(),
            'assignments': pd.DataFrame(),
            'exams': pd.DataFrame()
        }
        mock_pipeline_instance.extract_all_data.return_value = raw_data
        
        mock_feature_eng_instance.calculate_subject_wise_assignment_scores.return_value = pd.DataFrame()
        mock_feature_eng_instance.calculate_subject_wise_exam_performance.return_value = pd.DataFrame()
        
        service = MLService(db_session)
        analysis = service.get_subject_difficulty_analysis(institution_id=1)
        
        assert analysis == []

    @patch('src.ml.ml_service.StudentPerformanceDataPipeline')
    @patch('src.ml.ml_service.StudentFeatureEngineering')
    def test_extract_features_with_date_range(
        self, mock_feature_eng, mock_pipeline, db_session: Session
    ):
        """Test extracting features with date range"""
        mock_pipeline_instance = MagicMock()
        mock_pipeline.return_value = mock_pipeline_instance
        
        mock_feature_eng_instance = MagicMock()
        mock_feature_eng.return_value = mock_feature_eng_instance
        
        raw_data = {
            'attendance': pd.DataFrame(),
            'assignments': pd.DataFrame(),
            'exams': pd.DataFrame()
        }
        mock_pipeline_instance.extract_all_data.return_value = raw_data
        
        feature_matrix = pd.DataFrame({
            'student_id': [1, 2],
            'attendance_percentage': [95.0, 90.0]
        })
        mock_feature_eng_instance.build_feature_matrix.return_value = feature_matrix
        
        service = MLService(db_session)
        start_date = date(2024, 1, 1)
        end_date = date(2024, 12, 31)
        
        result = service.extract_and_prepare_features(
            institution_id=1,
            start_date=start_date,
            end_date=end_date
        )
        
        assert isinstance(result, pd.DataFrame)
        mock_pipeline_instance.extract_all_data.assert_called_once_with(
            institution_id=1,
            student_ids=None,
            start_date=start_date,
            end_date=end_date
        )
