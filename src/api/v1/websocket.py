from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy.orm import Session
import json
import logging

from src.database import get_db
from src.services.websocket_manager import websocket_manager
from src.dependencies.auth import get_current_user_ws

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    db: Session = Depends(get_db)
):
    try:
        user = await get_current_user_ws(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        await websocket_manager.connect(websocket, user.id)
        
        try:
            await websocket_manager.send_personal_message(
                {
                    "type": "connection",
                    "message": "Connected to real-time service",
                    "user_id": user.id
                },
                user.id
            )
            
            while True:
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                    message_type = message.get("type")
                    
                    if message_type == "ping":
                        await websocket.send_json({
                            "type": "pong",
                            "timestamp": message.get("timestamp")
                        })
                    
                    elif message_type == "subscribe":
                        rooms = message.get("rooms", [])
                        for room in rooms:
                            websocket_manager.subscribe_to_room(room, user.id)
                        await websocket.send_json({
                            "type": "subscribed",
                            "rooms": rooms
                        })
                    
                    elif message_type == "unsubscribe":
                        rooms = message.get("rooms", [])
                        for room in rooms:
                            websocket_manager.unsubscribe_from_room(room, user.id)
                        await websocket.send_json({
                            "type": "unsubscribed",
                            "rooms": rooms
                        })
                    
                    elif message_type == "typing":
                        room = message.get("room")
                        is_typing = message.get("is_typing", True)
                        if room:
                            await websocket_manager.send_typing_indicator(
                                room,
                                user.id,
                                user.full_name or user.email,
                                is_typing
                            )
                    
                    elif message_type == "presence":
                        presence_status = message.get("status", "online")
                        await websocket_manager.broadcast_presence_update(
                            user.id,
                            presence_status
                        )
                    
                    elif message_type == "get_online_users":
                        user_ids = message.get("user_ids", [])
                        online_users = websocket_manager.get_online_users(user_ids)
                        await websocket.send_json({
                            "type": "online_users",
                            "user_ids": online_users
                        })
                    
                    elif message_type == "get_presence":
                        user_id = message.get("user_id")
                        if user_id:
                            presence = websocket_manager.get_user_presence(user_id)
                            await websocket.send_json({
                                "type": "user_presence",
                                "user_id": user_id,
                                "presence": presence
                            })
                    
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON received from user {user.id}")
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid JSON format"
                    })
                    
        except WebSocketDisconnect:
            websocket_manager.disconnect(websocket, user.id)
            await websocket_manager.broadcast_presence_update(user.id, "offline")
            logger.info(f"User {user.id} disconnected")
            
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass


@router.get("/presence/{user_id}")
async def get_user_presence(user_id: int):
    return websocket_manager.get_user_presence(user_id)


@router.post("/presence/bulk")
async def get_bulk_presence(user_ids: list[int]):
    return {
        "online_users": websocket_manager.get_online_users(user_ids),
        "presence": {
            user_id: websocket_manager.get_user_presence(user_id)
            for user_id in user_ids
        }
    }
