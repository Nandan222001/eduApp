from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from src.services.classroom_websocket_service import classroom_ws_manager
import json

router = APIRouter()


@router.websocket("/classroom/{classroom_id}")
async def classroom_websocket(
    websocket: WebSocket,
    classroom_id: int,
    user_id: int = Query(...)
):
    """WebSocket endpoint for real-time classroom communication"""
    await classroom_ws_manager.connect(classroom_id, user_id, websocket)
    
    try:
        chat_history = await classroom_ws_manager.get_chat_history(classroom_id)
        await websocket.send_json({
            "event": "chat_history",
            "messages": chat_history
        })
        
        await websocket.send_json({
            "event": "connected",
            "classroom_id": classroom_id,
            "user_id": user_id,
            "participant_count": classroom_ws_manager.get_participant_count(classroom_id)
        })
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await classroom_ws_manager.handle_message(classroom_id, user_id, message)
    
    except WebSocketDisconnect:
        await classroom_ws_manager.disconnect(classroom_id, user_id)
    except Exception as e:
        print(f"WebSocket error for classroom {classroom_id}, user {user_id}: {e}")
        await classroom_ws_manager.disconnect(classroom_id, user_id)


@router.get("/classroom/{classroom_id}/chat-history")
async def get_chat_history(
    classroom_id: int,
    limit: int = Query(50, ge=1, le=500)
):
    """Get chat history for a classroom"""
    messages = await classroom_ws_manager.get_chat_history(classroom_id, limit)
    return {"messages": messages}


@router.get("/classroom/{classroom_id}/participants-count")
async def get_participants_count(classroom_id: int):
    """Get current participant count"""
    count = classroom_ws_manager.get_participant_count(classroom_id)
    return {"classroom_id": classroom_id, "participant_count": count}


@router.get("/classrooms/active")
async def get_active_classrooms():
    """Get list of active classrooms with live connections"""
    active_classrooms = classroom_ws_manager.get_active_classrooms()
    
    classroom_data = []
    for classroom_id in active_classrooms:
        classroom_data.append({
            "classroom_id": classroom_id,
            "participant_count": classroom_ws_manager.get_participant_count(classroom_id)
        })
    
    return {"active_classrooms": classroom_data}
