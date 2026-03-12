from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime
import random

from src.database import get_db
from src.models.quiz import (
    Quiz, QuizQuestion, QuizAttempt, QuizResponse,
    QuizLeaderboard, QuizAnalytics, QuizStatus, QuizAttemptStatus,
    QuestionType
)
from src.schemas.quiz import (
    QuizCreate, QuizUpdate, QuizResponse, QuizStudentResponse,
    QuizQuestionCreate, QuizQuestionUpdate, QuizQuestionResponse,
    QuizQuestionStudentResponse, QuizAttemptCreate, QuizAttemptResponse,
    QuizResponseCreate, QuizResponseUpdate, QuizResponseResponse,
    QuizLeaderboardEntry, QuizAnalyticsResponse, QuizBulkCreate,
    QuizSubmission, QuizDetailedAnalytics, QuestionAnalytics
)

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


# Quiz Endpoints
@router.post("", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def create_quiz(quiz: QuizCreate, db: Session = Depends(get_db)):
    db_quiz = Quiz(**quiz.model_dump())
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz


@router.post("/bulk", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def create_quiz_with_questions(bulk_data: QuizBulkCreate, db: Session = Depends(get_db)):
    # Create quiz
    db_quiz = Quiz(**bulk_data.quiz.model_dump())
    db.add(db_quiz)
    db.flush()
    
    # Create questions
    total_marks = 0
    for idx, question in enumerate(bulk_data.questions):
        db_question = QuizQuestion(
            **question.model_dump(),
            quiz_id=db_quiz.id,
            order_index=idx
        )
        db.add(db_question)
        total_marks += question.marks
    
    db_quiz.total_marks = total_marks
    db.commit()
    db.refresh(db_quiz)
    return db_quiz


@router.get("", response_model=List[QuizResponse])
def list_quizzes(
    skip: int = 0,
    limit: int = 100,
    institution_id: Optional[int] = None,
    creator_id: Optional[int] = None,
    grade_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    quiz_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Quiz).filter(Quiz.is_active == True)
    
    if institution_id:
        query = query.filter(Quiz.institution_id == institution_id)
    if creator_id:
        query = query.filter(Quiz.creator_id == creator_id)
    if grade_id:
        query = query.filter(Quiz.grade_id == grade_id)
    if subject_id:
        query = query.filter(Quiz.subject_id == subject_id)
    if quiz_type:
        query = query.filter(Quiz.quiz_type == quiz_type)
    if status:
        query = query.filter(Quiz.status == status)
    if search:
        query = query.filter(
            or_(
                Quiz.title.ilike(f"%{search}%"),
                Quiz.description.ilike(f"%{search}%")
            )
        )
    
    return query.order_by(desc(Quiz.created_at)).offset(skip).limit(limit).all()


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@router.get("/{quiz_id}/student", response_model=QuizStudentResponse)
def get_quiz_for_student(quiz_id: int, db: Session = Depends(get_db)):
    """Get quiz without answers for students"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Remove correct answers from questions
    student_quiz = QuizStudentResponse.model_validate(quiz)
    
    if student_quiz.questions:
        for question in student_quiz.questions:
            if question.options:
                # Remove is_correct field from options
                question.options = [
                    {"id": opt["id"], "text": opt["text"]}
                    for opt in question.options
                ]
    
    # Shuffle questions if enabled
    if quiz.shuffle_questions and student_quiz.questions:
        random.shuffle(student_quiz.questions)
    
    # Shuffle options if enabled
    if quiz.shuffle_options and student_quiz.questions:
        for question in student_quiz.questions:
            if question.options:
                random.shuffle(question.options)
    
    return student_quiz


@router.put("/{quiz_id}", response_model=QuizResponse)
def update_quiz(quiz_id: int, quiz_update: QuizUpdate, db: Session = Depends(get_db)):
    db_quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    for field, value in quiz_update.model_dump(exclude_unset=True).items():
        setattr(db_quiz, field, value)
    
    db.commit()
    db.refresh(db_quiz)
    return db_quiz


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
    db_quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    db.delete(db_quiz)
    db.commit()


@router.post("/{quiz_id}/publish", response_model=QuizResponse)
def publish_quiz(quiz_id: int, db: Session = Depends(get_db)):
    db_quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    db_quiz.status = QuizStatus.PUBLISHED
    db.commit()
    db.refresh(db_quiz)
    return db_quiz


# Question Endpoints
@router.post("/{quiz_id}/questions", response_model=QuizQuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question(quiz_id: int, question: QuizQuestionCreate, db: Session = Depends(get_db)):
    question.quiz_id = quiz_id
    db_question = QuizQuestion(**question.model_dump())
    db.add(db_question)
    
    # Update quiz total marks
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if quiz:
        quiz.total_marks += question.marks
    
    db.commit()
    db.refresh(db_question)
    return db_question


@router.get("/{quiz_id}/questions", response_model=List[QuizQuestionResponse])
def list_questions(quiz_id: int, db: Session = Depends(get_db)):
    questions = db.query(QuizQuestion).filter(
        and_(QuizQuestion.quiz_id == quiz_id, QuizQuestion.is_active == True)
    ).order_by(QuizQuestion.order_index).all()
    return questions


@router.put("/questions/{question_id}", response_model=QuizQuestionResponse)
def update_question(question_id: int, question_update: QuizQuestionUpdate, db: Session = Depends(get_db)):
    db_question = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    old_marks = db_question.marks
    
    for field, value in question_update.model_dump(exclude_unset=True).items():
        setattr(db_question, field, value)
    
    # Update quiz total marks if marks changed
    if 'marks' in question_update.model_dump(exclude_unset=True):
        quiz = db.query(Quiz).filter(Quiz.id == db_question.quiz_id).first()
        if quiz:
            quiz.total_marks = quiz.total_marks - old_marks + db_question.marks
    
    db.commit()
    db.refresh(db_question)
    return db_question


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(question_id: int, db: Session = Depends(get_db)):
    db_question = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    quiz_id = db_question.quiz_id
    marks = db_question.marks
    
    db.delete(db_question)
    
    # Update quiz total marks
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if quiz:
        quiz.total_marks -= marks
    
    db.commit()


# Quiz Attempt Endpoints
@router.post("/attempts", response_model=QuizAttemptResponse, status_code=status.HTTP_201_CREATED)
def start_quiz_attempt(attempt: QuizAttemptCreate, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Check if quiz is available
    now = datetime.utcnow()
    if quiz.available_from and now < quiz.available_from:
        raise HTTPException(status_code=400, detail="Quiz not yet available")
    if quiz.available_until and now > quiz.available_until:
        raise HTTPException(status_code=400, detail="Quiz no longer available")
    
    # Check attempts limit
    if quiz.max_attempts:
        attempts_count = db.query(QuizAttempt).filter(
            and_(
                QuizAttempt.quiz_id == attempt.quiz_id,
                QuizAttempt.user_id == attempt.user_id
            )
        ).count()
        
        if attempts_count >= quiz.max_attempts:
            raise HTTPException(status_code=400, detail="Maximum attempts reached")
    
    # Get attempt number
    attempt_number = db.query(func.max(QuizAttempt.attempt_number)).filter(
        and_(
            QuizAttempt.quiz_id == attempt.quiz_id,
            QuizAttempt.user_id == attempt.user_id
        )
    ).scalar() or 0
    
    # Create attempt
    db_attempt = QuizAttempt(
        quiz_id=attempt.quiz_id,
        user_id=attempt.user_id,
        attempt_number=attempt_number + 1,
        total_questions=len(quiz.questions)
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    return db_attempt


@router.get("/attempts/{attempt_id}", response_model=QuizAttemptResponse)
def get_attempt(attempt_id: int, db: Session = Depends(get_db)):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    return attempt


@router.post("/attempts/{attempt_id}/submit", response_model=QuizAttemptResponse)
def submit_quiz(attempt_id: int, submission: QuizSubmission, db: Session = Depends(get_db)):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.status == QuizAttemptStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Quiz already submitted")
    
    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    
    # Save responses and calculate score
    total_score = 0
    correct_count = 0
    incorrect_count = 0
    
    for response_data in submission.responses:
        question = db.query(QuizQuestion).filter(QuizQuestion.id == response_data.question_id).first()
        if not question:
            continue
        
        # Check if answer is correct
        is_correct = False
        marks_awarded = 0
        
        if question.question_type == QuestionType.MCQ:
            if response_data.user_answer and question.options:
                correct_option = next((opt for opt in question.options if opt.get("is_correct")), None)
                if correct_option and response_data.user_answer == correct_option.get("id"):
                    is_correct = True
                    marks_awarded = question.marks
        
        elif question.question_type == QuestionType.TRUE_FALSE:
            if response_data.user_answer and question.correct_answer:
                if response_data.user_answer.lower() == question.correct_answer.lower():
                    is_correct = True
                    marks_awarded = question.marks
        
        elif question.question_type == QuestionType.FILL_BLANK:
            if response_data.user_answer and question.correct_answer:
                if response_data.user_answer.strip().lower() == question.correct_answer.strip().lower():
                    is_correct = True
                    marks_awarded = question.marks
        
        elif question.question_type == QuestionType.SHORT_ANSWER:
            # Manual grading required for short answers
            marks_awarded = 0
            is_correct = None
        
        if is_correct:
            correct_count += 1
            total_score += marks_awarded
        elif is_correct is False:
            incorrect_count += 1
        
        # Save response
        db_response = QuizResponse(
            attempt_id=attempt_id,
            question_id=response_data.question_id,
            user_answer=response_data.user_answer,
            user_answers=response_data.user_answers,
            is_correct=is_correct,
            marks_awarded=marks_awarded,
            answered_at=datetime.utcnow()
        )
        db.add(db_response)
    
    # Update attempt
    attempt.status = QuizAttemptStatus.COMPLETED
    attempt.score = total_score
    attempt.percentage = (total_score / quiz.total_marks * 100) if quiz.total_marks > 0 else 0
    attempt.correct_answers = correct_count
    attempt.incorrect_answers = incorrect_count
    attempt.unanswered = attempt.total_questions - (correct_count + incorrect_count)
    attempt.time_taken_seconds = submission.time_taken_seconds
    attempt.completed_at = datetime.utcnow()
    
    # Update leaderboard if competitive
    if quiz.enable_leaderboard:
        leaderboard_entry = db.query(QuizLeaderboard).filter(
            and_(
                QuizLeaderboard.quiz_id == quiz.id,
                QuizLeaderboard.user_id == attempt.user_id
            )
        ).first()
        
        if not leaderboard_entry:
            leaderboard_entry = QuizLeaderboard(
                quiz_id=quiz.id,
                user_id=attempt.user_id,
                best_score=total_score,
                best_percentage=attempt.percentage,
                best_time_seconds=submission.time_taken_seconds,
                total_attempts=1
            )
            db.add(leaderboard_entry)
        else:
            leaderboard_entry.total_attempts += 1
            if total_score > leaderboard_entry.best_score:
                leaderboard_entry.best_score = total_score
                leaderboard_entry.best_percentage = attempt.percentage
                leaderboard_entry.best_time_seconds = submission.time_taken_seconds
    
    # Update analytics
    update_quiz_analytics(quiz.id, db)
    
    db.commit()
    db.refresh(attempt)
    return attempt


@router.get("/attempts/{attempt_id}/responses", response_model=List[QuizResponseResponse])
def get_attempt_responses(attempt_id: int, db: Session = Depends(get_db)):
    responses = db.query(QuizResponse).filter(QuizResponse.attempt_id == attempt_id).all()
    return responses


# Leaderboard Endpoints
@router.get("/{quiz_id}/leaderboard", response_model=List[QuizLeaderboardEntry])
def get_leaderboard(quiz_id: int, limit: int = 100, db: Session = Depends(get_db)):
    entries = db.query(QuizLeaderboard).filter(
        QuizLeaderboard.quiz_id == quiz_id
    ).order_by(
        desc(QuizLeaderboard.best_score),
        QuizLeaderboard.best_time_seconds
    ).limit(limit).all()
    
    # Update ranks
    for idx, entry in enumerate(entries, 1):
        entry.rank = idx
    
    db.commit()
    return entries


# Analytics Endpoints
@router.get("/{quiz_id}/analytics", response_model=QuizDetailedAnalytics)
def get_quiz_analytics(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Get or create analytics
    analytics = db.query(QuizAnalytics).filter(QuizAnalytics.quiz_id == quiz_id).first()
    if not analytics:
        update_quiz_analytics(quiz_id, db)
        analytics = db.query(QuizAnalytics).filter(QuizAnalytics.quiz_id == quiz_id).first()
    
    # Get question analytics
    question_analytics = []
    for question in quiz.questions:
        responses = db.query(QuizResponse).filter(QuizResponse.question_id == question.id).all()
        total = len(responses)
        correct = sum(1 for r in responses if r.is_correct)
        incorrect = sum(1 for r in responses if r.is_correct is False)
        avg_time = sum(r.time_taken_seconds for r in responses) / total if total > 0 else 0
        
        question_analytics.append(QuestionAnalytics(
            question_id=question.id,
            question_text=question.question_text[:100],
            total_attempts=total,
            correct_attempts=correct,
            incorrect_attempts=incorrect,
            accuracy_rate=(correct / total * 100) if total > 0 else 0,
            average_time_seconds=int(avg_time)
        ))
    
    # Score distribution
    attempts = db.query(QuizAttempt).filter(
        and_(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.status == QuizAttemptStatus.COMPLETED
        )
    ).all()
    
    score_dist = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    time_dist = {"<5min": 0, "5-10min": 0, "10-20min": 0, "20-30min": 0, ">30min": 0}
    
    for attempt in attempts:
        # Score distribution
        if attempt.percentage <= 20:
            score_dist["0-20"] += 1
        elif attempt.percentage <= 40:
            score_dist["21-40"] += 1
        elif attempt.percentage <= 60:
            score_dist["41-60"] += 1
        elif attempt.percentage <= 80:
            score_dist["61-80"] += 1
        else:
            score_dist["81-100"] += 1
        
        # Time distribution
        time_min = attempt.time_taken_seconds / 60
        if time_min < 5:
            time_dist["<5min"] += 1
        elif time_min < 10:
            time_dist["5-10min"] += 1
        elif time_min < 20:
            time_dist["10-20min"] += 1
        elif time_min < 30:
            time_dist["20-30min"] += 1
        else:
            time_dist[">30min"] += 1
    
    return QuizDetailedAnalytics(
        quiz_analytics=QuizAnalyticsResponse.model_validate(analytics),
        question_analytics=question_analytics,
        score_distribution=score_dist,
        time_distribution=time_dist
    )


def update_quiz_analytics(quiz_id: int, db: Session):
    """Update quiz analytics"""
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id
    ).all()
    
    completed_attempts = [a for a in attempts if a.status == QuizAttemptStatus.COMPLETED]
    
    total_attempts = len(attempts)
    completed_count = len(completed_attempts)
    
    if completed_count > 0:
        avg_score = sum(a.score for a in completed_attempts) / completed_count
        avg_percentage = sum(a.percentage for a in completed_attempts) / completed_count
        avg_time = sum(a.time_taken_seconds for a in completed_attempts) / completed_count
        highest = max(a.score for a in completed_attempts)
        lowest = min(a.score for a in completed_attempts)
        
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        passed = sum(1 for a in completed_attempts if quiz.passing_percentage and a.percentage >= quiz.passing_percentage)
        pass_rate = (passed / completed_count * 100) if quiz.passing_percentage else 0
    else:
        avg_score = avg_percentage = avg_time = highest = lowest = pass_rate = 0
    
    analytics = db.query(QuizAnalytics).filter(QuizAnalytics.quiz_id == quiz_id).first()
    if not analytics:
        analytics = QuizAnalytics(quiz_id=quiz_id)
        db.add(analytics)
    
    analytics.total_attempts = total_attempts
    analytics.completed_attempts = completed_count
    analytics.average_score = avg_score
    analytics.average_percentage = avg_percentage
    analytics.average_time_seconds = int(avg_time)
    analytics.highest_score = highest
    analytics.lowest_score = lowest
    analytics.pass_rate = pass_rate
    
    db.commit()
