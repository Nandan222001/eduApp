from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from src.services.websocket_manager import websocket_manager
import logging

logger = logging.getLogger(__name__)


class RealtimeService:
    @staticmethod
    async def notify_attendance_update(
        db: Session,
        student_id: int,
        student_name: str,
        date: str,
        status: str,
        parent_user_ids: List[int]
    ):
        await websocket_manager.send_attendance_update(
            user_ids=parent_user_ids,
            student_id=student_id,
            student_name=student_name,
            date=date,
            status=status
        )

    @staticmethod
    async def notify_new_message(
        db: Session,
        recipient_user_id: int,
        message_id: int,
        sender_id: int,
        sender_name: str,
        subject: str,
        preview: str
    ):
        await websocket_manager.send_message_notification(
            user_id=recipient_user_id,
            message_id=message_id,
            sender_id=sender_id,
            sender_name=sender_name,
            subject=subject,
            preview=preview
        )

    @staticmethod
    async def notify_new_announcement(
        db: Session,
        user_ids: List[int],
        announcement_id: int,
        title: str,
        priority: str
    ):
        for user_id in user_ids:
            await websocket_manager.send_announcement_notification(
                user_id=user_id,
                announcement_id=announcement_id,
                title=title,
                priority=priority
            )

    @staticmethod
    async def broadcast_chat_message(
        room: str,
        sender_id: int,
        sender_name: str,
        message: str,
        message_id: Optional[int] = None
    ):
        await websocket_manager.send_chat_message(
            room=room,
            sender_id=sender_id,
            sender_name=sender_name,
            message=message,
            message_id=message_id
        )

    @staticmethod
    async def update_quiz_leaderboard(
        db: Session,
        quiz_id: int,
        leaderboard_data: List[dict]
    ):
        await websocket_manager.send_leaderboard_update(
            quiz_id=quiz_id,
            leaderboard_data=leaderboard_data
        )

    @staticmethod
    async def notify_general(
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        data: Optional[dict] = None
    ):
        await websocket_manager.send_notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data
        )

    @staticmethod
    async def broadcast_to_room(
        room: str,
        event_type: str,
        data: dict,
        exclude_user: Optional[int] = None
    ):
        message = {
            "type": event_type,
            **data
        }
        await websocket_manager.broadcast_to_room(room, message, exclude_user)

    @staticmethod
    def get_online_users(user_ids: List[int]) -> List[int]:
        return websocket_manager.get_online_users(user_ids)

    @staticmethod
    def is_user_online(user_id: int) -> bool:
        return websocket_manager.is_user_connected(user_id)


realtime_service = RealtimeService()
