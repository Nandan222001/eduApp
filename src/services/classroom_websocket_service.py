import json
import asyncio
from typing import Dict, Set, Optional, Any
from datetime import datetime
from fastapi import WebSocket
from src.redis_client import get_redis


class ClassroomWebSocketManager:
    def __init__(self):
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}
        self.room_participants: Dict[int, Set[int]] = {}

    async def connect(self, classroom_id: int, user_id: int, websocket: WebSocket):
        """Connect a user to a classroom WebSocket"""
        await websocket.accept()
        
        if classroom_id not in self.active_connections:
            self.active_connections[classroom_id] = {}
            self.room_participants[classroom_id] = set()
        
        self.active_connections[classroom_id][user_id] = websocket
        self.room_participants[classroom_id].add(user_id)
        
        await self.broadcast_to_classroom(
            classroom_id,
            {
                "event": "user_joined",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
                "participant_count": len(self.room_participants[classroom_id])
            }
        )
        
        redis_client = await get_redis()
        await redis_client.sadd(f"classroom:ws:{classroom_id}", str(user_id))

    async def disconnect(self, classroom_id: int, user_id: int):
        """Disconnect a user from a classroom WebSocket"""
        if classroom_id in self.active_connections:
            if user_id in self.active_connections[classroom_id]:
                del self.active_connections[classroom_id][user_id]
            
            if user_id in self.room_participants[classroom_id]:
                self.room_participants[classroom_id].remove(user_id)
            
            if not self.active_connections[classroom_id]:
                del self.active_connections[classroom_id]
                del self.room_participants[classroom_id]
            else:
                await self.broadcast_to_classroom(
                    classroom_id,
                    {
                        "event": "user_left",
                        "user_id": user_id,
                        "timestamp": datetime.utcnow().isoformat(),
                        "participant_count": len(self.room_participants[classroom_id])
                    }
                )
        
        redis_client = await get_redis()
        await redis_client.srem(f"classroom:ws:{classroom_id}", str(user_id))

    async def send_personal_message(self, classroom_id: int, user_id: int, message: Dict[str, Any]):
        """Send a message to a specific user"""
        if classroom_id in self.active_connections:
            if user_id in self.active_connections[classroom_id]:
                websocket = self.active_connections[classroom_id][user_id]
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    print(f"Error sending message to user {user_id}: {e}")
                    await self.disconnect(classroom_id, user_id)

    async def broadcast_to_classroom(self, classroom_id: int, message: Dict[str, Any], exclude_user: Optional[int] = None):
        """Broadcast a message to all users in a classroom"""
        if classroom_id not in self.active_connections:
            return
        
        disconnected_users = []
        
        for user_id, websocket in self.active_connections[classroom_id].items():
            if exclude_user and user_id == exclude_user:
                continue
            
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to user {user_id}: {e}")
                disconnected_users.append(user_id)
        
        for user_id in disconnected_users:
            await self.disconnect(classroom_id, user_id)

    async def handle_message(self, classroom_id: int, user_id: int, message: Dict[str, Any]):
        """Handle incoming WebSocket messages"""
        event_type = message.get("type")
        
        if event_type == "chat_message":
            await self.broadcast_to_classroom(
                classroom_id,
                {
                    "event": "chat_message",
                    "user_id": user_id,
                    "message": message.get("message"),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            await self._save_chat_message(classroom_id, user_id, message.get("message"))
        
        elif event_type == "video_toggle":
            await self.broadcast_to_classroom(
                classroom_id,
                {
                    "event": "video_toggle",
                    "user_id": user_id,
                    "enabled": message.get("enabled"),
                    "timestamp": datetime.utcnow().isoformat()
                },
                exclude_user=user_id
            )
        
        elif event_type == "audio_toggle":
            await self.broadcast_to_classroom(
                classroom_id,
                {
                    "event": "audio_toggle",
                    "user_id": user_id,
                    "enabled": message.get("enabled"),
                    "timestamp": datetime.utcnow().isoformat()
                },
                exclude_user=user_id
            )
        
        elif event_type == "screen_share_start":
            await self.broadcast_to_classroom(
                classroom_id,
                {
                    "event": "screen_share_start",
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                },
                exclude_user=user_id
            )
        
        elif event_type == "screen_share_stop":
            await self.broadcast_to_classroom(
                classroom_id,
                {
                    "event": "screen_share_stop",
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                },
                exclude_user=user_id
            )
        
        elif event_type == "whiteboard_update":
            await self.broadcast_to_classroom(
                classroom_id,
                {
                    "event": "whiteboard_update",
                    "user_id": user_id,
                    "data": message.get("data"),
                    "timestamp": datetime.utcnow().isoformat()
                },
                exclude_user=user_id
            )
        
        elif event_type == "raise_hand":
            await self.broadcast_to_classroom(
                classroom_id,
                {
                    "event": "raise_hand",
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        elif event_type == "lower_hand":
            await self.broadcast_to_classroom(
                classroom_id,
                {
                    "event": "lower_hand",
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        elif event_type == "poll_started":
            await self.broadcast_to_classroom(
                classroom_id,
                {
                    "event": "poll_started",
                    "poll_id": message.get("poll_id"),
                    "poll_data": message.get("poll_data"),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        elif event_type == "poll_ended":
            await self.broadcast_to_classroom(
                classroom_id,
                {
                    "event": "poll_ended",
                    "poll_id": message.get("poll_id"),
                    "results": message.get("results"),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        elif event_type == "quiz_started":
            await self.broadcast_to_classroom(
                classroom_id,
                {
                    "event": "quiz_started",
                    "quiz_id": message.get("quiz_id"),
                    "quiz_data": message.get("quiz_data"),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        elif event_type == "quiz_ended":
            await self.broadcast_to_classroom(
                classroom_id,
                {
                    "event": "quiz_ended",
                    "quiz_id": message.get("quiz_id"),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        elif event_type == "recording_started":
            await self.broadcast_to_classroom(
                classroom_id,
                {
                    "event": "recording_started",
                    "recording_id": message.get("recording_id"),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        elif event_type == "recording_stopped":
            await self.broadcast_to_classroom(
                classroom_id,
                {
                    "event": "recording_stopped",
                    "recording_id": message.get("recording_id"),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )

    async def _save_chat_message(self, classroom_id: int, user_id: int, message: str):
        """Save chat message to Redis"""
        redis_client = await get_redis()
        
        chat_message = {
            "user_id": user_id,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await redis_client.lpush(
            f"classroom:chat:{classroom_id}",
            json.dumps(chat_message)
        )
        
        await redis_client.ltrim(f"classroom:chat:{classroom_id}", 0, 999)

    async def get_chat_history(self, classroom_id: int, limit: int = 50):
        """Get chat history from Redis"""
        redis_client = await get_redis()
        
        messages = await redis_client.lrange(
            f"classroom:chat:{classroom_id}",
            0,
            limit - 1
        )
        
        return [json.loads(msg) for msg in messages]

    def get_participant_count(self, classroom_id: int) -> int:
        """Get the number of active participants in a classroom"""
        if classroom_id in self.room_participants:
            return len(self.room_participants[classroom_id])
        return 0

    def get_active_classrooms(self) -> list:
        """Get list of active classroom IDs"""
        return list(self.active_connections.keys())


classroom_ws_manager = ClassroomWebSocketManager()
