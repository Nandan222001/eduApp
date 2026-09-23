from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models.user import User
from src.schemas.notification import (
    MessageCreate,
    MessageResponse,
    MessageMarkRead
)
from src.services.messaging_service import MessagingService
from src.services.websocket_manager import websocket_manager
from src.dependencies.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MessagingService(db)
    try:
        message = service.send_message(
            institution_id=current_user.institution_id,
            sender_id=current_user.id,
            message_data=message_data
        )
        
        await websocket_manager.send_message_notification(
            user_id=message.recipient_id,
            message_id=message.id,
            sender_id=current_user.id,
            sender_name=f"{current_user.first_name} {current_user.last_name}",
            subject=message.subject or "No subject",
            preview=message.content[:100]
        )
        
        return message
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/inbox", response_model=List[MessageResponse])
def get_inbox(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MessagingService(db)
    messages = service.get_inbox(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        unread_only=unread_only
    )
    return messages


@router.get("/sent", response_model=List[MessageResponse])
def get_sent_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MessagingService(db)
    messages = service.get_sent_messages(
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    return messages


@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MessagingService(db)
    count = service.get_unread_count(current_user.id)
    return {"unread_count": count}


@router.get("/conversation/{other_user_id}", response_model=List[MessageResponse])
def get_conversation(
    other_user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MessagingService(db)
    messages = service.get_conversation(
        user_id=current_user.id,
        other_user_id=other_user_id,
        skip=skip,
        limit=limit
    )
    return messages


@router.get("/{message_id}", response_model=MessageResponse)
def get_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MessagingService(db)
    message = service.get_message_by_id(message_id, current_user.id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    return message


@router.get("/{message_id}/thread", response_model=List[MessageResponse])
def get_message_thread(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MessagingService(db)
    thread = service.get_message_thread(message_id, current_user.id)
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message thread not found"
        )
    return thread


@router.patch("/{message_id}/read", response_model=MessageResponse)
def mark_message_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MessagingService(db)
    message = service.mark_as_read(message_id, current_user.id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    return message


@router.post("/mark-all-read")
def mark_all_messages_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MessagingService(db)
    count = service.mark_all_as_read(current_user.id)
    return {"message": f"Marked {count} messages as read"}


@router.delete("/{message_id}")
def delete_message(
    message_id: int,
    permanent: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MessagingService(db)
    success = service.delete_message(message_id, current_user.id, permanent)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    return {"message": "Message deleted successfully"}


@router.get("/search/")
def search_messages(
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MessagingService(db)
    messages = service.search_messages(
        user_id=current_user.id,
        query=q,
        skip=skip,
        limit=limit
    )
    return messages
