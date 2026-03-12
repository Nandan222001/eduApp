from typing import Dict, Set, Optional, List
from fastapi import WebSocket
import json
import logging
from datetime import datetime
from collections import defaultdict

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        self.user_presence: Dict[int, Dict[str, any]] = {}
        self.typing_indicators: Dict[str, Dict[int, datetime]] = defaultdict(dict)
        self.room_subscriptions: Dict[str, Set[int]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, user_id: int) -> None:
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        
        self.user_presence[user_id] = {
            "status": "online",
            "last_seen": datetime.utcnow().isoformat(),
            "connected_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"User {user_id} connected via WebSocket")
        
        await self.broadcast_presence_update(user_id, "online")

    def disconnect(self, websocket: WebSocket, user_id: int) -> None:
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
                if user_id in self.user_presence:
                    self.user_presence[user_id]["status"] = "offline"
                    self.user_presence[user_id]["last_seen"] = datetime.utcnow().isoformat()
                
        logger.info(f"User {user_id} disconnected from WebSocket")

    async def send_personal_message(
        self,
        message: dict,
        user_id: int
    ) -> None:
        if user_id in self.active_connections:
            message["timestamp"] = datetime.utcnow().isoformat()
            json_message = json.dumps(message)
            
            disconnected = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json_message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {str(e)}")
                    disconnected.add(connection)
            
            for connection in disconnected:
                self.disconnect(connection, user_id)

    async def broadcast_to_institution(
        self,
        message: dict,
        institution_id: int,
        exclude_user: Optional[int] = None
    ) -> None:
        message["timestamp"] = datetime.utcnow().isoformat()
        json_message = json.dumps(message)
        
        for user_id, connections in list(self.active_connections.items()):
            if exclude_user and user_id == exclude_user:
                continue
            
            disconnected = set()
            for connection in connections:
                try:
                    await connection.send_text(json_message)
                except Exception as e:
                    logger.error(f"Error broadcasting to user {user_id}: {str(e)}")
                    disconnected.add(connection)
            
            for connection in disconnected:
                self.disconnect(connection, user_id)

    async def broadcast_to_room(
        self,
        room: str,
        message: dict,
        exclude_user: Optional[int] = None
    ) -> None:
        if room not in self.room_subscriptions:
            return
            
        message["timestamp"] = datetime.utcnow().isoformat()
        json_message = json.dumps(message)
        
        for user_id in self.room_subscriptions[room]:
            if exclude_user and user_id == exclude_user:
                continue
            await self.send_personal_message(message, user_id)

    def subscribe_to_room(self, room: str, user_id: int) -> None:
        self.room_subscriptions[room].add(user_id)
        logger.info(f"User {user_id} subscribed to room {room}")

    def unsubscribe_from_room(self, room: str, user_id: int) -> None:
        if room in self.room_subscriptions:
            self.room_subscriptions[room].discard(user_id)
            if not self.room_subscriptions[room]:
                del self.room_subscriptions[room]
        logger.info(f"User {user_id} unsubscribed from room {room}")

    async def send_notification(
        self,
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        data: Optional[dict] = None
    ) -> None:
        message_data = {
            "type": "notification",
            "notification_type": notification_type,
            "title": title,
            "message": message,
            "data": data or {}
        }
        await self.send_personal_message(message_data, user_id)

    async def send_message_notification(
        self,
        user_id: int,
        message_id: int,
        sender_id: int,
        sender_name: str,
        subject: str,
        preview: str
    ) -> None:
        message_data = {
            "type": "new_message",
            "message_id": message_id,
            "sender_id": sender_id,
            "sender_name": sender_name,
            "subject": subject,
            "preview": preview
        }
        await self.send_personal_message(message_data, user_id)

    async def send_chat_message(
        self,
        room: str,
        sender_id: int,
        sender_name: str,
        message: str,
        message_id: Optional[int] = None
    ) -> None:
        message_data = {
            "type": "chat_message",
            "room": room,
            "sender_id": sender_id,
            "sender_name": sender_name,
            "message": message,
            "message_id": message_id
        }
        await self.broadcast_to_room(room, message_data, exclude_user=sender_id)

    async def send_announcement_notification(
        self,
        user_id: int,
        announcement_id: int,
        title: str,
        priority: str
    ) -> None:
        message_data = {
            "type": "new_announcement",
            "announcement_id": announcement_id,
            "title": title,
            "priority": priority
        }
        await self.send_personal_message(message_data, user_id)

    async def send_attendance_update(
        self,
        user_ids: List[int],
        student_id: int,
        student_name: str,
        date: str,
        status: str
    ) -> None:
        message_data = {
            "type": "attendance_update",
            "student_id": student_id,
            "student_name": student_name,
            "date": date,
            "status": status
        }
        for user_id in user_ids:
            await self.send_personal_message(message_data, user_id)

    async def send_leaderboard_update(
        self,
        quiz_id: int,
        leaderboard_data: List[dict]
    ) -> None:
        message_data = {
            "type": "leaderboard_update",
            "quiz_id": quiz_id,
            "leaderboard": leaderboard_data
        }
        room = f"quiz_{quiz_id}"
        await self.broadcast_to_room(room, message_data)

    async def broadcast_presence_update(
        self,
        user_id: int,
        status: str
    ) -> None:
        message_data = {
            "type": "presence_update",
            "user_id": user_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        for connected_user_id in self.active_connections.keys():
            if connected_user_id != user_id:
                await self.send_personal_message(message_data, connected_user_id)

    async def send_typing_indicator(
        self,
        room: str,
        user_id: int,
        user_name: str,
        is_typing: bool
    ) -> None:
        if is_typing:
            self.typing_indicators[room][user_id] = datetime.utcnow()
        else:
            if room in self.typing_indicators and user_id in self.typing_indicators[room]:
                del self.typing_indicators[room][user_id]
        
        message_data = {
            "type": "typing_indicator",
            "room": room,
            "user_id": user_id,
            "user_name": user_name,
            "is_typing": is_typing
        }
        await self.broadcast_to_room(room, message_data, exclude_user=user_id)

    def get_connected_users_count(self) -> int:
        return len(self.active_connections)

    def is_user_connected(self, user_id: int) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    def get_user_presence(self, user_id: int) -> Dict:
        if user_id in self.user_presence:
            return self.user_presence[user_id]
        return {"status": "offline", "last_seen": None}

    def get_online_users(self, user_ids: List[int]) -> List[int]:
        return [user_id for user_id in user_ids if self.is_user_connected(user_id)]

    def get_typing_users(self, room: str) -> List[int]:
        if room not in self.typing_indicators:
            return []
        
        current_time = datetime.utcnow()
        typing_users = []
        
        for user_id, last_typing in list(self.typing_indicators[room].items()):
            if (current_time - last_typing).total_seconds() < 5:
                typing_users.append(user_id)
            else:
                del self.typing_indicators[room][user_id]
        
        return typing_users


websocket_manager = ConnectionManager()
