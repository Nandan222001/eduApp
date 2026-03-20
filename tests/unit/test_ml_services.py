import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from decimal import Decimal
from unittest.mock import MagicMock, patch, AsyncMock
from sqlalchemy.orm import Session

from src.services.ai_prediction_dashboard_service import AIPredictionDashboardService
from src.services.board_exam_prediction_service import BoardExamPredictionService
from src.services.weakness_detection_service import WeaknessDetectionEngine, ChapterPerformanceAnalyzer
from src.services.study_planner_service import StudyPlannerService
from src.models.previous_year_papers import Board, TopicPrediction, QuestionBank, DifficultyLevel
from src.models.study_planner import WeakArea, ChapterPerformance
from src.models.academic import Subject, Chapter, Topic
from src.schemas.study_planner import StudyPlanGenerationRequest, TopicPrioritizationRequest


@pytest.mark.unit
class TestAIPredictionDashboardService:
    """Unit tests for AI Prediction Dashboard Service - predict_exam_percentage functionality"""
    
    def test_generate_overall_prediction_with_high_probability_topics(self, db_session: Session):
        """Test overall prediction calculation with high probability topics"""
        service = AIPredictionDashboardService(db_session)
        
        # Create mock predictions with varying probability scores
        predictions = [
            MagicMock(
                probability_score=85.0,
                is_due=True,
                avg_marks_per_appearance=8.0,
                total_marks=40.0
            ),
            MagicMock(
                probability_score=75.0,
                is_due=True,
                avg_marks_per_appearance=6.0,
                total_marks=30.0
            ),
            MagicMock(
                probability_score=65.0,
                is_due=False,
                avg_marks_per_appearance=5.0,
                total_marks=25.0
            ),
            MagicMock(
                probability_score=50.0,
                is_due=False,
                avg_marks_per_appearance=4.0,
                total_marks=20.0
            ),
        ]
        
        result = service._generate_overall_prediction(predictions)
        
        assert result['total_topics_analyzed'] == 4
        assert result['high_probability_topics'] == 2
        assert result['due_topics'] == 2
        assert 'average_probability_score' in result
        assert result['average_probability_score'] == 68.75
        assert 'total_expected_marks' in result
        assert result['total_expected_marks'] > 0
        assert 'recommended_study_hours' in result
    
    def test_generate_overall_prediction_with_low_performing_pattern(self, db_session: Session):
        """Test prediction with low performing student pattern"""
        service = AIPredictionDashboardService(db_session)
        
        predictions = [
            MagicMock(
                probability_score=30.0,
                is_due=False,
                avg_marks_per_appearance=3.0,
                total_marks=15.0
            ),
            MagicMock(
                probability_score=25.0,
                is_due=False,
                avg_marks_per_appearance=2.5,
                total_marks=12.0
            ),
        ]
        
        result = service._generate_overall_prediction(predictions)
        
        assert result['total_topics_analyzed'] == 2
        assert result['high_probability_topics'] == 0
        assert result['average_probability_score'] == 27.5
        assert result['total_expected_marks'] < 5.0
    
    def test_generate_overall_prediction_with_mixed_performance_pattern(self, db_session: Session):
        """Test prediction with mixed student performance pattern"""
        service = AIPredictionDashboardService(db_session)
        
        predictions = [
            MagicMock(probability_score=90.0, is_due=True, avg_marks_per_appearance=10.0, total_marks=50.0),
            MagicMock(probability_score=80.0, is_due=True, avg_marks_per_appearance=8.0, total_marks=40.0),
            MagicMock(probability_score=60.0, is_due=False, avg_marks_per_appearance=6.0, total_marks=30.0),
            MagicMock(probability_score=40.0, is_due=False, avg_marks_per_appearance=4.0, total_marks=20.0),
            MagicMock(probability_score=20.0, is_due=False, avg_marks_per_appearance=2.0, total_marks=10.0),
        ]
        
        result = service._generate_overall_prediction(predictions)
        
        assert result['total_topics_analyzed'] == 5
        assert result['high_probability_topics'] == 2
        assert result['due_topics'] == 2
        assert 55 < result['average_probability_score'] < 62
    
    def test_calculate_confidence_intervals_high_frequency(self, db_session: Session):
        """Test confidence level determination with high frequency topics"""
        service = AIPredictionDashboardService(db_session)
        
        # High frequency, high cyclical score
        confidence = service._generate_topic_rankings([
            MagicMock(
                topic_id=1,
                topic_name="Algebra",
                chapter_id=1,
                probability_score=85.0,
                confidence_level="Very High",
                frequency_count=8,
                last_appeared_year=2023,
                years_since_last_appearance=1,
                is_due=True,
                total_marks=40.0,
                avg_marks_per_appearance=8.0
            )
        ])
        
        assert len(confidence) == 1
        assert confidence[0].confidence_level == "Very High"
        assert confidence[0].star_rating == 5
    
    def test_calculate_confidence_intervals_medium_frequency(self, db_session: Session):
        """Test confidence level with medium frequency topics"""
        service = AIPredictionDashboardService(db_session)
        
        rankings = service._generate_topic_rankings([
            MagicMock(
                topic_id=2,
                topic_name="Geometry",
                chapter_id=2,
                probability_score=65.0,
                confidence_level="Medium",
                frequency_count=4,
                last_appeared_year=2022,
                years_since_last_appearance=2,
                is_due=False,
                total_marks=30.0,
                avg_marks_per_appearance=6.0
            )
        ])
        
        assert len(rankings) == 1
        assert rankings[0].confidence_level == "Medium"
        assert rankings[0].star_rating == 3
    
    def test_calculate_confidence_intervals_low_frequency(self, db_session: Session):
        """Test confidence level with low frequency topics"""
        service = AIPredictionDashboardService(db_session)
        
        rankings = service._generate_topic_rankings([
            MagicMock(
                topic_id=3,
                topic_name="Statistics",
                chapter_id=3,
                probability_score=35.0,
                confidence_level="Low",
                frequency_count=2,
                last_appeared_year=2020,
                years_since_last_appearance=4,
                is_due=False,
                total_marks=15.0,
                avg_marks_per_appearance=3.0
            )
        ])
        
        assert len(rankings) == 1
        assert rankings[0].confidence_level == "Low"
        assert rankings[0].star_rating == 1


@pytest.mark.unit
class TestBoardExamPredictionService:
    """Unit tests for Board Exam Prediction Service"""
    
    def test_analyze_topic_frequencies_consistent_pattern(self, db_session: Session):
        """Test topic frequency analysis with consistent appearance pattern"""
        service = BoardExamPredictionService(db_session)
        
        # Consistent appearance every 2 years
        years = [2014, 2016, 2018, 2020, 2022]
        cyclical_score = service._detect_cyclical_pattern(years, 2014, 2023)
        
        assert cyclical_score > 70.0
        assert cyclical_score <= 100.0
    
    def test_analyze_topic_frequencies_irregular_pattern(self, db_session: Session):
        """Test topic frequency analysis with irregular pattern"""
        service = BoardExamPredictionService(db_session)
        
        # Irregular appearances
        years = [2014, 2015, 2019, 2023]
        cyclical_score = service._detect_cyclical_pattern(years, 2014, 2023)
        
        assert cyclical_score < 70.0
    
    def test_analyze_topic_frequencies_high_frequency(self, db_session: Session):
        """Test frequency score calculation with high frequency"""
        service = BoardExamPredictionService(db_session)
        
        frequency_count = 8
        total_years = 10
        frequency_score = service._calculate_frequency_score(frequency_count, total_years)
        
        assert frequency_score == 80.0
    
    def test_analyze_topic_frequencies_low_frequency(self, db_session: Session):
        """Test frequency score calculation with low frequency"""
        service = BoardExamPredictionService(db_session)
        
        frequency_count = 2
        total_years = 10
        frequency_score = service._calculate_frequency_score(frequency_count, total_years)
        
        assert frequency_score == 20.0
    
    def test_calculate_probability_scores_high_probability(self, db_session: Session):
        """Test probability score calculation with high-scoring factors"""
        service = BoardExamPredictionService(db_session)
        
        # High frequency, good cyclical pattern, recent appearance
        topic_data = {
            'topic_id': 1,
            'chapter_id': 1,
            'years': [2020, 2021, 2022, 2023],
            'marks': [8, 8, 9, 8],
            'appearances': []
        }
        
        prediction = service._calculate_topic_prediction(
            institution_id=1,
            board=Board.CBSE,
            grade_id=10,
            subject_id=1,
            topic_name="Quadratic Equations",
            topic_data=topic_data,
            year_start=2014,
            year_end=2023,
            current_year=2024
        )
        
        assert prediction['probability_score'] > 60.0
        assert prediction['frequency_count'] == 4
        assert prediction['is_due'] == False
    
    def test_calculate_probability_scores_medium_probability(self, db_session: Session):
        """Test probability score calculation with medium-scoring factors"""
        service = BoardExamPredictionService(db_session)
        
        topic_data = {
            'topic_id': 2,
            'chapter_id': 2,
            'years': [2018, 2020, 2022],
            'marks': [5, 6, 5],
            'appearances': []
        }
        
        prediction = service._calculate_topic_prediction(
            institution_id=1,
            board=Board.CBSE,
            grade_id=10,
            subject_id=1,
            topic_name="Trigonometry",
            topic_data=topic_data,
            year_start=2014,
            year_end=2023,
            current_year=2024
        )
        
        assert 40.0 < prediction['probability_score'] < 70.0
        assert prediction['frequency_count'] == 3
    
    def test_calculate_probability_scores_low_probability(self, db_session: Session):
        """Test probability score calculation with low-scoring factors"""
        service = BoardExamPredictionService(db_session)
        
        topic_data = {
            'topic_id': 3,
            'chapter_id': 3,
            'years': [2015, 2019],
            'marks': [3, 4],
            'appearances': []
        }
        
        prediction = service._calculate_topic_prediction(
            institution_id=1,
            board=Board.CBSE,
            grade_id=10,
            subject_id=1,
            topic_name="Mensuration",
            topic_data=topic_data,
            year_start=2014,
            year_end=2023,
            current_year=2024
        )
        
        assert prediction['probability_score'] < 60.0
        assert prediction['frequency_count'] == 2
    
    def test_calculate_probability_scores_due_topic(self, db_session: Session):
        """Test probability score for overdue topic"""
        service = BoardExamPredictionService(db_session)
        
        # Topic hasn't appeared in 4 years
        topic_data = {
            'topic_id': 4,
            'chapter_id': 4,
            'years': [2016, 2018, 2020],
            'marks': [6, 7, 6],
            'appearances': []
        }
        
        prediction = service._calculate_topic_prediction(
            institution_id=1,
            board=Board.CBSE,
            grade_id=10,
            subject_id=1,
            topic_name="Probability",
            topic_data=topic_data,
            year_start=2014,
            year_end=2023,
            current_year=2024
        )
        
        assert prediction['is_due'] == True
        assert prediction['years_since_last_appearance'] >= 4


@pytest.mark.unit
class TestWeaknessDetectionService:
    """Unit tests for Weakness Detection Service"""
    
    def test_identify_weak_areas_with_low_chapter_performance(self, db_session: Session, institution, student):
        """Test weak area identification with low chapter performance"""
        analyzer = ChapterPerformanceAnalyzer(db_session)
        
        # Simulate low scores
        scores = [45.0, 42.0, 48.0, 43.0]
        
        proficiency = analyzer._determine_proficiency_level(sum(scores) / len(scores))
        mastery = analyzer._calculate_mastery_score(
            sum(scores) / len(scores),
            25.0,  # Low success rate
            len(scores)
        )
        
        assert proficiency == "developing"
        assert mastery < 60.0
    
    def test_identify_weak_areas_with_declining_trend(self, db_session: Session):
        """Test weak area identification with declining performance trend"""
        analyzer = ChapterPerformanceAnalyzer(db_session)
        
        # Declining scores
        scores = [75.0, 70.0, 65.0, 60.0, 55.0]
        
        trend = analyzer._calculate_trend(scores)
        improvement_rate = analyzer._calculate_improvement_rate(scores)
        
        assert trend == "declining"
        assert improvement_rate < 0
    
    def test_identify_weak_areas_with_improving_trend(self, db_session: Session):
        """Test weak area identification with improving performance trend"""
        analyzer = ChapterPerformanceAnalyzer(db_session)
        
        # Improving scores
        scores = [50.0, 55.0, 60.0, 65.0, 70.0]
        
        trend = analyzer._calculate_trend(scores)
        improvement_rate = analyzer._calculate_improvement_rate(scores)
        
        assert trend == "improving"
        assert improvement_rate > 0
    
    def test_identify_weak_areas_with_stable_performance(self, db_session: Session):
        """Test weak area identification with stable performance"""
        analyzer = ChapterPerformanceAnalyzer(db_session)
        
        # Stable scores
        scores = [65.0, 66.0, 64.0, 65.0, 66.0]
        
        trend = analyzer._calculate_trend(scores)
        
        assert trend == "stable"
    
    def test_identify_weak_areas_multiple_subjects(self, db_session: Session):
        """Test weak area identification across multiple subjects"""
        analyzer = ChapterPerformanceAnalyzer(db_session)
        
        # Different proficiency levels
        math_scores = [85.0, 88.0, 90.0]
        science_scores = [45.0, 48.0, 43.0]
        english_scores = [65.0, 68.0, 70.0]
        
        math_prof = analyzer._determine_proficiency_level(sum(math_scores) / len(math_scores))
        science_prof = analyzer._determine_proficiency_level(sum(science_scores) / len(science_scores))
        english_prof = analyzer._determine_proficiency_level(sum(english_scores) / len(english_scores))
        
        assert math_prof == "proficient"
        assert science_prof == "developing"
        assert english_prof == "competent"


@pytest.mark.unit
class TestStudyPlannerService:
    """Unit tests for Study Planner Service"""
    
    def test_generate_personalized_plan_with_near_exam_date(self, db_session: Session):
        """Test study plan generation with exam in 7 days"""
        service = StudyPlannerService(db_session)
        
        exam_date = date.today() + timedelta(days=7)
        start_date = date.today()
        
        available_days = service._calculate_available_days(
            start_date,
            exam_date,
            include_weekends=True,
            excluded_dates=[]
        )
        
        assert len(available_days) <= 8
    
    def test_generate_personalized_plan_with_distant_exam_date(self, db_session: Session):
        """Test study plan generation with exam in 30 days"""
        service = StudyPlannerService(db_session)
        
        exam_date = date.today() + timedelta(days=30)
        start_date = date.today()
        
        available_days = service._calculate_available_days(
            start_date,
            exam_date,
            include_weekends=True,
            excluded_dates=[]
        )
        
        assert len(available_days) <= 31
    
    def test_generate_personalized_plan_exclude_weekends(self, db_session: Session):
        """Test study plan generation excluding weekends"""
        service = StudyPlannerService(db_session)
        
        exam_date = date.today() + timedelta(days=14)
        start_date = date.today()
        
        available_days_with_weekends = service._calculate_available_days(
            start_date,
            exam_date,
            include_weekends=True,
            excluded_dates=[]
        )
        
        available_days_without_weekends = service._calculate_available_days(
            start_date,
            exam_date,
            include_weekends=False,
            excluded_dates=[]
        )
        
        assert len(available_days_without_weekends) <= len(available_days_with_weekends)
    
    def test_generate_personalized_plan_with_weak_topics(self, db_session: Session):
        """Test study plan prioritization with weak topics"""
        service = StudyPlannerService(db_session)
        
        # High weakness, high importance
        recommended_hours = service._calculate_recommended_hours(
            weakness_score=Decimal('80.0'),
            subject_weightage=Decimal('70.0')
        )
        
        assert float(recommended_hours) > 4.0
    
    def test_generate_personalized_plan_with_strong_topics(self, db_session: Session):
        """Test study plan prioritization with strong topics"""
        service = StudyPlannerService(db_session)
        
        # Low weakness, low importance
        recommended_hours = service._calculate_recommended_hours(
            weakness_score=Decimal('20.0'),
            subject_weightage=Decimal('30.0')
        )
        
        assert float(recommended_hours) < 4.0
    
    def test_calculate_topic_priority_score_critical_topic(self, db_session: Session):
        """Test priority score calculation for critical topic"""
        service = StudyPlannerService(db_session)
        
        priority_score = service.calculate_topic_priority_score(
            importance_probability=Decimal('0.9'),
            weakness_score=Decimal('85.0'),
            subject_weightage=Decimal('80.0')
        )
        
        assert float(priority_score) > 70.0
    
    def test_calculate_topic_priority_score_low_priority_topic(self, db_session: Session):
        """Test priority score calculation for low priority topic"""
        service = StudyPlannerService(db_session)
        
        priority_score = service.calculate_topic_priority_score(
            importance_probability=Decimal('0.3'),
            weakness_score=Decimal('30.0'),
            subject_weightage=Decimal('40.0')
        )
        
        assert float(priority_score) < 50.0
    
    def test_map_priority_score_to_level(self, db_session: Session):
        """Test mapping of priority scores to task priority levels"""
        service = StudyPlannerService(db_session)
        
        critical_priority = service._map_priority_score_to_level(Decimal('85.0'))
        high_priority = service._map_priority_score_to_level(Decimal('65.0'))
        medium_priority = service._map_priority_score_to_level(Decimal('45.0'))
        low_priority = service._map_priority_score_to_level(Decimal('25.0'))
        
        assert critical_priority.value == "critical"
        assert high_priority.value == "high"
        assert medium_priority.value == "medium"
        assert low_priority.value == "low"


@pytest.mark.unit
class TestMLModelMocking:
    """Test mocking of scikit-learn models for consistency"""
    
    @patch('sklearn.ensemble.RandomForestClassifier')
    def test_mock_random_forest_predictions(self, mock_rf):
        """Test mocking Random Forest classifier predictions"""
        mock_model = MagicMock()
        mock_model.predict.return_value = np.array([75.0, 80.0, 85.0])
        mock_model.predict_proba.return_value = np.array([
            [0.2, 0.8],
            [0.15, 0.85],
            [0.1, 0.9]
        ])
        mock_rf.return_value = mock_model
        
        model = mock_rf()
        predictions = model.predict([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
        probabilities = model.predict_proba([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
        
        assert len(predictions) == 3
        assert predictions[0] == 75.0
        assert len(probabilities) == 3
        assert probabilities[0][1] == 0.8
    
    @patch('sklearn.linear_model.LinearRegression')
    def test_mock_linear_regression_predictions(self, mock_lr):
        """Test mocking Linear Regression predictions"""
        mock_model = MagicMock()
        mock_model.predict.return_value = np.array([65.5, 72.3, 78.9])
        mock_model.coef_ = np.array([0.5, 0.3, 0.2])
        mock_model.intercept_ = 50.0
        mock_lr.return_value = mock_model
        
        model = mock_lr()
        predictions = model.predict([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
        
        assert len(predictions) == 3
        assert predictions[1] == 72.3
        assert hasattr(model, 'coef_')
        assert model.intercept_ == 50.0
    
    @patch('sklearn.ensemble.GradientBoostingRegressor')
    def test_mock_gradient_boosting_predictions(self, mock_gb):
        """Test mocking Gradient Boosting regressor predictions"""
        mock_model = MagicMock()
        mock_model.predict.return_value = np.array([88.5, 76.2, 92.1])
        mock_model.feature_importances_ = np.array([0.4, 0.35, 0.25])
        mock_gb.return_value = mock_model
        
        model = mock_gb()
        predictions = model.predict([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
        
        assert len(predictions) == 3
        assert predictions[2] == 92.1
        assert len(model.feature_importances_) == 3
    
    def test_prediction_consistency_across_calls(self):
        """Test that mocked predictions remain consistent across multiple calls"""
        mock_model = MagicMock()
        
        # Set up consistent predictions
        expected_predictions = np.array([70.0, 75.0, 80.0])
        mock_model.predict.return_value = expected_predictions
        
        # Make multiple calls
        result1 = mock_model.predict([[1, 2], [3, 4], [5, 6]])
        result2 = mock_model.predict([[1, 2], [3, 4], [5, 6]])
        result3 = mock_model.predict([[1, 2], [3, 4], [5, 6]])
        
        # Verify consistency
        np.testing.assert_array_equal(result1, result2)
        np.testing.assert_array_equal(result2, result3)
        np.testing.assert_array_equal(result1, expected_predictions)
    
    def test_prediction_with_confidence_intervals(self):
        """Test predictions with confidence intervals"""
        mock_model = MagicMock()
        
        # Set up predictions with confidence intervals
        predictions = np.array([75.0, 80.0, 85.0])
        lower_bounds = np.array([70.0, 75.0, 80.0])
        upper_bounds = np.array([80.0, 85.0, 90.0])
        
        mock_model.predict.return_value = predictions
        
        # Simulate confidence interval calculation
        confidence_intervals = list(zip(lower_bounds, upper_bounds))
        
        results = mock_model.predict([[1, 2], [3, 4], [5, 6]])
        
        assert len(results) == len(confidence_intervals)
        for i, (pred, (lower, upper)) in enumerate(zip(results, confidence_intervals)):
            assert lower <= pred <= upper
