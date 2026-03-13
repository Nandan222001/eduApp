from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
import uuid
import json

from src.models.virtual_classroom import (
    VirtualClassroom,
    ClassroomParticipant,
    ClassroomRecording,
    RecordingView,
    BreakoutRoom,
    BreakoutRoomParticipant,
    ClassroomAttendance,
    ClassroomPoll,
    PollResponse,
    ClassroomQuiz,
    QuizSubmission,
    WhiteboardSession,
    ClassroomStatus,
    RecordingStatus,
    ParticipantRole,
    BreakoutRoomStatus,
    PollStatus,
    QuizStatus
)
from src.schemas.virtual_classroom import (
    VirtualClassroomCreate,
    VirtualClassroomUpdate,
    BreakoutRoomCreate,
    PollCreate,
    PollUpdate,
    QuizCreate,
    QuizUpdate,
    QuizSubmissionCreate,
    PollResponseCreate
)
from src.services.agora_service import AgoraService
from src.redis_client import get_redis


class VirtualClassroomService:
    def __init__(self, db: Session):
        self.db = db
        self.agora_service = AgoraService()

    async def create_classroom(
        self,
        institution_id: int,
        teacher_id: int,
        data: VirtualClassroomCreate
    ) -> VirtualClassroom:
        channel_name = f"classroom_{uuid.uuid4().hex[:12]}"
        
        classroom = VirtualClassroom(
            institution_id=institution_id,
            teacher_id=teacher_id,
            subject_id=data.subject_id,
            section_id=data.section_id,
            title=data.title,
            description=data.description,
            channel_name=channel_name,
            scheduled_start_time=data.scheduled_start_time,
            scheduled_end_time=data.scheduled_end_time,
            max_participants=data.max_participants,
            is_recording_enabled=data.is_recording_enabled,
            is_screen_sharing_enabled=data.is_screen_sharing_enabled,
            is_whiteboard_enabled=data.is_whiteboard_enabled,
            is_chat_enabled=data.is_chat_enabled,
            is_breakout_rooms_enabled=data.is_breakout_rooms_enabled,
            settings=data.settings or {},
            status=ClassroomStatus.SCHEDULED
        )
        
        self.db.add(classroom)
        self.db.flush()
        
        if data.participant_user_ids:
            for user_id in data.participant_user_ids:
                participant = ClassroomParticipant(
                    classroom_id=classroom.id,
                    user_id=user_id,
                    role=ParticipantRole.PARTICIPANT
                )
                self.db.add(participant)
        
        self.db.commit()
        self.db.refresh(classroom)
        
        return classroom

    def get_classroom(self, classroom_id: int) -> Optional[VirtualClassroom]:
        return self.db.query(VirtualClassroom).filter(
            VirtualClassroom.id == classroom_id
        ).first()

    def list_classrooms(
        self,
        institution_id: int,
        status: Optional[ClassroomStatus] = None,
        teacher_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        section_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[VirtualClassroom], int]:
        query = self.db.query(VirtualClassroom).filter(
            VirtualClassroom.institution_id == institution_id
        )
        
        if status:
            query = query.filter(VirtualClassroom.status == status)
        if teacher_id:
            query = query.filter(VirtualClassroom.teacher_id == teacher_id)
        if subject_id:
            query = query.filter(VirtualClassroom.subject_id == subject_id)
        if section_id:
            query = query.filter(VirtualClassroom.section_id == section_id)
        if start_date:
            query = query.filter(VirtualClassroom.scheduled_start_time >= start_date)
        if end_date:
            query = query.filter(VirtualClassroom.scheduled_start_time <= end_date)
        
        total = query.count()
        classrooms = query.order_by(
            VirtualClassroom.scheduled_start_time.desc()
        ).offset(skip).limit(limit).all()
        
        return classrooms, total

    async def update_classroom(
        self,
        classroom_id: int,
        data: VirtualClassroomUpdate
    ) -> Optional[VirtualClassroom]:
        classroom = self.get_classroom(classroom_id)
        if not classroom:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(classroom, field, value)
        
        self.db.commit()
        self.db.refresh(classroom)
        
        return classroom

    async def start_classroom(self, classroom_id: int) -> VirtualClassroom:
        classroom = self.get_classroom(classroom_id)
        if not classroom:
            raise ValueError("Classroom not found")
        
        if classroom.status != ClassroomStatus.SCHEDULED:
            raise ValueError("Classroom is not in scheduled state")
        
        classroom.status = ClassroomStatus.LIVE
        classroom.actual_start_time = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(classroom)
        
        redis_client = await get_redis()
        await redis_client.set(
            f"classroom:live:{classroom_id}",
            json.dumps({"started_at": classroom.actual_start_time.isoformat()}),
            ex=86400
        )
        
        return classroom

    async def end_classroom(self, classroom_id: int) -> VirtualClassroom:
        classroom = self.get_classroom(classroom_id)
        if not classroom:
            raise ValueError("Classroom not found")
        
        if classroom.status != ClassroomStatus.LIVE:
            raise ValueError("Classroom is not live")
        
        classroom.status = ClassroomStatus.ENDED
        classroom.actual_end_time = datetime.utcnow()
        
        participants = self.db.query(ClassroomParticipant).filter(
            ClassroomParticipant.classroom_id == classroom_id,
            ClassroomParticipant.left_at.is_(None)
        ).all()
        
        for participant in participants:
            participant.left_at = datetime.utcnow()
            if participant.joined_at:
                duration = (participant.left_at - participant.joined_at).total_seconds()
                participant.duration_seconds += int(duration)
        
        await self._calculate_attendance(classroom_id)
        
        self.db.commit()
        self.db.refresh(classroom)
        
        redis_client = await get_redis()
        await redis_client.delete(f"classroom:live:{classroom_id}")
        
        return classroom

    async def join_classroom(
        self,
        classroom_id: int,
        user_id: int,
        role: ParticipantRole = ParticipantRole.PARTICIPANT
    ) -> tuple[ClassroomParticipant, str]:
        classroom = self.get_classroom(classroom_id)
        if not classroom:
            raise ValueError("Classroom not found")
        
        if classroom.status != ClassroomStatus.LIVE:
            raise ValueError("Classroom is not live")
        
        participant = self.db.query(ClassroomParticipant).filter(
            ClassroomParticipant.classroom_id == classroom_id,
            ClassroomParticipant.user_id == user_id
        ).first()
        
        if not participant:
            participant = ClassroomParticipant(
                classroom_id=classroom_id,
                user_id=user_id,
                role=role
            )
            self.db.add(participant)
        
        uid = participant.agora_uid or (1000 + user_id)
        participant.agora_uid = uid
        
        token = self.agora_service.generate_rtc_token(
            channel_name=classroom.channel_name,
            uid=uid,
            role=1 if role in [ParticipantRole.HOST, ParticipantRole.MODERATOR] else 2
        )
        
        participant.token = token
        participant.token_expires_at = datetime.utcnow() + timedelta(hours=1)
        participant.joined_at = datetime.utcnow()
        participant.left_at = None
        
        self.db.commit()
        self.db.refresh(participant)
        
        redis_client = await get_redis()
        await redis_client.sadd(f"classroom:participants:{classroom_id}", str(user_id))
        
        return participant, token

    async def leave_classroom(
        self,
        classroom_id: int,
        user_id: int
    ) -> Optional[ClassroomParticipant]:
        participant = self.db.query(ClassroomParticipant).filter(
            ClassroomParticipant.classroom_id == classroom_id,
            ClassroomParticipant.user_id == user_id
        ).first()
        
        if not participant:
            return None
        
        participant.left_at = datetime.utcnow()
        
        if participant.joined_at:
            duration = (participant.left_at - participant.joined_at).total_seconds()
            participant.duration_seconds += int(duration)
        
        self.db.commit()
        self.db.refresh(participant)
        
        redis_client = await get_redis()
        await redis_client.srem(f"classroom:participants:{classroom_id}", str(user_id))
        
        return participant

    async def update_participant_status(
        self,
        classroom_id: int,
        user_id: int,
        is_video_enabled: Optional[bool] = None,
        is_audio_enabled: Optional[bool] = None,
        is_screen_sharing: Optional[bool] = None
    ) -> Optional[ClassroomParticipant]:
        participant = self.db.query(ClassroomParticipant).filter(
            ClassroomParticipant.classroom_id == classroom_id,
            ClassroomParticipant.user_id == user_id
        ).first()
        
        if not participant:
            return None
        
        if is_video_enabled is not None:
            participant.is_video_enabled = is_video_enabled
        if is_audio_enabled is not None:
            participant.is_audio_enabled = is_audio_enabled
        if is_screen_sharing is not None:
            participant.is_screen_sharing = is_screen_sharing
        
        self.db.commit()
        self.db.refresh(participant)
        
        return participant

    async def start_recording(
        self,
        classroom_id: int
    ) -> ClassroomRecording:
        classroom = self.get_classroom(classroom_id)
        if not classroom:
            raise ValueError("Classroom not found")
        
        if not classroom.is_recording_enabled:
            raise ValueError("Recording is not enabled for this classroom")
        
        recording_id = f"rec_{uuid.uuid4().hex[:16]}"
        recording_uid = str(9000 + classroom_id)
        
        token = self.agora_service.generate_rtc_token(
            channel_name=classroom.channel_name,
            uid=int(recording_uid),
            role=1
        )
        
        acquire_response = await self.agora_service.acquire_recording_resource(
            channel_name=classroom.channel_name,
            uid=recording_uid
        )
        
        resource_id = acquire_response.get("resourceId")
        
        start_response = await self.agora_service.start_recording(
            channel_name=classroom.channel_name,
            uid=recording_uid,
            resource_id=resource_id,
            token=token
        )
        
        sid = start_response.get("sid")
        
        recording = ClassroomRecording(
            classroom_id=classroom_id,
            recording_id=recording_id,
            resource_id=resource_id,
            sid=sid,
            status=RecordingStatus.RECORDING,
            started_at=datetime.utcnow(),
            metadata={"acquire_response": acquire_response, "start_response": start_response}
        )
        
        self.db.add(recording)
        self.db.commit()
        self.db.refresh(recording)
        
        return recording

    async def stop_recording(
        self,
        recording_id: int
    ) -> ClassroomRecording:
        recording = self.db.query(ClassroomRecording).filter(
            ClassroomRecording.id == recording_id
        ).first()
        
        if not recording:
            raise ValueError("Recording not found")
        
        if recording.status != RecordingStatus.RECORDING:
            raise ValueError("Recording is not active")
        
        classroom = self.get_classroom(recording.classroom_id)
        recording_uid = str(9000 + recording.classroom_id)
        
        stop_response = await self.agora_service.stop_recording(
            channel_name=classroom.channel_name,
            uid=recording_uid,
            resource_id=recording.resource_id,
            sid=recording.sid
        )
        
        recording.status = RecordingStatus.PROCESSING
        recording.stopped_at = datetime.utcnow()
        
        if recording.started_at:
            duration = (recording.stopped_at - recording.started_at).total_seconds()
            recording.duration_seconds = int(duration)
        
        metadata = recording.metadata or {}
        metadata["stop_response"] = stop_response
        recording.metadata = metadata
        
        self.db.commit()
        self.db.refresh(recording)
        
        return recording

    async def update_recording_status(
        self,
        recording_id: int,
        status: RecordingStatus,
        file_url: Optional[str] = None,
        s3_key: Optional[str] = None,
        file_size: Optional[int] = None
    ) -> ClassroomRecording:
        recording = self.db.query(ClassroomRecording).filter(
            ClassroomRecording.id == recording_id
        ).first()
        
        if not recording:
            raise ValueError("Recording not found")
        
        recording.status = status
        if file_url:
            recording.file_url = file_url
        if s3_key:
            recording.s3_key = s3_key
        if file_size:
            recording.file_size = file_size
        
        self.db.commit()
        self.db.refresh(recording)
        
        return recording

    async def create_breakout_room(
        self,
        classroom_id: int,
        data: BreakoutRoomCreate
    ) -> BreakoutRoom:
        classroom = self.get_classroom(classroom_id)
        if not classroom:
            raise ValueError("Classroom not found")
        
        if not classroom.is_breakout_rooms_enabled:
            raise ValueError("Breakout rooms are not enabled")
        
        channel_name = f"breakout_{uuid.uuid4().hex[:12]}"
        
        breakout_room = BreakoutRoom(
            classroom_id=classroom_id,
            name=data.name,
            channel_name=channel_name,
            max_participants=data.max_participants,
            duration_minutes=data.duration_minutes,
            status=BreakoutRoomStatus.ACTIVE
        )
        
        self.db.add(breakout_room)
        self.db.flush()
        
        for user_id in data.participant_user_ids:
            participant = BreakoutRoomParticipant(
                breakout_room_id=breakout_room.id,
                user_id=user_id
            )
            self.db.add(participant)
        
        self.db.commit()
        self.db.refresh(breakout_room)
        
        return breakout_room

    async def join_breakout_room(
        self,
        breakout_room_id: int,
        user_id: int
    ) -> tuple[BreakoutRoomParticipant, str]:
        breakout_room = self.db.query(BreakoutRoom).filter(
            BreakoutRoom.id == breakout_room_id
        ).first()
        
        if not breakout_room:
            raise ValueError("Breakout room not found")
        
        if breakout_room.status != BreakoutRoomStatus.ACTIVE:
            raise ValueError("Breakout room is not active")
        
        participant = self.db.query(BreakoutRoomParticipant).filter(
            BreakoutRoomParticipant.breakout_room_id == breakout_room_id,
            BreakoutRoomParticipant.user_id == user_id
        ).first()
        
        if not participant:
            raise ValueError("User not assigned to this breakout room")
        
        uid = participant.agora_uid or (2000 + user_id)
        participant.agora_uid = uid
        
        token = self.agora_service.generate_rtc_token(
            channel_name=breakout_room.channel_name,
            uid=uid,
            role=2
        )
        
        participant.token = token
        participant.token_expires_at = datetime.utcnow() + timedelta(hours=1)
        participant.joined_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(participant)
        
        return participant, token

    async def close_breakout_room(self, breakout_room_id: int) -> BreakoutRoom:
        breakout_room = self.db.query(BreakoutRoom).filter(
            BreakoutRoom.id == breakout_room_id
        ).first()
        
        if not breakout_room:
            raise ValueError("Breakout room not found")
        
        breakout_room.status = BreakoutRoomStatus.CLOSED
        breakout_room.closed_at = datetime.utcnow()
        
        participants = self.db.query(BreakoutRoomParticipant).filter(
            BreakoutRoomParticipant.breakout_room_id == breakout_room_id,
            BreakoutRoomParticipant.left_at.is_(None)
        ).all()
        
        for participant in participants:
            participant.left_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(breakout_room)
        
        return breakout_room

    async def _calculate_attendance(self, classroom_id: int):
        classroom = self.get_classroom(classroom_id)
        if not classroom or not classroom.actual_end_time or not classroom.actual_start_time:
            return
        
        total_duration = (classroom.actual_end_time - classroom.actual_start_time).total_seconds()
        
        participants = self.db.query(ClassroomParticipant).filter(
            ClassroomParticipant.classroom_id == classroom_id
        ).all()
        
        for participant in participants:
            attendance = self.db.query(ClassroomAttendance).filter(
                ClassroomAttendance.classroom_id == classroom_id,
                ClassroomAttendance.user_id == participant.user_id
            ).first()
            
            if not attendance:
                attendance = ClassroomAttendance(
                    classroom_id=classroom_id,
                    user_id=participant.user_id
                )
                self.db.add(attendance)
            
            attendance.joined_at = participant.joined_at or classroom.actual_start_time
            attendance.left_at = participant.left_at or classroom.actual_end_time
            attendance.total_duration_seconds = participant.duration_seconds
            
            if total_duration > 0:
                attendance.attendance_percentage = (participant.duration_seconds / total_duration) * 100
            else:
                attendance.attendance_percentage = 0
            
            attendance.is_present = attendance.attendance_percentage >= 50
        
        self.db.commit()

    def get_attendance(
        self,
        classroom_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[ClassroomAttendance], int]:
        query = self.db.query(ClassroomAttendance).filter(
            ClassroomAttendance.classroom_id == classroom_id
        )
        
        total = query.count()
        records = query.order_by(
            ClassroomAttendance.attendance_percentage.desc()
        ).offset(skip).limit(limit).all()
        
        return records, total

    async def create_poll(
        self,
        classroom_id: int,
        user_id: int,
        data: PollCreate
    ) -> ClassroomPoll:
        poll = ClassroomPoll(
            classroom_id=classroom_id,
            created_by=user_id,
            question=data.question,
            options=[opt.model_dump() for opt in data.options],
            is_anonymous=data.is_anonymous,
            allow_multiple_choices=data.allow_multiple_choices,
            status=PollStatus.DRAFT
        )
        
        self.db.add(poll)
        self.db.commit()
        self.db.refresh(poll)
        
        return poll

    async def start_poll(self, poll_id: int) -> ClassroomPoll:
        poll = self.db.query(ClassroomPoll).filter(
            ClassroomPoll.id == poll_id
        ).first()
        
        if not poll:
            raise ValueError("Poll not found")
        
        poll.status = PollStatus.ACTIVE
        poll.started_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(poll)
        
        return poll

    async def end_poll(self, poll_id: int) -> ClassroomPoll:
        poll = self.db.query(ClassroomPoll).filter(
            ClassroomPoll.id == poll_id
        ).first()
        
        if not poll:
            raise ValueError("Poll not found")
        
        poll.status = PollStatus.ENDED
        poll.ended_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(poll)
        
        return poll

    async def submit_poll_response(
        self,
        poll_id: int,
        user_id: int,
        data: PollResponseCreate
    ) -> PollResponse:
        poll = self.db.query(ClassroomPoll).filter(
            ClassroomPoll.id == poll_id
        ).first()
        
        if not poll:
            raise ValueError("Poll not found")
        
        if poll.status != PollStatus.ACTIVE:
            raise ValueError("Poll is not active")
        
        response = self.db.query(PollResponse).filter(
            PollResponse.poll_id == poll_id,
            PollResponse.user_id == user_id
        ).first()
        
        if response:
            response.selected_options = data.selected_options
        else:
            response = PollResponse(
                poll_id=poll_id,
                user_id=user_id,
                selected_options=data.selected_options
            )
            self.db.add(response)
        
        self.db.commit()
        self.db.refresh(response)
        
        return response

    def get_poll_results(self, poll_id: int) -> Dict[str, Any]:
        poll = self.db.query(ClassroomPoll).filter(
            ClassroomPoll.id == poll_id
        ).first()
        
        if not poll:
            raise ValueError("Poll not found")
        
        responses = self.db.query(PollResponse).filter(
            PollResponse.poll_id == poll_id
        ).all()
        
        results = {}
        for option in poll.options:
            results[option['value']] = {
                'text': option['text'],
                'count': 0,
                'percentage': 0
            }
        
        total_responses = len(responses)
        
        for response in responses:
            for selected in response.selected_options:
                if selected in results:
                    results[selected]['count'] += 1
        
        if total_responses > 0:
            for option in results.values():
                option['percentage'] = (option['count'] / total_responses) * 100
        
        return {
            'total_responses': total_responses,
            'results': results
        }

    async def create_quiz(
        self,
        classroom_id: int,
        user_id: int,
        data: QuizCreate
    ) -> ClassroomQuiz:
        questions = [q.model_dump() for q in data.questions]
        
        quiz = ClassroomQuiz(
            classroom_id=classroom_id,
            created_by=user_id,
            title=data.title,
            description=data.description,
            questions=questions,
            duration_minutes=data.duration_minutes,
            passing_score=data.passing_score,
            status=QuizStatus.DRAFT
        )
        
        self.db.add(quiz)
        self.db.commit()
        self.db.refresh(quiz)
        
        return quiz

    async def start_quiz(self, quiz_id: int) -> ClassroomQuiz:
        quiz = self.db.query(ClassroomQuiz).filter(
            ClassroomQuiz.id == quiz_id
        ).first()
        
        if not quiz:
            raise ValueError("Quiz not found")
        
        quiz.status = QuizStatus.ACTIVE
        quiz.started_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(quiz)
        
        return quiz

    async def end_quiz(self, quiz_id: int) -> ClassroomQuiz:
        quiz = self.db.query(ClassroomQuiz).filter(
            ClassroomQuiz.id == quiz_id
        ).first()
        
        if not quiz:
            raise ValueError("Quiz not found")
        
        quiz.status = QuizStatus.ENDED
        quiz.ended_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(quiz)
        
        return quiz

    async def submit_quiz(
        self,
        quiz_id: int,
        user_id: int,
        data: QuizSubmissionCreate
    ) -> QuizSubmission:
        quiz = self.db.query(ClassroomQuiz).filter(
            ClassroomQuiz.id == quiz_id
        ).first()
        
        if not quiz:
            raise ValueError("Quiz not found")
        
        if quiz.status != QuizStatus.ACTIVE:
            raise ValueError("Quiz is not active")
        
        submission = self.db.query(QuizSubmission).filter(
            QuizSubmission.quiz_id == quiz_id,
            QuizSubmission.user_id == user_id
        ).first()
        
        if not submission:
            submission = QuizSubmission(
                quiz_id=quiz_id,
                user_id=user_id,
                started_at=datetime.utcnow(),
                total_questions=len(quiz.questions)
            )
            self.db.add(submission)
        
        answers = [a.model_dump() for a in data.answers]
        submission.answers = answers
        submission.submitted_at = datetime.utcnow()
        
        if submission.started_at:
            time_taken = (submission.submitted_at - submission.started_at).total_seconds()
            submission.time_taken_seconds = int(time_taken)
        
        correct_answers = 0
        for answer in answers:
            question_id = answer['question_id']
            user_answer = answer['answer']
            
            for question in quiz.questions:
                if question.get('id') == question_id or str(question.get('question')) == str(question_id):
                    if str(question.get('correct_answer')).lower() == str(user_answer).lower():
                        correct_answers += 1
                    break
        
        submission.correct_answers = correct_answers
        submission.score = int((correct_answers / len(quiz.questions)) * 100) if quiz.questions else 0
        submission.is_passed = submission.score >= quiz.passing_score
        
        self.db.commit()
        self.db.refresh(submission)
        
        return submission

    async def save_whiteboard_session(
        self,
        classroom_id: int,
        session_data: Dict[str, Any]
    ) -> WhiteboardSession:
        session = WhiteboardSession(
            classroom_id=classroom_id,
            session_data=session_data
        )
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        
        return session

    def get_classroom_analytics(self, classroom_id: int) -> Dict[str, Any]:
        classroom = self.get_classroom(classroom_id)
        if not classroom:
            raise ValueError("Classroom not found")
        
        participants_count = self.db.query(ClassroomParticipant).filter(
            ClassroomParticipant.classroom_id == classroom_id
        ).count()
        
        avg_duration = self.db.query(func.avg(ClassroomParticipant.duration_seconds)).filter(
            ClassroomParticipant.classroom_id == classroom_id
        ).scalar() or 0
        
        polls_count = self.db.query(ClassroomPoll).filter(
            ClassroomPoll.classroom_id == classroom_id
        ).count()
        
        quizzes_count = self.db.query(ClassroomQuiz).filter(
            ClassroomQuiz.classroom_id == classroom_id
        ).count()
        
        recordings_count = self.db.query(ClassroomRecording).filter(
            ClassroomRecording.classroom_id == classroom_id,
            ClassroomRecording.status == RecordingStatus.COMPLETED
        ).count()
        
        breakout_rooms_count = self.db.query(BreakoutRoom).filter(
            BreakoutRoom.classroom_id == classroom_id
        ).count()
        
        return {
            'classroom_id': classroom_id,
            'total_participants': participants_count,
            'average_duration_minutes': avg_duration / 60,
            'polls_created': polls_count,
            'quizzes_created': quizzes_count,
            'recordings_count': recordings_count,
            'breakout_rooms_created': breakout_rooms_count
        }
