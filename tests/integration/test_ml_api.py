import pytest
import io
from datetime import datetime, date, timedelta
from decimal import Decimal
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.institution import Institution
from src.models.student import Student
from src.models.academic import Grade, Subject
from src.models.previous_year_papers import Board


@pytest.mark.integration
class TestAIPredictionDashboardAPI:
    """Integration tests for GET /api/v1/ai-prediction-dashboard/dashboard endpoint"""

    @patch('src.services.ai_prediction_dashboard_service.AIPredictionDashboardService.get_dashboard')
    async def test_get_ai_prediction_dashboard_success(
        self,
        mock_get_dashboard,
        client: TestClient,
        auth_headers: dict,
        student: Student,
        subject: Subject,
        grade: Grade
    ):
        mock_dashboard_data = {
            'board': Board.CBSE,
            'grade_id': grade.id,
            'subject_id': subject.id,
            'subject_name': subject.name,
            'generated_at': datetime.utcnow(),
            'topic_rankings': [
                {
                    'topic_id': 1,
                    'topic_name': 'Quadratic Equations',
                    'chapter_name': 'Algebra',
                    'probability_score': 85.5,
                    'star_rating': 5,
                    'confidence_level': 'high',
                    'frequency_count': 12,
                    'last_appeared_year': 2023,
                    'years_since_last_appearance': 0,
                    'is_due': False,
                    'priority_tag': 'critical',
                    'expected_marks': 8.0,
                    'study_hours_recommended': 4.5
                },
                {
                    'topic_id': 2,
                    'topic_name': 'Trigonometry',
                    'chapter_name': 'Trigonometry',
                    'probability_score': 78.2,
                    'star_rating': 4,
                    'confidence_level': 'medium',
                    'frequency_count': 10,
                    'last_appeared_year': 2022,
                    'years_since_last_appearance': 1,
                    'is_due': True,
                    'priority_tag': 'high',
                    'expected_marks': 6.0,
                    'study_hours_recommended': 3.5
                }
            ],
            'predicted_blueprint': {
                'total_marks': 80,
                'duration_minutes': 180,
                'sections': [
                    {
                        'section_name': 'Section A',
                        'total_marks': 20,
                        'question_types': ['MCQ', 'Short Answer'],
                        'topics_included': ['Quadratic Equations', 'Linear Equations'],
                        'difficulty_distribution': {'easy': 10, 'medium': 8, 'hard': 2},
                        'bloom_level_distribution': {'remember': 6, 'understand': 8, 'apply': 6}
                    },
                    {
                        'section_name': 'Section B',
                        'total_marks': 60,
                        'question_types': ['Long Answer'],
                        'topics_included': ['Calculus', 'Probability'],
                        'difficulty_distribution': {'easy': 10, 'medium': 30, 'hard': 20},
                        'bloom_level_distribution': {'apply': 20, 'analyze': 25, 'create': 15}
                    }
                ],
                'topic_coverage': {'Algebra': 40.0, 'Calculus': 35.0, 'Probability': 25.0},
                'difficulty_breakdown': {'easy': 20, 'medium': 38, 'hard': 22}
            },
            'marks_distribution': [
                {'category': 'Algebra', 'marks': 32.0, 'percentage': 40.0, 'color': '#FF6384'},
                {'category': 'Calculus', 'marks': 28.0, 'percentage': 35.0, 'color': '#36A2EB'},
                {'category': 'Probability', 'marks': 20.0, 'percentage': 25.0, 'color': '#FFCE56'}
            ],
            'focus_areas': [
                {
                    'topic_id': 3,
                    'topic_name': 'Integration',
                    'chapter_name': 'Calculus',
                    'priority': 'critical',
                    'priority_score': 95.0,
                    'reason': 'High probability with low current performance',
                    'expected_impact': 'Up to 12 marks improvement',
                    'study_hours_needed': 6.0,
                    'resources': ['NCERT Chapter 7', 'RD Sharma Practice'],
                    'difficulty_level': 'hard'
                }
            ],
            'study_time_allocation': [
                {'category': 'High Priority Topics', 'hours': 15.0, 'percentage': 45.0, 'color': '#FF6384', 'description': 'Focus on critical areas'},
                {'category': 'Medium Priority Topics', 'hours': 12.0, 'percentage': 36.0, 'color': '#36A2EB', 'description': 'Regular practice needed'},
                {'category': 'Revision', 'hours': 6.3, 'percentage': 19.0, 'color': '#FFCE56', 'description': 'Review completed topics'}
            ],
            'overall_prediction': {
                'predicted_score': 72.5,
                'confidence': 'high',
                'risk_level': 'low'
            }
        }
        mock_get_dashboard.return_value = mock_dashboard_data

        response = client.get(
            f"/api/v1/ai-prediction-dashboard/dashboard?board={Board.CBSE.value}&grade_id={grade.id}&subject_id={subject.id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        
        assert data['board'] == Board.CBSE.value
        assert data['grade_id'] == grade.id
        assert data['subject_id'] == subject.id
        assert data['subject_name'] == subject.name
        assert 'topic_rankings' in data
        assert len(data['topic_rankings']) == 2
        
        topic_ranking = data['topic_rankings'][0]
        assert topic_ranking['topic_name'] == 'Quadratic Equations'
        assert topic_ranking['probability_score'] == 85.5
        assert topic_ranking['star_rating'] == 5
        assert topic_ranking['confidence_level'] == 'high'
        assert topic_ranking['expected_marks'] == 8.0
        assert topic_ranking['study_hours_recommended'] == 4.5
        
        assert 'predicted_blueprint' in data
        blueprint = data['predicted_blueprint']
        assert blueprint['total_marks'] == 80
        assert blueprint['duration_minutes'] == 180
        assert len(blueprint['sections']) == 2
        assert 'topic_coverage' in blueprint
        assert 'difficulty_breakdown' in blueprint
        
        assert 'marks_distribution' in data
        assert len(data['marks_distribution']) == 3
        
        assert 'focus_areas' in data
        assert len(data['focus_areas']) == 1
        focus_area = data['focus_areas'][0]
        assert focus_area['priority'] == 'critical'
        assert focus_area['expected_impact'] == 'Up to 12 marks improvement'
        
        assert 'study_time_allocation' in data
        assert len(data['study_time_allocation']) == 3
        
        assert 'overall_prediction' in data
        assert data['overall_prediction']['predicted_score'] == 72.5


@pytest.mark.integration
class TestBoardExamPredictionsAPI:
    """Integration tests for GET /api/v1/board-exam-predictions/predictions endpoint"""

    @patch('src.services.board_exam_prediction_service.BoardExamPredictionService.get_predictions')
    def test_get_board_exam_predictions_success(
        self,
        mock_get_predictions,
        client: TestClient,
        auth_headers: dict,
        subject: Subject,
        grade: Grade
    ):
        mock_predictions = [
            {
                'id': 1,
                'institution_id': 1,
                'board': Board.CBSE,
                'grade_id': grade.id,
                'subject_id': subject.id,
                'topic_id': 1,
                'topic_name': 'Differential Equations',
                'chapter_id': 1,
                'chapter_name': 'Calculus',
                'probability_score': 92.5,
                'prediction_rank': 1,
                'confidence_level': 'very_high',
                'frequency_count': 15,
                'last_appeared_year': 2023,
                'years_since_last_appearance': 0,
                'average_marks': 8.5,
                'total_marks': 127.5,
                'difficulty_level': 'hard',
                'bloom_level': 'apply',
                'trend_direction': 'increasing',
                'is_due': False,
                'reasoning': 'Appears frequently in recent exams',
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            },
            {
                'id': 2,
                'institution_id': 1,
                'board': Board.CBSE,
                'grade_id': grade.id,
                'subject_id': subject.id,
                'topic_id': 2,
                'topic_name': 'Probability Distribution',
                'chapter_id': 2,
                'chapter_name': 'Probability',
                'probability_score': 88.3,
                'prediction_rank': 2,
                'confidence_level': 'high',
                'frequency_count': 12,
                'last_appeared_year': 2022,
                'years_since_last_appearance': 1,
                'average_marks': 6.0,
                'total_marks': 72.0,
                'difficulty_level': 'medium',
                'bloom_level': 'understand',
                'trend_direction': 'stable',
                'is_due': True,
                'reasoning': 'Due based on cyclical pattern',
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
        ]
        mock_get_predictions.return_value = (mock_predictions, 2)

        response = client.get(
            f"/api/v1/board-exam-predictions/predictions?board={Board.CBSE.value}&grade_id={grade.id}&subject_id={subject.id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        
        first_prediction = data[0]
        assert first_prediction['topic_name'] == 'Differential Equations'
        assert first_prediction['probability_score'] == 92.5
        assert first_prediction['prediction_rank'] == 1
        assert first_prediction['confidence_level'] == 'very_high'
        assert first_prediction['frequency_count'] == 15
        assert first_prediction['is_due'] == False
        
        second_prediction = data[1]
        assert second_prediction['topic_name'] == 'Probability Distribution'
        assert second_prediction['probability_score'] == 88.3
        assert second_prediction['is_due'] == True


@pytest.mark.integration
class TestWeaknessDetectionAPI:
    """Integration tests for GET /api/v1/weakness-detection/weak-chapters/{student_id} endpoint"""

    @patch('src.services.weakness_detection_service.ChapterPerformanceAnalyzer.get_weak_chapters')
    def test_get_weak_chapters_success(
        self,
        mock_get_weak_chapters,
        client: TestClient,
        auth_headers: dict,
        student: Student
    ):
        mock_weak_chapters = [
            {
                'id': 1,
                'institution_id': student.institution_id,
                'student_id': student.id,
                'subject_id': 1,
                'chapter_id': 5,
                'average_score': Decimal('45.5'),
                'total_attempts': 8,
                'successful_attempts': 3,
                'failed_attempts': 5,
                'success_rate': Decimal('37.5'),
                'time_spent_minutes': 240,
                'proficiency_level': 'beginner',
                'trend': 'declining',
                'improvement_rate': Decimal('-5.2'),
                'difficulty_rating': Decimal('8.5'),
                'mastery_score': Decimal('42.0'),
                'last_practiced_at': datetime.utcnow(),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            },
            {
                'id': 2,
                'institution_id': student.institution_id,
                'student_id': student.id,
                'subject_id': 1,
                'chapter_id': 8,
                'average_score': Decimal('52.3'),
                'total_attempts': 10,
                'successful_attempts': 5,
                'failed_attempts': 5,
                'success_rate': Decimal('50.0'),
                'time_spent_minutes': 180,
                'proficiency_level': 'intermediate',
                'trend': 'stable',
                'improvement_rate': Decimal('0.5'),
                'difficulty_rating': Decimal('7.0'),
                'mastery_score': Decimal('55.0'),
                'last_practiced_at': datetime.utcnow(),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
        ]
        mock_get_weak_chapters.return_value = mock_weak_chapters

        response = client.get(
            f"/api/v1/weakness-detection/weak-chapters/{student.id}?mastery_threshold=60.0&limit=10",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        
        first_weak_chapter = data[0]
        assert first_weak_chapter['student_id'] == student.id
        assert float(first_weak_chapter['average_score']) == 45.5
        assert first_weak_chapter['total_attempts'] == 8
        assert first_weak_chapter['successful_attempts'] == 3
        assert first_weak_chapter['failed_attempts'] == 5
        assert float(first_weak_chapter['success_rate']) == 37.5
        assert first_weak_chapter['proficiency_level'] == 'beginner'
        assert first_weak_chapter['trend'] == 'declining'
        assert float(first_weak_chapter['mastery_score']) == 42.0
        
        second_weak_chapter = data[1]
        assert float(second_weak_chapter['average_score']) == 52.3
        assert second_weak_chapter['proficiency_level'] == 'intermediate'


@pytest.mark.integration
class TestStudyPlannerAPI:
    """Integration tests for GET /api/v1/study-planner/tasks endpoint"""

    @patch('src.services.study_planner_service.StudyPlannerService.get_daily_tasks')
    def test_get_daily_study_tasks_success(
        self,
        mock_get_daily_tasks,
        client: TestClient,
        auth_headers: dict,
        student: Student,
        institution: Institution
    ):
        today = date.today()
        mock_daily_tasks = {
            'date': today,
            'student_id': student.id,
            'total_tasks': 5,
            'completed_tasks': 2,
            'pending_tasks': 3,
            'total_hours': 4.5,
            'completed_hours': 1.5,
            'tasks': [
                {
                    'id': 1,
                    'institution_id': institution.id,
                    'study_plan_id': 1,
                    'student_id': student.id,
                    'task_date': today,
                    'subject_id': 1,
                    'chapter_id': 3,
                    'topic_id': 5,
                    'title': 'Complete Quadratic Equations Practice',
                    'description': 'Solve exercises 1-20 from NCERT',
                    'priority': 'high',
                    'estimated_duration_minutes': 60,
                    'actual_duration_minutes': None,
                    'start_time': '09:00:00',
                    'end_time': '10:00:00',
                    'status': 'pending',
                    'completion_percentage': 0,
                    'notes': None,
                    'resources': ['NCERT Chapter 4', 'RD Sharma'],
                    'is_adaptive': True,
                    'created_at': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat()
                },
                {
                    'id': 2,
                    'institution_id': institution.id,
                    'study_plan_id': 1,
                    'student_id': student.id,
                    'task_date': today,
                    'subject_id': 1,
                    'chapter_id': 4,
                    'topic_id': 7,
                    'title': 'Revise Trigonometry Basics',
                    'description': 'Review all formulas and identities',
                    'priority': 'medium',
                    'estimated_duration_minutes': 45,
                    'actual_duration_minutes': 45,
                    'start_time': '14:00:00',
                    'end_time': '14:45:00',
                    'status': 'completed',
                    'completion_percentage': 100,
                    'notes': 'All formulas reviewed',
                    'resources': ['Formula Sheet', 'Class Notes'],
                    'is_adaptive': True,
                    'created_at': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat()
                },
                {
                    'id': 3,
                    'institution_id': institution.id,
                    'study_plan_id': 1,
                    'student_id': student.id,
                    'task_date': today,
                    'subject_id': 2,
                    'chapter_id': 8,
                    'topic_id': 12,
                    'title': 'Physics Numericals Practice',
                    'description': 'Solve 10 problems on Mechanics',
                    'priority': 'high',
                    'estimated_duration_minutes': 90,
                    'actual_duration_minutes': None,
                    'start_time': '16:00:00',
                    'end_time': '17:30:00',
                    'status': 'pending',
                    'completion_percentage': 0,
                    'notes': None,
                    'resources': ['HC Verma Chapter 2'],
                    'is_adaptive': False,
                    'created_at': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat()
                }
            ],
            'priorities': {
                'high': 2,
                'medium': 1,
                'low': 0
            }
        }
        mock_get_daily_tasks.return_value = mock_daily_tasks

        response = client.post(
            f"/api/v1/study-planner/tasks/daily?institution_id={institution.id}",
            headers=auth_headers,
            json={
                'student_id': student.id,
                'date': today.isoformat()
            }
        )

        assert response.status_code == 200
        data = response.json()
        
        assert data['student_id'] == student.id
        assert data['total_tasks'] == 5
        assert data['completed_tasks'] == 2
        assert data['pending_tasks'] == 3
        assert data['total_hours'] == 4.5
        assert data['completed_hours'] == 1.5
        
        assert 'tasks' in data
        assert len(data['tasks']) == 3
        
        first_task = data['tasks'][0]
        assert first_task['title'] == 'Complete Quadratic Equations Practice'
        assert first_task['priority'] == 'high'
        assert first_task['estimated_duration_minutes'] == 60
        assert first_task['status'] == 'pending'
        assert first_task['is_adaptive'] == True
        
        completed_task = data['tasks'][1]
        assert completed_task['status'] == 'completed'
        assert completed_task['completion_percentage'] == 100
        assert completed_task['actual_duration_minutes'] == 45
        
        assert 'priorities' in data
        assert data['priorities']['high'] == 2
        assert data['priorities']['medium'] == 1


@pytest.mark.integration
class TestHomeworkScannerAPI:
    """Integration tests for POST /api/v1/homework-scanner/scans endpoint"""

    @patch('src.services.homework_scanner_service.HomeworkScannerService.create_scan')
    async def test_homework_scanner_with_image_upload(
        self,
        mock_create_scan,
        client: TestClient,
        auth_headers: dict,
        student: Student,
        subject: Subject,
        institution: Institution
    ):
        mock_scan_result = {
            'id': 1,
            'institution_id': institution.id,
            'student_id': student.id,
            'subject_id': subject.id,
            'scan_title': 'Math Homework - Chapter 4',
            'image_url': 'https://s3.amazonaws.com/bucket/scans/scan_123.jpg',
            's3_key': 'scans/scan_123.jpg',
            'extracted_text': 'Solve: x^2 + 5x + 6 = 0\nFind the derivative of f(x) = 3x^2 + 2x - 5',
            'detected_problems': [
                {
                    'problem_text': 'x^2 + 5x + 6 = 0',
                    'problem_type': 'quadratic_equation',
                    'difficulty': 'easy',
                    'solution': 'x = -2 or x = -3',
                    'steps': [
                        'Factor the equation: (x + 2)(x + 3) = 0',
                        'Set each factor to zero',
                        'Solve: x + 2 = 0 → x = -2',
                        'Solve: x + 3 = 0 → x = -3'
                    ],
                    'confidence': 0.95
                },
                {
                    'problem_text': "Find the derivative of f(x) = 3x^2 + 2x - 5",
                    'problem_type': 'differentiation',
                    'difficulty': 'easy',
                    'solution': "f'(x) = 6x + 2",
                    'steps': [
                        'Apply power rule to each term',
                        'd/dx(3x^2) = 6x',
                        'd/dx(2x) = 2',
                        'd/dx(-5) = 0',
                        "Combine: f'(x) = 6x + 2"
                    ],
                    'confidence': 0.92
                }
            ],
            'solutions': [
                {
                    'problem_id': 1,
                    'solution_text': 'x = -2 or x = -3',
                    'steps': ['Factor', 'Solve'],
                    'explanation': 'This is a quadratic equation solved by factoring'
                }
            ],
            'ai_feedback': 'Good work on the quadratic equation! Make sure to verify your answers by substituting back. For the derivative, remember to apply the power rule carefully to each term.',
            'confidence_score': Decimal('93.5'),
            'processing_status': 'completed',
            'error_message': None,
            'metadata': {
                'ocr_engine': 'tesseract',
                'ml_model': 'gpt-4',
                'processing_time_seconds': 3.5
            },
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        mock_create_scan.return_value = mock_scan_result

        image_content = b"fake_image_content_representing_homework_scan"
        image_file = io.BytesIO(image_content)
        
        response = client.post(
            "/api/v1/homework-scanner/scans",
            headers=auth_headers,
            files={'file': ('homework.jpg', image_file, 'image/jpeg')},
            data={
                'student_id': student.id,
                'subject_id': subject.id,
                'scan_title': 'Math Homework - Chapter 4'
            }
        )

        assert response.status_code == 201
        data = response.json()
        
        assert data['id'] == 1
        assert data['institution_id'] == institution.id
        assert data['student_id'] == student.id
        assert data['subject_id'] == subject.id
        assert data['scan_title'] == 'Math Homework - Chapter 4'
        assert data['image_url'] == 'https://s3.amazonaws.com/bucket/scans/scan_123.jpg'
        assert data['s3_key'] == 'scans/scan_123.jpg'
        
        assert 'extracted_text' in data
        assert 'x^2 + 5x + 6 = 0' in data['extracted_text']
        
        assert 'detected_problems' in data
        assert len(data['detected_problems']) == 2
        
        first_problem = data['detected_problems'][0]
        assert first_problem['problem_text'] == 'x^2 + 5x + 6 = 0'
        assert first_problem['problem_type'] == 'quadratic_equation'
        assert first_problem['difficulty'] == 'easy'
        assert first_problem['solution'] == 'x = -2 or x = -3'
        assert len(first_problem['steps']) == 4
        assert first_problem['confidence'] == 0.95
        
        second_problem = data['detected_problems'][1]
        assert second_problem['problem_type'] == 'differentiation'
        assert second_problem['solution'] == "f'(x) = 6x + 2"
        
        assert 'ai_feedback' in data
        assert 'Good work' in data['ai_feedback']
        assert float(data['confidence_score']) == 93.5
        assert data['processing_status'] == 'completed'
        
        assert 'metadata' in data
        assert data['metadata']['ocr_engine'] == 'tesseract'
        assert data['metadata']['ml_model'] == 'gpt-4'

    @patch('src.services.homework_scanner_service.HomeworkScannerService.analyze_scan')
    def test_homework_scanner_analyze_endpoint(
        self,
        mock_analyze_scan,
        client: TestClient,
        auth_headers: dict
    ):
        scan_id = 1
        mock_analysis = {
            'scan_id': scan_id,
            'problems_count': 3,
            'problems': [
                {
                    'problem_text': 'Solve: 2x + 5 = 15',
                    'problem_type': 'linear_equation',
                    'difficulty': 'easy',
                    'solution': 'x = 5',
                    'steps': ['Subtract 5 from both sides: 2x = 10', 'Divide by 2: x = 5'],
                    'confidence': 0.98
                },
                {
                    'problem_text': 'Calculate the area of a circle with radius 7 cm',
                    'problem_type': 'geometry',
                    'difficulty': 'easy',
                    'solution': 'A = 154 cm²',
                    'steps': ['Use formula A = πr²', 'A = π × 7²', 'A = 22/7 × 49', 'A = 154 cm²'],
                    'confidence': 0.95
                },
                {
                    'problem_text': 'Integrate: ∫(3x² + 2x) dx',
                    'problem_type': 'integration',
                    'difficulty': 'medium',
                    'solution': 'x³ + x² + C',
                    'steps': [
                        'Apply power rule to each term',
                        '∫3x² dx = x³',
                        '∫2x dx = x²',
                        'Add constant of integration: x³ + x² + C'
                    ],
                    'confidence': 0.91
                }
            ],
            'overall_difficulty': 'easy_to_medium',
            'estimated_time_minutes': 25,
            'recommendations': [
                'Practice more integration problems',
                'Review power rule applications',
                'Work on similar problems from chapter 6'
            ],
            'ai_feedback': 'You\'ve covered basic to intermediate concepts. Focus on integration techniques for better understanding. The linear equation and geometry problems show good grasp of fundamentals.'
        }
        mock_analyze_scan.return_value = mock_analysis

        response = client.get(
            f"/api/v1/homework-scanner/scans/{scan_id}/analyze",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        
        assert data['scan_id'] == scan_id
        assert data['problems_count'] == 3
        assert data['overall_difficulty'] == 'easy_to_medium'
        assert data['estimated_time_minutes'] == 25
        
        assert 'problems' in data
        assert len(data['problems']) == 3
        
        assert 'recommendations' in data
        assert len(data['recommendations']) == 3
        assert 'Practice more integration problems' in data['recommendations']
        
        assert 'ai_feedback' in data
        assert 'integration techniques' in data['ai_feedback']


@pytest.mark.integration
class TestMLAPIWithMockedServices:
    """Integration tests for ML API endpoints with mocked OpenAI and ML model predictions"""

    @patch('openai.ChatCompletion.create')
    @patch('src.services.ai_prediction_dashboard_service.AIPredictionDashboardService.get_dashboard')
    async def test_ai_prediction_with_mocked_openai(
        self,
        mock_get_dashboard,
        mock_openai,
        client: TestClient,
        auth_headers: dict,
        subject: Subject,
        grade: Grade
    ):
        mock_openai.return_value = {
            'choices': [
                {
                    'message': {
                        'content': 'Based on historical patterns, these topics have high probability of appearing.'
                    }
                }
            ]
        }
        
        mock_get_dashboard.return_value = {
            'board': Board.CBSE,
            'grade_id': grade.id,
            'subject_id': subject.id,
            'subject_name': subject.name,
            'generated_at': datetime.utcnow(),
            'topic_rankings': [],
            'predicted_blueprint': {
                'total_marks': 80,
                'duration_minutes': 180,
                'sections': [],
                'topic_coverage': {},
                'difficulty_breakdown': {}
            },
            'marks_distribution': [],
            'focus_areas': [],
            'study_time_allocation': [],
            'overall_prediction': {'predicted_score': 70.0}
        }

        response = client.get(
            f"/api/v1/ai-prediction-dashboard/dashboard?board={Board.CBSE.value}&grade_id={grade.id}&subject_id={subject.id}",
            headers=auth_headers
        )

        assert response.status_code == 200

    @patch('src.services.weakness_detection_service.WeaknessDetectionEngine.run_comprehensive_analysis')
    def test_weakness_detection_with_mocked_ml(
        self,
        mock_analysis,
        client: TestClient,
        auth_headers: dict,
        student: Student
    ):
        mock_analysis.return_value = {
            'summary': {
                'total_weak_areas': 3,
                'average_mastery': 55.5,
                'improvement_trend': 'stable'
            },
            'chapter_performances': [],
            'weak_areas': ['Calculus', 'Probability', 'Trigonometry'],
            'focus_areas': [],
            'question_recommendations': [],
            'personalized_insights': []
        }

        response = client.post(
            "/api/v1/weakness-detection/analyze",
            headers=auth_headers,
            json={
                'student_id': student.id,
                'target_exam_date': (date.today() + timedelta(days=30)).isoformat(),
                'generate_recommendations': True
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert 'summary' in data
        assert 'weak_areas' in data

    @patch('src.services.board_exam_prediction_service.BoardExamPredictionService.analyze_and_predict')
    async def test_board_exam_analysis_with_mocked_ml(
        self,
        mock_analyze,
        client: TestClient,
        auth_headers: dict,
        subject: Subject,
        grade: Grade
    ):
        mock_analyze.return_value = {
            'board': Board.CBSE,
            'grade_id': grade.id,
            'subject_id': subject.id,
            'analysis_period': '2018-2023',
            'total_papers_analyzed': 6,
            'total_questions_analyzed': 180,
            'top_predictions': [],
            'pattern_insights': 'Regular appearance of algebra topics',
            'confidence': 'high'
        }

        response = client.post(
            "/api/v1/board-exam-predictions/analyze",
            headers=auth_headers,
            json={
                'board': Board.CBSE.value,
                'grade_id': grade.id,
                'subject_id': subject.id,
                'year_start': 2018,
                'year_end': 2023
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data['board'] == Board.CBSE.value
        assert data['total_papers_analyzed'] == 6
