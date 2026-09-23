from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, timedelta
import secrets
import hashlib
import logging

from src.database import get_db
from src.models.user import User
from src.models.student import Student
from src.models.academic import Grade, Section
from src.models.live_events import (
    LiveEvent,
    EventViewer,
    EventChatMessage,
    EventTicket,
    ChatModerationRule,
    StreamAnalytics,
    LiveEventStatus,
    RestrictedAccessType,
    StreamPlatform
)
from src.dependencies.auth import get_current_user
from src.schemas.live_event import (
    LiveEventCreate,
    LiveEventUpdate,
    LiveEventResponse,
    LiveEventWithDetails,
    StreamKeyResponse,
    EventViewerCreate,
    EventViewerUpdate,
    EventViewerResponse,
    EventViewerWithUser,
    EventChatMessageCreate,
    EventChatMessageUpdate,
    EventChatMessageResponse,
    EventChatMessageWithUser,
    EventTicketCreate,
    EventTicketResponse,
    ChatModerationRuleCreate,
    ChatModerationRuleUpdate,
    ChatModerationRuleResponse,
    ViewerAnalytics,
    EventAnalytics,
    AccessPermissionCheck,
    RecordingUploadRequest,
    RecordingArchiveRequest
)
from src.services.youtube_live_service import YouTubeLiveService
from src.services.vimeo_live_service import VimeoLiveService
from src.services.chat_moderation_service import ChatModerationService
from src.services.event_ticket_service import EventTicketService

router = APIRouter()
logger = logging.getLogger(__name__)


# Live Events Management

@router.post("/", response_model=LiveEventResponse, status_code=status.HTTP_201_CREATED)
async def create_live_event(
    event_data: LiveEventCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new live streaming event."""
    if current_user.institution_id != event_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    event = LiveEvent(
        **event_data.model_dump(exclude={"tags"}),
        created_by=current_user.id,
        tags=event_data.tags if event_data.tags else None
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    # Schedule stream creation in background
    background_tasks.add_task(
        setup_stream_platform,
        event.id,
        event.stream_platform,
        event.event_name,
        event.description or "",
        event.scheduled_start_time
    )
    
    return event


@router.get("/", response_model=dict)
async def list_live_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    event_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all live events for the institution."""
    query = db.query(LiveEvent).filter(
        LiveEvent.institution_id == current_user.institution_id
    )
    
    if event_type:
        query = query.filter(LiveEvent.event_type == event_type)
    if status_filter:
        query = query.filter(LiveEvent.status == status_filter)
    if start_date:
        query = query.filter(LiveEvent.scheduled_start_time >= start_date)
    if end_date:
        query = query.filter(LiveEvent.scheduled_start_time <= end_date)
    
    total = query.count()
    events = query.order_by(desc(LiveEvent.scheduled_start_time)).offset(skip).limit(limit).all()
    
    return {
        "items": [LiveEventResponse.model_validate(e) for e in events],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{event_id:int}", response_model=LiveEventWithDetails)
async def get_live_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of a specific live event."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    # Get current viewer count
    current_viewers = db.query(EventViewer).filter(
        EventViewer.live_event_id == event_id,
        EventViewer.is_currently_watching == True
    ).count()
    
    # Get total messages
    total_messages = db.query(EventChatMessage).filter(
        EventChatMessage.live_event_id == event_id,
        EventChatMessage.is_deleted == False
    ).count()
    
    # Get tickets sold
    tickets_sold = db.query(EventTicket).filter(
        EventTicket.live_event_id == event_id,
        EventTicket.payment_status == "completed"
    ).count()
    
    # Calculate revenue
    revenue_result = db.query(func.sum(EventTicket.amount_paid)).filter(
        EventTicket.live_event_id == event_id,
        EventTicket.payment_status == "completed"
    ).scalar() or 0
    
    event_dict = {
        **event.__dict__,
        "current_viewer_count": current_viewers,
        "total_messages": total_messages,
        "tickets_sold": tickets_sold,
        "revenue": revenue_result
    }
    
    return LiveEventWithDetails(**event_dict)


@router.put("/{event_id:int}", response_model=LiveEventResponse)
async def update_live_event(
    event_id: int,
    update_data: LiveEventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a live event."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id:int}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_live_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a live event."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    db.delete(event)
    db.commit()
    return None


# Stream Management

@router.post("/{event_id:int}/stream/generate-key", response_model=StreamKeyResponse)
async def generate_stream_key(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a new stream key for broadcasting."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    # Generate stream key based on platform
    if event.stream_platform == StreamPlatform.YOUTUBE.value:
        youtube = YouTubeLiveService()
        result = await youtube.create_live_broadcast(
            title=event.event_name,
            description=event.description or "",
            scheduled_start_time=event.scheduled_start_time
        )
        
        event.stream_key = result["stream_key"]
        event.stream_url = result["stream_url"]
        event.stream_embed_url = result["embed_url"]
        event.external_stream_id = result["broadcast_id"]
        
        instructions = f"Use OBS or similar software to stream to YouTube.\nRTMP URL: {result['rtmp_url']}\nStream Key: {result['stream_key']}"
        
    elif event.stream_platform == StreamPlatform.VIMEO.value:
        vimeo = VimeoLiveService()
        result = await vimeo.create_live_event(
            title=event.event_name,
            description=event.description or "",
            scheduled_start_time=event.scheduled_start_time
        )
        
        event.stream_key = result["stream_key"]
        event.stream_url = result["stream_url"]
        event.stream_embed_url = result["player_embed_url"]
        event.external_stream_id = result["event_id"]
        
        instructions = f"Use OBS or similar software to stream to Vimeo.\nRTMP URL: {result['rtmp_url']}\nStream Key: {result['stream_key']}"
        
    else:
        # For other platforms, generate a generic key
        stream_key = secrets.token_urlsafe(32)
        event.stream_key = stream_key
        instructions = "Stream key generated. Configure your streaming software accordingly."
    
    db.commit()
    db.refresh(event)
    
    return StreamKeyResponse(
        stream_key=event.stream_key,
        stream_url=event.stream_url or "",
        rtmp_url=result.get("rtmp_url") if event.stream_platform in [StreamPlatform.YOUTUBE.value, StreamPlatform.VIMEO.value] else None,
        instructions=instructions
    )


@router.post("/{event_id:int}/stream/start")
async def start_stream(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start the live stream."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    if event.status == LiveEventStatus.LIVE.value:
        raise HTTPException(status_code=400, detail="Stream is already live")
    
    event.status = LiveEventStatus.LIVE.value
    event.actual_start_time = datetime.utcnow()
    
    # Start on platform if configured
    if event.external_stream_id:
        if event.stream_platform == StreamPlatform.YOUTUBE.value:
            youtube = YouTubeLiveService()
            await youtube.start_broadcast(event.external_stream_id)
        elif event.stream_platform == StreamPlatform.VIMEO.value:
            vimeo = VimeoLiveService()
            await vimeo.start_event(event.external_stream_id)
    
    db.commit()
    db.refresh(event)
    
    return {"message": "Stream started successfully", "status": event.status}


@router.post("/{event_id:int}/stream/end")
async def end_stream(
    event_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """End the live stream."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    event.status = LiveEventStatus.ENDED.value
    event.actual_end_time = datetime.utcnow()
    
    # Update all viewers to not watching
    db.query(EventViewer).filter(
        EventViewer.live_event_id == event_id,
        EventViewer.is_currently_watching == True
    ).update({
        "is_currently_watching": False,
        "left_at": datetime.utcnow()
    })
    
    # End on platform if configured
    if event.external_stream_id:
        if event.stream_platform == StreamPlatform.YOUTUBE.value:
            youtube = YouTubeLiveService()
            await youtube.end_broadcast(event.external_stream_id)
        elif event.stream_platform == StreamPlatform.VIMEO.value:
            vimeo = VimeoLiveService()
            await vimeo.end_event(event.external_stream_id)
    
    db.commit()
    
    # Schedule recording processing in background
    if event.auto_record:
        background_tasks.add_task(process_recording, event_id)
    
    return {"message": "Stream ended successfully", "status": event.status}


# Access Control

@router.get("/{event_id:int}/access-check", response_model=AccessPermissionCheck)
async def check_event_access(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check if the current user has access to view the event."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    # Check monetization
    if event.monetization_enabled:
        ticket = db.query(EventTicket).filter(
            EventTicket.live_event_id == event_id,
            EventTicket.user_id == current_user.id,
            EventTicket.payment_status == "completed"
        ).first()
        
        if not ticket:
            return AccessPermissionCheck(
                has_access=False,
                reason="Ticket required",
                requires_ticket=True,
                ticket_price=event.ticket_price
            )
    
    # Check access restrictions
    if event.restricted_access == RestrictedAccessType.PUBLIC.value:
        return AccessPermissionCheck(
            has_access=True,
            requires_ticket=False
        )
    
    elif event.restricted_access == RestrictedAccessType.PARENTS_ONLY.value:
        # Check if user is a parent
        student = db.query(Student).filter(
            Student.user_id == current_user.id,
            Student.institution_id == current_user.institution_id
        ).first()
        
        has_access = student is not None
        return AccessPermissionCheck(
            has_access=has_access,
            reason="Parents only" if not has_access else None,
            requires_ticket=False
        )
    
    elif event.restricted_access == RestrictedAccessType.SPECIFIC_GRADES.value:
        # Check if user's grade/section is allowed
        student = db.query(Student).filter(
            Student.user_id == current_user.id,
            Student.institution_id == current_user.institution_id
        ).first()
        
        if not student:
            return AccessPermissionCheck(
                has_access=False,
                reason="Restricted to specific grades",
                requires_ticket=False
            )
        
        # Check section
        if event.allowed_section_ids and student.section_id:
            if student.section_id in event.allowed_section_ids:
                return AccessPermissionCheck(has_access=True, requires_ticket=False)
        
        # Check grade through section
        if event.allowed_grade_ids and student.section_id:
            section = db.query(Section).filter(Section.id == student.section_id).first()
            if section and section.grade_id in event.allowed_grade_ids:
                return AccessPermissionCheck(has_access=True, requires_ticket=False)
        
        return AccessPermissionCheck(
            has_access=False,
            reason="Not in allowed grades/sections",
            requires_ticket=False
        )
    
    return AccessPermissionCheck(has_access=True, requires_ticket=False)


# Viewer Management

@router.post("/{event_id:int}/viewers", response_model=EventViewerResponse, status_code=status.HTTP_201_CREATED)
async def join_event(
    event_id: int,
    viewer_data: EventViewerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Join a live event as a viewer."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    # Check if already viewing
    existing_viewer = db.query(EventViewer).filter(
        EventViewer.live_event_id == event_id,
        EventViewer.user_id == current_user.id,
        EventViewer.is_currently_watching == True
    ).first()
    
    if existing_viewer:
        return existing_viewer
    
    viewer = EventViewer(
        live_event_id=event_id,
        user_id=current_user.id,
        **viewer_data.model_dump(exclude={"live_event_id"})
    )
    
    db.add(viewer)
    
    # Update event viewer count
    event.viewer_count = db.query(EventViewer).filter(
        EventViewer.live_event_id == event_id,
        EventViewer.is_currently_watching == True
    ).count() + 1
    
    if event.viewer_count > event.peak_viewer_count:
        event.peak_viewer_count = event.viewer_count
    
    event.total_views += 1
    
    db.commit()
    db.refresh(viewer)
    
    return viewer


@router.put("/{event_id:int}/viewers/{viewer_id:int}", response_model=EventViewerResponse)
async def update_viewer_session(
    event_id: int,
    viewer_id: int,
    update_data: EventViewerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update viewer session (watch duration, leave event, etc.)."""
    viewer = db.query(EventViewer).filter(
        EventViewer.id == viewer_id,
        EventViewer.live_event_id == event_id,
        EventViewer.user_id == current_user.id
    ).first()
    
    if not viewer:
        raise HTTPException(status_code=404, detail="Viewer session not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(viewer, field, value)
    
    # Update event viewer count if leaving
    if update_data.is_currently_watching is False:
        event = db.query(LiveEvent).filter(LiveEvent.id == event_id).first()
        if event:
            event.viewer_count = db.query(EventViewer).filter(
                EventViewer.live_event_id == event_id,
                EventViewer.is_currently_watching == True
            ).count()
    
    db.commit()
    db.refresh(viewer)
    
    return viewer


@router.get("/{event_id:int}/viewers", response_model=List[EventViewerWithUser])
async def list_event_viewers(
    event_id: int,
    currently_watching: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List viewers of a live event."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    query = db.query(EventViewer, User).join(User).filter(
        EventViewer.live_event_id == event_id
    )
    
    if currently_watching is not None:
        query = query.filter(EventViewer.is_currently_watching == currently_watching)
    
    results = query.order_by(desc(EventViewer.joined_at)).offset(skip).limit(limit).all()
    
    viewers = []
    for viewer, user in results:
        viewer_dict = {
            **viewer.__dict__,
            "user_name": f"{user.first_name or ''} {user.last_name or ''}".strip(),
            "user_email": user.email
        }
        viewers.append(EventViewerWithUser(**viewer_dict))
    
    return viewers


# Chat Management

@router.post("/{event_id:int}/chat", response_model=EventChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_chat_message(
    event_id: int,
    message_data: EventChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message in event chat."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    if not event.chat_enabled:
        raise HTTPException(status_code=400, detail="Chat is disabled for this event")
    
    # Check moderation if enabled
    if event.chat_moderated:
        moderator = ChatModerationService(db, current_user.institution_id)
        moderation_result = moderator.moderate_message(message_data.message)
        
        if not moderation_result["is_allowed"]:
            if moderation_result["action"] == "block_user":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=moderation_result["reason"]
                )
            elif moderation_result["action"] == "delete":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=moderation_result["reason"]
                )
    
    message = EventChatMessage(
        live_event_id=event_id,
        user_id=current_user.id,
        **message_data.model_dump(exclude={"live_event_id"})
    )
    
    # Flag if needed
    if event.chat_moderated:
        if moderation_result.get("is_flagged"):
            message.is_flagged = True
    
    db.add(message)
    
    # Update viewer message count
    viewer = db.query(EventViewer).filter(
        EventViewer.live_event_id == event_id,
        EventViewer.user_id == current_user.id,
        EventViewer.is_currently_watching == True
    ).first()
    
    if viewer:
        viewer.messages_sent += 1
    
    db.commit()
    db.refresh(message)
    
    return message


@router.get("/{event_id:int}/chat", response_model=List[EventChatMessageWithUser])
async def get_chat_messages(
    event_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    include_deleted: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get chat messages for an event."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    # EventChatMessage has two FKs into users (user_id, moderated_by), so a
    # plain .join(User) is ambiguous (SQLAlchemy can't pick one) and raises
    # AmbiguousForeignKeysError -- explicit onclause needed, unlike
    # EventViewer's single-FK join just above this function.
    query = db.query(EventChatMessage, User).join(
        User, EventChatMessage.user_id == User.id
    ).filter(
        EventChatMessage.live_event_id == event_id
    )
    
    if not include_deleted:
        query = query.filter(EventChatMessage.is_deleted == False)
    
    results = query.order_by(desc(EventChatMessage.created_at)).offset(skip).limit(limit).all()
    
    messages = []
    for message, user in results:
        message_dict = {
            **message.__dict__,
            "user_name": f"{user.first_name or ''} {user.last_name or ''}".strip(),
            "user_email": user.email
        }
        messages.append(EventChatMessageWithUser(**message_dict))
    
    return messages


@router.put("/chat/{message_id:int}/moderate", response_model=EventChatMessageResponse)
async def moderate_chat_message(
    message_id: int,
    update_data: EventChatMessageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Moderate a chat message (delete, flag, etc.)."""
    message = db.query(EventChatMessage).join(LiveEvent).filter(
        EventChatMessage.id == message_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(message, field, value)
    
    message.moderated_by = current_user.id
    message.moderated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    return message


# Moderation Rules

@router.post("/moderation-rules", response_model=ChatModerationRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_moderation_rule(
    rule_data: ChatModerationRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a chat moderation rule."""
    if current_user.institution_id != rule_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    rule = ChatModerationRule(
        **rule_data.model_dump(),
        created_by=current_user.id
    )
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    return rule


@router.get("/moderation-rules", response_model=List[ChatModerationRuleResponse])
async def list_moderation_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all moderation rules for the institution."""
    rules = db.query(ChatModerationRule).filter(
        ChatModerationRule.institution_id == current_user.institution_id
    ).all()
    
    return rules


@router.put("/moderation-rules/{rule_id:int}", response_model=ChatModerationRuleResponse)
async def update_moderation_rule(
    rule_id: int,
    update_data: ChatModerationRuleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a moderation rule."""
    rule = db.query(ChatModerationRule).filter(
        ChatModerationRule.id == rule_id,
        ChatModerationRule.institution_id == current_user.institution_id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Moderation rule not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    
    db.commit()
    db.refresh(rule)
    
    return rule


@router.delete("/moderation-rules/{rule_id:int}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_moderation_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a moderation rule."""
    rule = db.query(ChatModerationRule).filter(
        ChatModerationRule.id == rule_id,
        ChatModerationRule.institution_id == current_user.institution_id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Moderation rule not found")
    
    db.delete(rule)
    db.commit()
    return None


# Analytics

@router.get("/{event_id:int}/analytics", response_model=EventAnalytics)
async def get_event_analytics(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get comprehensive analytics for an event."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    # Viewer analytics
    total_viewers = db.query(EventViewer).filter(
        EventViewer.live_event_id == event_id
    ).count()
    
    current_viewers = db.query(EventViewer).filter(
        EventViewer.live_event_id == event_id,
        EventViewer.is_currently_watching == True
    ).count()
    
    avg_duration = db.query(func.avg(EventViewer.watch_duration)).filter(
        EventViewer.live_event_id == event_id
    ).scalar() or 0
    
    total_watch_time = db.query(func.sum(EventViewer.watch_duration)).filter(
        EventViewer.live_event_id == event_id
    ).scalar() or 0
    
    # Chat analytics
    total_messages = db.query(EventChatMessage).filter(
        EventChatMessage.live_event_id == event_id,
        EventChatMessage.is_deleted == False
    ).count()
    
    flagged_messages = db.query(EventChatMessage).filter(
        EventChatMessage.live_event_id == event_id,
        EventChatMessage.is_flagged == True
    ).count()
    
    # Revenue analytics
    revenue_analytics = None
    if event.monetization_enabled:
        tickets_sold = db.query(EventTicket).filter(
            EventTicket.live_event_id == event_id,
            EventTicket.payment_status == "completed"
        ).count()
        
        total_revenue = db.query(func.sum(EventTicket.amount_paid)).filter(
            EventTicket.live_event_id == event_id,
            EventTicket.payment_status == "completed"
        ).scalar() or 0
        
        revenue_analytics = {
            "tickets_sold": tickets_sold,
            # MySQL's SUM() over an Integer column comes back through pymysql
            # as a Decimal. EventAnalytics.revenue_analytics is typed
            # Dict[str, Any], and Pydantic v2's JSON-mode serializer for an
            # Any-typed field falls back to str() for a type it doesn't
            # otherwise recognize -- so an un-cast Decimal here silently
            # turned "total_revenue" into a JSON *string* (e.g. "200"
            # instead of the number 200) for any event with real ticket
            # revenue, breaking any client expecting a number. Cast to int
            # (amounts are always whole smallest-currency-unit integers).
            "total_revenue": int(total_revenue),
            "currency": event.ticket_currency
        }
    
    # Stream quality metrics
    stream_quality = db.query(StreamAnalytics).filter(
        StreamAnalytics.live_event_id == event_id
    ).order_by(StreamAnalytics.timestamp).all()
    
    return EventAnalytics(
        live_event_id=event.id,
        event_name=event.event_name,
        status=event.status,
        viewer_analytics=ViewerAnalytics(
            total_viewers=total_viewers,
            current_viewers=current_viewers,
            peak_viewers=event.peak_viewer_count,
            average_watch_duration=float(avg_duration),
            total_watch_time=int(total_watch_time),
            viewer_demographics={},
            viewer_engagement={}
        ),
        chat_analytics={
            "total_messages": total_messages,
            "flagged_messages": flagged_messages
        },
        revenue_analytics=revenue_analytics,
        stream_quality=stream_quality
    )


# Recording Management

@router.post("/{event_id:int}/recording/upload")
async def upload_recording(
    event_id: int,
    recording_data: RecordingUploadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload or link event recording."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    event.recording_url = recording_data.recording_url
    event.recording_s3_key = recording_data.recording_s3_key
    
    db.commit()
    db.refresh(event)
    
    return {"message": "Recording uploaded successfully", "recording_url": event.recording_url}


@router.post("/{event_id:int}/recording/archive")
async def archive_recording(
    event_id: int,
    archive_data: RecordingArchiveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Archive event recording."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    event.recording_archived = True
    event.recording_archived_at = datetime.utcnow()
    
    db.commit()
    db.refresh(event)
    
    return {"message": "Recording archived successfully"}


# Ticket Management

@router.post("/{event_id:int}/tickets", response_model=EventTicketResponse, status_code=status.HTTP_201_CREATED)
async def purchase_ticket(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Purchase a ticket for a monetized event."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    if not event.monetization_enabled:
        raise HTTPException(status_code=400, detail="Event does not require tickets")
    
    ticket_service = EventTicketService(db)
    
    try:
        ticket = ticket_service.create_ticket(
            live_event_id=event_id,
            user_id=current_user.id,
            amount_paid=event.ticket_price or 0,
            currency=event.ticket_currency,
            payment_gateway="razorpay"
        )
        
        return ticket
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{event_id:int}/tickets/my-ticket", response_model=EventTicketResponse)
async def get_my_ticket(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's ticket for an event."""
    ticket = db.query(EventTicket).filter(
        EventTicket.live_event_id == event_id,
        EventTicket.user_id == current_user.id,
        EventTicket.is_refunded == False
    ).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return ticket


@router.get("/{event_id:int}/tickets", response_model=List[EventTicketResponse])
async def list_event_tickets(
    event_id: int,
    payment_status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all tickets for an event (admin only)."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    ticket_service = EventTicketService(db)
    tickets = ticket_service.get_event_tickets(event_id, payment_status)
    
    return tickets


@router.post("/{event_id:int}/tickets/{ticket_id:int}/redeem")
async def redeem_ticket(
    event_id: int,
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Redeem a ticket for event access."""
    ticket = db.query(EventTicket).filter(
        EventTicket.id == ticket_id,
        EventTicket.live_event_id == event_id,
        EventTicket.user_id == current_user.id
    ).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket_service = EventTicketService(db)
    
    try:
        redeemed_ticket = ticket_service.redeem_ticket(ticket.ticket_code, current_user.id)
        return {"message": "Ticket redeemed successfully", "ticket": redeemed_ticket}
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{event_id:int}/tickets/{ticket_id:int}/refund")
async def refund_ticket(
    event_id: int,
    ticket_id: int,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Refund a ticket (admin only)."""
    ticket = db.query(EventTicket).join(LiveEvent).filter(
        EventTicket.id == ticket_id,
        EventTicket.live_event_id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket_service = EventTicketService(db)
    
    try:
        refunded_ticket = ticket_service.refund_ticket(ticket_id, reason)
        return {"message": "Ticket refunded successfully", "ticket": refunded_ticket}
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{event_id:int}/revenue")
async def get_event_revenue(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get revenue analytics for an event."""
    event = db.query(LiveEvent).filter(
        LiveEvent.id == event_id,
        LiveEvent.institution_id == current_user.institution_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Live event not found")
    
    if not event.monetization_enabled:
        raise HTTPException(status_code=400, detail="Event is not monetized")
    
    ticket_service = EventTicketService(db)
    revenue = ticket_service.get_event_revenue(event_id)
    
    return revenue


# Helper functions

async def setup_stream_platform(
    event_id: int,
    platform: str,
    title: str,
    description: str,
    scheduled_start_time: datetime
):
    """Background task to set up streaming platform.

    Runs via BackgroundTasks *after* the response has already been sent to
    the client, so it must never let an exception escape: Starlette's
    BackgroundTask.__call__ has no try/except of its own, and an exception
    raised here propagates straight through the ASGI response-sending
    machinery (confirmed: it surfaces as a raised exception on the
    TestClient call itself, not a 500 response) even though the client
    already has its 201. That would happen for a real, non-test failure too
    (external platform API down/erroring), not just here.
    """
    from src.database import SessionLocal

    db = SessionLocal()
    try:
        event = db.query(LiveEvent).filter(LiveEvent.id == event_id).first()
        if not event:
            return

        if platform == StreamPlatform.YOUTUBE.value:
            youtube = YouTubeLiveService()
            result = await youtube.create_live_broadcast(title, description, scheduled_start_time)
            event.stream_key = result["stream_key"]
            event.stream_url = result["stream_url"]
            event.stream_embed_url = result["embed_url"]
            event.external_stream_id = result["broadcast_id"]

        elif platform == StreamPlatform.VIMEO.value:
            vimeo = VimeoLiveService()
            result = await vimeo.create_live_event(title, description, scheduled_start_time)
            event.stream_key = result["stream_key"]
            event.stream_url = result["stream_url"]
            event.stream_embed_url = result["player_embed_url"]
            event.external_stream_id = result["event_id"]

        db.commit()
    except Exception:
        logger.exception("setup_stream_platform background task failed for event_id=%s", event_id)
    finally:
        db.close()


async def process_recording(event_id: int):
    """Background task to process recording after stream ends.

    See setup_stream_platform's docstring for why this must swallow its own
    exceptions rather than let them escape after the response is sent.
    """
    from src.database import SessionLocal

    db = SessionLocal()
    try:
        event = db.query(LiveEvent).filter(LiveEvent.id == event_id).first()
        if not event or not event.external_stream_id:
            return

        # Get recording URL from platform
        if event.stream_platform == StreamPlatform.YOUTUBE.value:
            youtube = YouTubeLiveService()
            stats = await youtube.get_broadcast_statistics(event.external_stream_id)
            # YouTube automatically saves recordings
            event.recording_url = event.stream_url

        elif event.stream_platform == StreamPlatform.VIMEO.value:
            vimeo = VimeoLiveService()
            event_data = await vimeo.get_event_statistics(event.external_stream_id)
            # Vimeo automatically saves recordings
            event.recording_url = event.stream_url

        db.commit()
    except Exception:
        logger.exception("process_recording background task failed for event_id=%s", event_id)
    finally:
        db.close()
