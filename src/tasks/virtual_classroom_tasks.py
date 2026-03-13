import boto3
from datetime import datetime
from sqlalchemy.orm import Session
from src.celery_app import celery
from src.database import SessionLocal
from src.models.virtual_classroom import ClassroomRecording, RecordingStatus
from src.services.agora_service import AgoraService
from src.config import settings


@celery.task(name="process_classroom_recording")
def process_classroom_recording(recording_id: int):
    """Process and finalize classroom recording after it's been uploaded to S3"""
    db = SessionLocal()
    
    try:
        recording = db.query(ClassroomRecording).filter(
            ClassroomRecording.id == recording_id
        ).first()
        
        if not recording:
            return {"error": "Recording not found"}
        
        if recording.status != RecordingStatus.PROCESSING:
            return {"error": "Recording is not in processing state"}
        
        agora_service = AgoraService()
        
        query_response = agora_service.query_recording(
            resource_id=recording.resource_id,
            sid=recording.sid
        )
        
        server_response = query_response.get("serverResponse", {})
        file_list = server_response.get("fileList", [])
        
        if not file_list:
            recording.status = RecordingStatus.FAILED
            recording.error_message = "No files found in recording"
            db.commit()
            return {"error": "No files found"}
        
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
        
        main_file = file_list[0]
        file_name = main_file.get("fileName")
        
        s3_key = f"recordings/{recording.classroom.channel_name}/{file_name}"
        
        s3_url = f"https://{settings.s3_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{s3_key}"
        
        recording.file_url = s3_url
        recording.s3_key = s3_key
        recording.file_size = main_file.get("fileSize")
        recording.status = RecordingStatus.COMPLETED
        
        db.commit()
        
        return {
            "recording_id": recording_id,
            "status": "completed",
            "file_url": s3_url
        }
    
    except Exception as e:
        if recording:
            recording.status = RecordingStatus.FAILED
            recording.error_message = str(e)
            db.commit()
        
        return {"error": str(e)}
    
    finally:
        db.close()


@celery.task(name="check_recording_status")
def check_recording_status(recording_id: int):
    """Check and update recording status periodically"""
    db = SessionLocal()
    
    try:
        recording = db.query(ClassroomRecording).filter(
            ClassroomRecording.id == recording_id
        ).first()
        
        if not recording:
            return {"error": "Recording not found"}
        
        if recording.status not in [RecordingStatus.RECORDING, RecordingStatus.PROCESSING]:
            return {"status": "already_completed"}
        
        agora_service = AgoraService()
        
        query_response = agora_service.query_recording(
            resource_id=recording.resource_id,
            sid=recording.sid
        )
        
        server_response = query_response.get("serverResponse", {})
        status = server_response.get("status")
        
        if status == 5:
            process_classroom_recording.delay(recording_id)
        
        return {"recording_id": recording_id, "agora_status": status}
    
    except Exception as e:
        return {"error": str(e)}
    
    finally:
        db.close()


@celery.task(name="calculate_classroom_attendance")
def calculate_classroom_attendance(classroom_id: int):
    """Calculate attendance for a completed classroom session"""
    from src.models.virtual_classroom import VirtualClassroom, ClassroomParticipant, ClassroomAttendance
    from src.models.student import Student
    
    db = SessionLocal()
    
    try:
        classroom = db.query(VirtualClassroom).filter(
            VirtualClassroom.id == classroom_id
        ).first()
        
        if not classroom:
            return {"error": "Classroom not found"}
        
        if not classroom.actual_start_time or not classroom.actual_end_time:
            return {"error": "Classroom start/end time not set"}
        
        total_duration = (classroom.actual_end_time - classroom.actual_start_time).total_seconds()
        
        participants = db.query(ClassroomParticipant).filter(
            ClassroomParticipant.classroom_id == classroom_id
        ).all()
        
        for participant in participants:
            attendance = db.query(ClassroomAttendance).filter(
                ClassroomAttendance.classroom_id == classroom_id,
                ClassroomAttendance.user_id == participant.user_id
            ).first()
            
            if not attendance:
                attendance = ClassroomAttendance(
                    classroom_id=classroom_id,
                    user_id=participant.user_id
                )
                db.add(attendance)
            
            student = db.query(Student).filter(
                Student.user_id == participant.user_id
            ).first()
            
            if student:
                attendance.student_id = student.id
            
            attendance.joined_at = participant.joined_at or classroom.actual_start_time
            attendance.left_at = participant.left_at or classroom.actual_end_time
            attendance.total_duration_seconds = participant.duration_seconds
            
            if total_duration > 0:
                attendance.attendance_percentage = (participant.duration_seconds / total_duration) * 100
            else:
                attendance.attendance_percentage = 0
            
            attendance.is_present = attendance.attendance_percentage >= 50
        
        db.commit()
        
        return {
            "classroom_id": classroom_id,
            "total_participants": len(participants),
            "status": "completed"
        }
    
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    
    finally:
        db.close()


@celery.task(name="close_expired_breakout_rooms")
def close_expired_breakout_rooms():
    """Close breakout rooms that have exceeded their duration"""
    from src.models.virtual_classroom import BreakoutRoom, BreakoutRoomStatus, BreakoutRoomParticipant
    from datetime import timedelta
    
    db = SessionLocal()
    
    try:
        active_rooms = db.query(BreakoutRoom).filter(
            BreakoutRoom.status == BreakoutRoomStatus.ACTIVE
        ).all()
        
        closed_count = 0
        
        for room in active_rooms:
            expiry_time = room.created_at + timedelta(minutes=room.duration_minutes)
            
            if datetime.utcnow() >= expiry_time:
                room.status = BreakoutRoomStatus.CLOSED
                room.closed_at = datetime.utcnow()
                
                participants = db.query(BreakoutRoomParticipant).filter(
                    BreakoutRoomParticipant.breakout_room_id == room.id,
                    BreakoutRoomParticipant.left_at.is_(None)
                ).all()
                
                for participant in participants:
                    participant.left_at = datetime.utcnow()
                
                closed_count += 1
        
        db.commit()
        
        return {
            "closed_count": closed_count,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    
    finally:
        db.close()


@celery.task(name="send_classroom_reminder")
def send_classroom_reminder(classroom_id: int):
    """Send reminder notifications before classroom starts"""
    from src.models.virtual_classroom import VirtualClassroom
    from src.services.notification_service import NotificationService
    
    db = SessionLocal()
    
    try:
        classroom = db.query(VirtualClassroom).filter(
            VirtualClassroom.id == classroom_id
        ).first()
        
        if not classroom:
            return {"error": "Classroom not found"}
        
        notification_service = NotificationService(db)
        
        for participant in classroom.participants:
            notification_service.create_notification(
                user_id=participant.user_id,
                title="Upcoming Virtual Class",
                message=f"Your class '{classroom.title}' starts in 15 minutes",
                notification_type="classroom_reminder",
                priority="high",
                data={
                    "classroom_id": classroom.id,
                    "scheduled_start_time": classroom.scheduled_start_time.isoformat()
                }
            )
        
        return {
            "classroom_id": classroom_id,
            "notifications_sent": len(classroom.participants)
        }
    
    except Exception as e:
        return {"error": str(e)}
    
    finally:
        db.close()


@celery.task(name="generate_classroom_report")
def generate_classroom_report(classroom_id: int):
    """Generate a comprehensive report for a completed classroom session"""
    from src.models.virtual_classroom import (
        VirtualClassroom,
        ClassroomParticipant,
        ClassroomAttendance,
        ClassroomPoll,
        ClassroomQuiz,
        ClassroomRecording
    )
    
    db = SessionLocal()
    
    try:
        classroom = db.query(VirtualClassroom).filter(
            VirtualClassroom.id == classroom_id
        ).first()
        
        if not classroom:
            return {"error": "Classroom not found"}
        
        participants_count = db.query(ClassroomParticipant).filter(
            ClassroomParticipant.classroom_id == classroom_id
        ).count()
        
        attendance_records = db.query(ClassroomAttendance).filter(
            ClassroomAttendance.classroom_id == classroom_id
        ).all()
        
        present_count = sum(1 for a in attendance_records if a.is_present)
        avg_attendance = sum(a.attendance_percentage for a in attendance_records) / len(attendance_records) if attendance_records else 0
        
        polls_count = db.query(ClassroomPoll).filter(
            ClassroomPoll.classroom_id == classroom_id
        ).count()
        
        quizzes_count = db.query(ClassroomQuiz).filter(
            ClassroomQuiz.classroom_id == classroom_id
        ).count()
        
        recordings_count = db.query(ClassroomRecording).filter(
            ClassroomRecording.classroom_id == classroom_id,
            ClassroomRecording.status == RecordingStatus.COMPLETED
        ).count()
        
        duration_seconds = 0
        if classroom.actual_start_time and classroom.actual_end_time:
            duration_seconds = (classroom.actual_end_time - classroom.actual_start_time).total_seconds()
        
        report = {
            "classroom_id": classroom_id,
            "title": classroom.title,
            "scheduled_start": classroom.scheduled_start_time.isoformat(),
            "scheduled_end": classroom.scheduled_end_time.isoformat(),
            "actual_start": classroom.actual_start_time.isoformat() if classroom.actual_start_time else None,
            "actual_end": classroom.actual_end_time.isoformat() if classroom.actual_end_time else None,
            "duration_minutes": duration_seconds / 60,
            "total_participants": participants_count,
            "present_count": present_count,
            "absent_count": participants_count - present_count,
            "average_attendance_percentage": avg_attendance,
            "polls_conducted": polls_count,
            "quizzes_conducted": quizzes_count,
            "recordings_count": recordings_count,
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return report
    
    except Exception as e:
        return {"error": str(e)}
    
    finally:
        db.close()
