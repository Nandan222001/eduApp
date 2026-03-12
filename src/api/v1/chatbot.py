from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid
from datetime import datetime

from src.database import get_db
from src.api.deps import get_current_user
from src.models.user import User

router = APIRouter()


class ChatMessageRequest(BaseModel):
    message: str
    context: Optional[dict] = None


class ChatMessageResponse(BaseModel):
    message: str
    suggestions: Optional[List[str]] = None
    metadata: Optional[dict] = None


class ImageUploadResponse(BaseModel):
    imageUrl: str
    extractedText: Optional[str] = None
    analysis: Optional[str] = None


class VoiceToTextResponse(BaseModel):
    text: str


class ConversationHistoryItem(BaseModel):
    id: str
    title: str
    lastMessage: str
    timestamp: datetime
    messageCount: int


@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    message = request.message.lower()
    context = request.context or {}
    
    response_message = ""
    suggestions = []
    
    if "homework" in message or "help" in message:
        response_message = (
            "I'd be happy to help you with your homework! Please share the question or topic you need help with. "
            "You can also upload an image of your homework problem for better assistance."
        )
        suggestions = [
            "Explain this math problem",
            "Help me understand this concept",
            "Show me step-by-step solution",
        ]
    elif "exam" in message or "schedule" in message:
        response_message = (
            "You can view your exam schedule in the Examinations section. "
            "Let me know if you need specific information about any upcoming exam!"
        )
        suggestions = [
            "Show today's exams",
            "What exams are coming up?",
            "Show my exam timetable",
        ]
    elif "grade" in message or "marks" in message or "score" in message:
        response_message = (
            "You can check your grades and performance in the Analytics section. "
            "Would you like me to show you your recent performance or subject-wise breakdown?"
        )
        suggestions = [
            "Show my recent grades",
            "Subject-wise performance",
            "Compare with class average",
        ]
    elif "class" in message or "today" in message:
        response_message = (
            "Your class schedule is available in the Timetable section. "
            "I can help you check today's classes or any specific day!"
        )
        suggestions = [
            "What's my next class?",
            "Show full week schedule",
            "Check tomorrow's classes",
        ]
    elif "study" in message or "tips" in message:
        response_message = (
            "Here are some effective study tips:\n"
            "1. Use the Pomodoro Technique (25 min study, 5 min break)\n"
            "2. Review your notes within 24 hours of class\n"
            "3. Practice with flashcards and quizzes\n"
            "4. Set specific, achievable daily goals\n"
            "5. Join study groups for collaborative learning"
        )
        suggestions = [
            "Start Pomodoro timer",
            "Create flashcards",
            "Set study goals",
        ]
    elif "image" in message.lower() or context.get("hasImage"):
        extracted_text = context.get("extractedText", "")
        if extracted_text:
            response_message = (
                f"I can see the text in your image: '{extracted_text}'. "
                "This appears to be a homework problem. Let me help you solve it step by step. "
                "Can you tell me which part you're having trouble with?"
            )
        else:
            response_message = (
                "I've received your image. Please let me know what specific help you need with this problem, "
                "and I'll guide you through the solution!"
            )
        suggestions = [
            "Explain the concept",
            "Show step-by-step solution",
            "Provide similar practice problems",
        ]
    else:
        response_message = (
            "I'm here to help! You can ask me about:\n"
            "• Homework and study help\n"
            "• Exam schedules and preparation\n"
            "• Your grades and performance\n"
            "• Class schedules and timetables\n"
            "• Study tips and techniques\n\n"
            "What would you like to know?"
        )
        suggestions = [
            "I need homework help",
            "What's my exam schedule?",
            "Show my grades",
        ]
    
    return ChatMessageResponse(
        message=response_message,
        suggestions=suggestions,
        metadata={"timestamp": datetime.utcnow().isoformat()}
    )


@router.post("/upload-image", response_model=ImageUploadResponse)
async def upload_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    image_id = str(uuid.uuid4())
    image_url = f"/uploads/chatbot/{image_id}/{image.filename}"
    
    extracted_text = "Sample extracted text from image: x + 2 = 5"
    analysis = "This appears to be a linear equation problem."
    
    return ImageUploadResponse(
        imageUrl=image_url,
        extractedText=extracted_text,
        analysis=analysis,
    )


@router.post("/voice-to-text", response_model=VoiceToTextResponse)
async def voice_to_text(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    text = "Sample transcribed text from voice input"
    
    return VoiceToTextResponse(text=text)


@router.get("/history", response_model=List[ConversationHistoryItem])
async def get_conversation_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sample_history = [
        ConversationHistoryItem(
            id="conv1",
            title="Math homework help",
            lastMessage="Thanks! That explanation was very helpful.",
            timestamp=datetime.utcnow(),
            messageCount=8,
        ),
        ConversationHistoryItem(
            id="conv2",
            title="Exam schedule inquiry",
            lastMessage="Got it, I'll check the exam schedule.",
            timestamp=datetime.utcnow(),
            messageCount=5,
        ),
    ]
    
    return sample_history


@router.get("/suggestions", response_model=List[str])
async def get_contextual_suggestions(
    page: str,
    current_user: User = Depends(get_current_user),
):
    suggestions_map = {
        "/student/dashboard": [
            "What are my assignments today?",
            "Show my attendance this month",
            "How am I performing this term?",
        ],
        "/student/assignments": [
            "Help me with this assignment",
            "When is the next assignment due?",
            "Upload homework for help",
        ],
        "/student/analytics": [
            "Explain my performance trends",
            "Which subjects need more focus?",
            "Compare with class average",
        ],
        "/student/ai-prediction": [
            "What topics should I focus on?",
            "Predict my exam performance",
            "Create a study plan",
        ],
        "/admin/examinations": [
            "How to create an exam?",
            "Schedule exam for next week",
            "Check marks entry status",
        ],
        "/admin/attendance": [
            "Mark today's attendance",
            "Show attendance defaulters",
            "Generate attendance report",
        ],
    }
    
    return suggestions_map.get(page, [
        "How can I help you today?",
        "Show me around",
        "What can you do?",
    ])


@router.delete("/history")
async def clear_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"message": "History cleared successfully"}
