import importlib
import logging
from fastapi import APIRouter

logger = logging.getLogger(__name__)
api_router = APIRouter()


def _include_optional_router(
    module_path: str,
    prefix: str = "",
    tags: list[str] | None = None,
    router_attr: str = "router",
) -> None:
    try:
        module = importlib.import_module(module_path)
        router = getattr(module, router_attr, None)
        if router is None:
            logger.warning("Router '%s' missing in %s", router_attr, module_path)
            return
        api_router.include_router(router, prefix=prefix, tags=tags or [])
    except Exception as exc:
        logger.warning("Skipping router %s due to import error: %s", module_path, exc)


ROUTERS = [
    ("src.api.v1.auth", "/auth", ["auth"], "router"),
    ("src.api.v1.mobile_auth", "/mobile-auth", ["mobile-auth"], "router"),
    ("src.api.v1.users", "/users", ["users"], "router"),
    ("src.api.v1.subscriptions", "/subscriptions", ["subscriptions"], "router"),
    ("src.api.v1.webhooks", "/webhooks", ["webhooks"], "router"),
    ("src.api.v1.institutions", "/institutions", ["institutions"], "router"),
    ("src.api.v1.academic_years", "/academic-years", ["academic-years"], "router"),
    ("src.api.v1.grades", "/grades", ["grades"], "router"),
    ("src.api.v1.sections", "/sections", ["sections"], "router"),
    ("src.api.v1.subjects", "/subjects", ["subjects"], "router"),
    ("src.api.v1.terms", "/terms", ["terms"], "router"),
    ("src.api.v1.timetables", "/timetables", ["timetables"], "router"),
    ("src.api.v1.grade_configurations", "/grade-configurations", ["grade-configurations"], "router"),
    ("src.api.v1.teachers", "/teachers", ["teachers"], "router"),
    ("src.api.v1.students", "/students", ["students"], "router"),
    ("src.api.v1.parents", "/parents", ["parents"], "router"),
    ("src.api.v1.profile", "/profile", ["profile"], "router"),
    ("src.api.v1.settings", "", ["settings"], "router"),
    ("src.api.v1.attendance", "/attendance", ["attendance"], "router"),
    ("src.api.v1.assignments", "/assignments", ["assignments"], "router"),
    ("src.api.v1.submissions", "/submissions", ["submissions"], "router"),
    ("src.api.v1.exams", "/exams", ["exams"], "router"),
    ("src.api.v1.previous_year_papers", "/previous-year-papers", ["previous-year-papers"], "router"),
    ("src.api.v1.question_bank", "/question-bank", ["question-bank"], "router"),
    ("src.api.v1.question_bookmarks", "/question-bookmarks", ["question-bookmarks"], "router"),
    ("src.api.v1.notifications", "/notifications", ["notifications"], "router"),
    ("src.api.v1.notification_analytics", "/notification-analytics", ["notification-analytics"], "router"),
    ("src.api.v1.announcements", "/announcements", ["announcements"], "router"),
    ("src.api.v1.messages", "/messages", ["messages"], "router"),
    ("src.api.v1.notification_templates", "/notification-templates", ["notification-templates"], "router"),
    ("src.api.v1.websocket", "/ws", ["websocket"], "router"),
    ("src.api.v1.gamification", "/gamification", ["gamification"], "router"),
    ("src.api.v1.goals", "/goals", ["goals"], "router"),
    ("src.api.ml", "/ml", ["machine-learning"], "router"),
    ("src.api.v1.predictions", "", ["predictions"], "router"),
    ("src.api.v1.board_exam_predictions", "", ["board-exam-predictions"], "router"),
    ("src.api.v1.question_nlp", "", ["question-nlp"], "router"),
    ("src.api.v1.question_blueprints", "", ["question-blueprints"], "router"),
    ("src.api.v1.study_planner", "", ["study-planner"], "router"),
    ("src.api.v1.weakness_detection", "", ["weakness-detection"], "router"),
    ("src.api.v1.analytics", "", ["analytics"], "router"),
    ("src.api.v1.super_admin", "", ["super-admin"], "router"),
    ("src.api.v1.super_admin_analytics", "", ["super-admin-analytics"], "router"),
    ("src.api.v1.super_admin_reports", "", ["super-admin-reports"], "router"),
    ("src.api.v1.institution_admin", "/institution-admin", ["institution-admin"], "router"),
    ("src.api.v1.ai_prediction_dashboard", "", ["ai-prediction-dashboard"], "router"),
    ("src.api.v1.study_materials", "", ["study-materials"], "router"),
    ("src.api.v1.search", "", ["search"], "router"),
    ("src.api.v1.data_management", "", ["data-management"], "router"),
    ("src.api.v1.flashcards", "", ["flashcards"], "router"),
    ("src.api.v1.quizzes", "", ["quizzes"], "router"),
    ("src.api.v1.chatbot", "/chatbot", ["chatbot"], "router"),
    ("src.api.v1.ml_training", "", ["ml-training"], "router"),
    ("src.api.v1.ml_monitoring", "", ["ml-monitoring"], "router"),
    ("src.api.v1.ml_analytics", "", ["ml-analytics"], "router"),
    ("src.api.v1.doubts", "", ["doubts"], "router"),
    ("src.api.v1.learning_paths", "", ["learning-paths"], "router"),
    ("src.api.v1.virtual_classrooms", "", ["virtual-classrooms"], "router"),
    ("src.api.v1.classroom_websocket", "", ["classroom-websocket"], "router"),
    ("src.api.v1.plagiarism", "", ["plagiarism"], "router"),
    ("src.api.v1.institution_health", "", ["institution-health"], "router"),
    ("src.api.v1.credentials", "", ["credentials"], "router"),
    ("src.api.v1.credentials", "", ["employer-verification"], "employer_router"),
    ("src.api.v1.career", "/career", ["career"], "router"),
    ("src.api.v1.parent_teacher_collab", "/parent-teacher-collab", ["parent-teacher-collaboration"], "router"),
    ("src.api.v1.peer_tutoring", "/peer-tutoring", ["peer-tutoring"], "router"),
    ("src.api.v1.merchandise", "/merchandise", ["merchandise"], "router"),
    ("src.api.v1.onboarding", "/onboarding", ["onboarding"], "router"),
    ("src.api.v1.conferences", "/conferences", ["conferences"], "router"),
    ("src.api.v1.document_vault", "/document-vault", ["document-vault"], "router"),
    ("src.api.v1.carpools", "/carpools", ["carpools"], "router"),
    ("src.api.v1.volunteer_hours", "/volunteer-hours", ["volunteer-hours"], "router"),
    ("src.api.v1.journalism", "/journalism", ["journalism"], "router"),
    ("src.api.v1.finance_education", "/finance-education", ["finance-education"], "router"),
    ("src.api.v1.community_service", "/community-service", ["community-service"], "router"),
    ("src.api.v1.entrepreneurship", "/entrepreneurship", ["entrepreneurship"], "router"),
    ("src.api.v1.peer_recognition", "/peer-recognition", ["peer-recognition"], "router"),
    ("src.api.v1.learning_styles", "", ["learning-styles"], "router"),
    ("src.api.v1.content_marketplace", "", ["content-marketplace"], "router"),
    ("src.api.v1.yearbook", "/yearbook", ["yearbook"], "router"),
    ("src.api.v1.podcasts", "/podcasts", ["podcasts"], "router"),
    ("src.api.v1.research", "/research", ["research"], "router"),
    ("src.api.v1.college_planning", "/college-planning", ["college-planning"], "router"),
    ("src.api.v1.study_buddy", "/study-buddy", ["study-buddy"], "router"),
    ("src.api.v1.scholarship_essays", "/scholarship-essays", ["scholarship-essays"], "router"),
    ("src.api.v1.homework_scanner", "/homework-scanner", ["homework-scanner"], "router"),
    ("src.api.v1.student_employment", "/student-employment", ["student-employment"], "router"),
    ("src.api.v1.olympics", "/olympics", ["olympics"], "router"),
    ("src.api.v1.mistake_analysis", "", ["mistake-analysis"], "router"),
    ("src.api.v1.reverse_classroom", "", ["reverse-classroom"], "router"),
    ("src.api.v1.subject_rpg", "/subject-rpg", ["subject-rpg"], "router"),
    ("src.api.v1.wellbeing", "/wellbeing", ["wellbeing"], "router"),
    ("src.api.v1.parent_roi", "/parent-roi", ["parent-roi"], "router"),
    ("src.api.v1.feedback", "", ["feedback"], "router"),
    ("src.api.v1.migrations", "", ["migrations"], "router"),
    ("src.api.v1.school_admin", "/school-admin", ["school-admin"], "router"),
]

# Keep backend bootable while optional modules are being repaired.
CORE_ROUTER_MODULES = {
    "src.api.v1.auth",
    "src.api.v1.mobile_auth",
    "src.api.v1.users",
    "src.api.v1.institutions",
    "src.api.v1.academic_years",
    "src.api.v1.grades",
    "src.api.v1.sections",
    "src.api.v1.subjects",
    "src.api.v1.terms",
    "src.api.v1.teachers",
    "src.api.v1.students",
    "src.api.v1.parents",
    "src.api.v1.attendance",
    "src.api.v1.assignments",
    "src.api.v1.submissions",
    "src.api.v1.exams",
}
ROUTERS = [router for router in ROUTERS if router[0] in CORE_ROUTER_MODULES]

for module_path, prefix, tags, router_attr in ROUTERS:
    _include_optional_router(module_path, prefix, tags, router_attr)
