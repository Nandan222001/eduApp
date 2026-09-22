from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.examination import ExamType, ExamStatus
from src.schemas.examination import (
    ExamCreate, ExamUpdate, ExamResponse, ExamWithSubjectsResponse, ExamWithSchedulesResponse,
    ExamDetailResponse, ExamSubjectCreate, ExamSubjectUpdate, ExamSubjectResponse,
    QuestionPaperUpload, ExamScheduleCreate, ExamScheduleUpdate, ExamScheduleResponse,
    TimetableConflict, ExamMarksCreate, ExamMarksUpdate, ExamMarksResponse,
    ExamMarksBulkEntry, ExamResultResponse, StudentExamResult,
    GradeConfigurationCreate, GradeConfigurationUpdate, GradeConfigurationResponse,
    ExamPerformanceAnalyticsResponse, PerformanceComparisonRequest, PerformanceComparisonResponse
)
from src.services.examination_service import ExaminationService

router = APIRouter(tags=["Examinations"])


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    exam_data: ExamCreate,
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    exam = service.create_exam(exam_data)
    return exam


@router.get("", response_model=List[ExamResponse])
def list_exams(
    institution_id: int = Query(...),
    academic_year_id: Optional[int] = Query(None),
    grade_id: Optional[int] = Query(None),
    exam_type: Optional[ExamType] = Query(None),
    status: Optional[ExamStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    exams = service.list_exams(
        institution_id, academic_year_id, grade_id, exam_type, status, skip, limit
    )
    return exams


@router.get("/grade-configurations", response_model=List[GradeConfigurationResponse])
def list_grade_configurations(
    institution_id: int = Query(...),
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    # Registered before GET /{exam_id} deliberately: a single-literal-segment
    # path here would otherwise be shadowed by the param route below (which
    # FastAPI/Starlette matches in registration order), making this endpoint
    # permanently unreachable -- 422 int_parsing on "grade-configurations"
    # trying to parse as exam_id. Found via real integration test coverage.
    service = ExaminationService(db)
    configs = service.list_grade_configurations(institution_id, active_only)
    return configs


@router.get("/{exam_id}", response_model=ExamDetailResponse)
def get_exam(
    exam_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    exam = service.get_exam_with_details(exam_id, institution_id)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    return exam


@router.put("/{exam_id}", response_model=ExamResponse)
def update_exam(
    exam_id: int,
    exam_data: ExamUpdate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    exam = service.update_exam(exam_id, institution_id, exam_data)
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )
    return exam


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    deleted = service.delete_exam(exam_id, institution_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found"
        )


@router.post("/{exam_id}/subjects", response_model=ExamSubjectResponse, status_code=status.HTTP_201_CREATED)
def add_exam_subject(
    exam_id: int,
    subject_data: ExamSubjectCreate,
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    exam_subject = service.create_exam_subject(subject_data)
    return exam_subject


@router.get("/{exam_id}/subjects", response_model=List[ExamSubjectResponse])
def get_exam_subjects(
    exam_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    exam_subjects = service.get_exam_subjects(exam_id, institution_id)
    return exam_subjects


@router.put("/subjects/{exam_subject_id}", response_model=ExamSubjectResponse)
def update_exam_subject(
    exam_subject_id: int,
    subject_data: ExamSubjectUpdate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    exam_subject = service.update_exam_subject(exam_subject_id, institution_id, subject_data)
    if not exam_subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam subject not found"
        )
    return exam_subject


@router.post("/subjects/{exam_subject_id}/question-paper", response_model=ExamSubjectResponse)
def upload_question_paper(
    exam_subject_id: int,
    upload_data: QuestionPaperUpload,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    exam_subject = service.upload_question_paper(
        exam_subject_id, institution_id, upload_data.file_path
    )
    if not exam_subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam subject not found"
        )
    return exam_subject


@router.post("/{exam_id}/schedules", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_exam_schedule(
    exam_id: int,
    schedule_data: ExamScheduleCreate,
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    schedule, conflicts = service.create_exam_schedule(schedule_data)
    return {
        "schedule": ExamScheduleResponse.model_validate(schedule),
        "conflicts": conflicts,
        "has_conflicts": len(conflicts) > 0
    }


@router.get("/{exam_id}/schedules", response_model=List[ExamScheduleResponse])
def get_exam_schedules(
    exam_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    schedules = service.get_exam_schedules(exam_id, institution_id)
    return schedules


@router.put("/schedules/{schedule_id}", response_model=dict)
def update_exam_schedule(
    schedule_id: int,
    schedule_data: ExamScheduleUpdate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    schedule, conflicts = service.update_exam_schedule(schedule_id, institution_id, schedule_data)
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam schedule not found"
        )
    return {
        "schedule": ExamScheduleResponse.model_validate(schedule),
        "conflicts": conflicts,
        "has_conflicts": len(conflicts) > 0
    }


@router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam_schedule(
    schedule_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    deleted = service.delete_exam_schedule(schedule_id, institution_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam schedule not found"
        )


@router.post("/marks", response_model=ExamMarksResponse, status_code=status.HTTP_201_CREATED)
def enter_marks(
    marks_data: ExamMarksCreate,
    entered_by: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    marks = service.enter_marks(
        marks_data.institution_id,
        marks_data.exam_subject_id,
        marks_data.student_id,
        marks_data,
        entered_by
    )
    return marks


@router.post("/marks/bulk", response_model=List[ExamMarksResponse], status_code=status.HTTP_201_CREATED)
def bulk_enter_marks(
    bulk_data: ExamMarksBulkEntry,
    institution_id: int = Query(...),
    entered_by: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    marks_list = service.bulk_enter_marks(institution_id, bulk_data, entered_by)
    return marks_list


@router.get("/subjects/{exam_subject_id}/marks", response_model=List[ExamMarksResponse])
def get_marks_by_subject(
    exam_subject_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    marks = service.get_marks_by_exam_subject(exam_subject_id, institution_id)
    return marks


@router.post("/{exam_id}/results/generate", response_model=List[ExamResultResponse])
def generate_exam_results(
    exam_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    results = service.generate_results(exam_id, institution_id)
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found or no marks entered"
        )
    return results


@router.get("/{exam_id}/results", response_model=List[ExamResultResponse])
def get_exam_results(
    exam_id: int,
    institution_id: int = Query(...),
    section_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    results = service.get_exam_results(exam_id, institution_id, section_id)
    return results


@router.get("/{exam_id}/results/student/{student_id}", response_model=StudentExamResult)
def get_student_result(
    exam_id: int,
    student_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    result = service.get_student_result(exam_id, student_id, institution_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student result not found"
        )
    return result


@router.post("/{exam_id}/analytics/generate", response_model=ExamPerformanceAnalyticsResponse)
def generate_performance_analytics(
    exam_id: int,
    institution_id: int = Query(...),
    section_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    analytics = service.generate_performance_analytics(
        exam_id, institution_id, section_id, subject_id
    )
    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No data available for analytics"
        )
    return analytics


@router.get("/{exam_id}/analytics", response_model=ExamPerformanceAnalyticsResponse)
def get_performance_analytics(
    exam_id: int,
    institution_id: int = Query(...),
    section_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    analytics = service.get_performance_analytics(
        exam_id, institution_id, section_id, subject_id
    )
    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analytics not found"
        )
    return analytics


@router.post("/analytics/compare", response_model=PerformanceComparisonResponse)
def compare_performance(
    comparison_request: PerformanceComparisonRequest,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    comparison = service.compare_performance(institution_id, comparison_request)
    return comparison


@router.post("/grade-configurations", response_model=GradeConfigurationResponse, status_code=status.HTTP_201_CREATED)
def create_grade_configuration(
    config_data: GradeConfigurationCreate,
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    config = service.create_grade_configuration(config_data)
    return config


@router.put("/grade-configurations/{config_id}", response_model=GradeConfigurationResponse)
def update_grade_configuration(
    config_id: int,
    config_data: GradeConfigurationUpdate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    config = service.update_grade_configuration(config_id, institution_id, config_data)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade configuration not found"
        )
    return config


@router.delete("/grade-configurations/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grade_configuration(
    config_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = ExaminationService(db)
    deleted = service.delete_grade_configuration(config_id, institution_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade configuration not found"
        )
