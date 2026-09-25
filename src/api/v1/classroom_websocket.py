from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.dependencies.auth import get_current_user, get_current_user_ws
from src.models.user import User
from src.models.virtual_classroom import VirtualClassroom
from src.services.classroom_websocket_service import classroom_ws_manager
import json

router = APIRouter()


@router.websocket("/classroom/{classroom_id}")
async def classroom_websocket(
    websocket: WebSocket,
    classroom_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """WebSocket endpoint for real-time classroom communication.

    Requires an authenticated token as a query parameter -- previously this
    endpoint accepted a plain, unauthenticated `user_id: int` query
    parameter with no verification at all, so any client could connect to
    any classroom's live chat/whiteboard/poll stream and impersonate any
    other user (their messages, video/audio toggles, raised hands etc. would
    all be recorded and broadcast under that spoofed `user_id`). Fixed to
    match the same pattern already used by `live_events_websocket.py`:
    resolve the caller's identity from the token via `get_current_user_ws`
    and scope the classroom lookup to the caller's own institution (a
    classroom ID from another institution 404s -- here, closes the socket --
    rather than ever being reachable).
    """
    user = await get_current_user_ws(token, db)
    if not user:
        await websocket.close(code=1008, reason="Invalid or expired token")
        return

    classroom = db.query(VirtualClassroom).filter(
        VirtualClassroom.id == classroom_id,
        VirtualClassroom.institution_id == user.institution_id,
    ).first()
    if not classroom:
        await websocket.close(code=1008, reason="Classroom not found")
        return

    user_id = user.id

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
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get chat history for a classroom.

    Previously had no auth dependency at all -- any unauthenticated caller
    could read any classroom's chat history for any institution. Added
    `Depends(get_current_user)` plus the same institution scoping as the
    WebSocket endpoint above.
    """
    classroom = db.query(VirtualClassroom).filter(
        VirtualClassroom.id == classroom_id,
        VirtualClassroom.institution_id == current_user.institution_id,
    ).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    messages = await classroom_ws_manager.get_chat_history(classroom_id, limit)
    return {"messages": messages}


@router.get("/classroom/{classroom_id}/participants-count")
async def get_participants_count(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current participant count.

    Previously had no auth dependency at all. Added `Depends(get_current_user)`
    plus institution scoping, matching the other endpoints in this router.
    """
    classroom = db.query(VirtualClassroom).filter(
        VirtualClassroom.id == classroom_id,
        VirtualClassroom.institution_id == current_user.institution_id,
    ).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    count = classroom_ws_manager.get_participant_count(classroom_id)
    return {"classroom_id": classroom_id, "participant_count": count}


@router.get("/classrooms/active")
async def get_active_classrooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get list of active classrooms with live connections.

    Previously had no auth dependency at all. Scoped to the caller's own
    institution so this doesn't leak other institutions' live classroom
    activity.
    """
    active_classroom_ids = classroom_ws_manager.get_active_classrooms()
    if not active_classroom_ids:
        return {"active_classrooms": []}

    institution_classroom_ids = {
        row.id for row in db.query(VirtualClassroom.id).filter(
            VirtualClassroom.id.in_(active_classroom_ids),
            VirtualClassroom.institution_id == current_user.institution_id,
        ).all()
    }

    classroom_data = []
    for classroom_id in active_classroom_ids:
        if classroom_id not in institution_classroom_ids:
            continue
        classroom_data.append({
            "classroom_id": classroom_id,
            "participant_count": classroom_ws_manager.get_participant_count(classroom_id)
        })

    return {"active_classrooms": classroom_data}
