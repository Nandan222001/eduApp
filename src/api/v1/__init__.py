from fastapi import APIRouter
from src.api.v1 import (
    users, 
    auth, 
    subscriptions, 
    webhooks, 
    institutions, 
    academic_years, 
    grades, 
    sections, 
    subjects, 
    terms,
    timetables,
    grade_configurations,
    teachers, 
    students, 
    parents,
    profile,
    settings,
    attendance,
    assignments,
    submissions,
    exams,
    previous_year_papers,
    question_bank,
    question_bookmarks,
    notifications,
    announcements,
    messages,
    notification_templates,
    websocket,
    gamification,
    goals,
    predictions,
    board_exam_predictions,
    question_nlp,
    question_blueprints,
    study_planner,
    weakness_detection,
    analytics,
    super_admin,
    institution_admin,
    ai_prediction_dashboard,
    study_materials,
    search,
    data_management,
    flashcards,
    quizzes,
    chatbot,
    ml_training,
    ml_monitoring,
    ml_analytics,
    doubts,
    learning_paths,
    virtual_classrooms,
    classroom_websocket,
    plagiarism
)
from src.api import ml

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(institutions.router, prefix="/institutions", tags=["institutions"])
api_router.include_router(academic_years.router, prefix="/academic-years", tags=["academic-years"])
api_router.include_router(grades.router, prefix="/grades", tags=["grades"])
api_router.include_router(sections.router, prefix="/sections", tags=["sections"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["subjects"])
api_router.include_router(terms.router, prefix="/terms", tags=["terms"])
api_router.include_router(timetables.router, prefix="/timetables", tags=["timetables"])
api_router.include_router(grade_configurations.router, prefix="/grade-configurations", tags=["grade-configurations"])
api_router.include_router(teachers.router, prefix="/teachers", tags=["teachers"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(parents.router, prefix="/parents", tags=["parents"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(settings.router, prefix="", tags=["settings"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
api_router.include_router(exams.router, prefix="/exams", tags=["exams"])
api_router.include_router(previous_year_papers.router, prefix="/previous-year-papers", tags=["previous-year-papers"])
api_router.include_router(question_bank.router, prefix="/question-bank", tags=["question-bank"])
api_router.include_router(question_bookmarks.router, prefix="/question-bookmarks", tags=["question-bookmarks"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(announcements.router, prefix="/announcements", tags=["announcements"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(notification_templates.router, prefix="/notification-templates", tags=["notification-templates"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])
api_router.include_router(gamification.router, prefix="/gamification", tags=["gamification"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(ml.router, prefix="/ml", tags=["machine-learning"])
api_router.include_router(predictions.router, prefix="", tags=["predictions"])
api_router.include_router(board_exam_predictions.router, prefix="", tags=["board-exam-predictions"])
api_router.include_router(question_nlp.router, prefix="", tags=["question-nlp"])
api_router.include_router(question_blueprints.router, prefix="", tags=["question-blueprints"])
api_router.include_router(study_planner.router, prefix="", tags=["study-planner"])
api_router.include_router(weakness_detection.router, prefix="", tags=["weakness-detection"])
api_router.include_router(analytics.router, prefix="", tags=["analytics"])
api_router.include_router(super_admin.router, prefix="", tags=["super-admin"])
api_router.include_router(institution_admin.router, prefix="/institution-admin", tags=["institution-admin"])
api_router.include_router(ai_prediction_dashboard.router, prefix="", tags=["ai-prediction-dashboard"])
api_router.include_router(study_materials.router, prefix="", tags=["study-materials"])
api_router.include_router(search.router, prefix="", tags=["search"])
api_router.include_router(data_management.router, prefix="", tags=["data-management"])
api_router.include_router(flashcards.router, prefix="", tags=["flashcards"])
api_router.include_router(quizzes.router, prefix="", tags=["quizzes"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])
api_router.include_router(ml_training.router, prefix="", tags=["ml-training"])
api_router.include_router(ml_monitoring.router, prefix="", tags=["ml-monitoring"])
api_router.include_router(ml_analytics.router, prefix="", tags=["ml-analytics"])
api_router.include_router(doubts.router, prefix="", tags=["doubts-intelligence"])
api_router.include_router(learning_paths.router, prefix="", tags=["learning-paths"])
api_router.include_router(virtual_classrooms.router, prefix="", tags=["virtual-classrooms"])
api_router.include_router(classroom_websocket.router, prefix="/ws", tags=["classroom-websocket"])
api_router.include_router(plagiarism.router, prefix="", tags=["plagiarism"])
