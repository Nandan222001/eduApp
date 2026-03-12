from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timedelta

from src.database import get_db
from src.models.flashcard import (
    Flashcard, FlashcardDeck, FlashcardDeckShare,
    FlashcardStudyProgress, FlashcardStudySession,
    SpacedRepetitionLevel
)
from src.schemas.flashcard import (
    FlashcardCreate, FlashcardUpdate, FlashcardResponse,
    FlashcardDeckCreate, FlashcardDeckUpdate, FlashcardDeckResponse,
    FlashcardDeckShareCreate, FlashcardDeckShareResponse,
    FlashcardStudyProgressResponse, FlashcardStudySessionUpdate,
    FlashcardStudySessionResponse, FlashcardDeckBulkCreate,
    FlashcardDeckStats
)

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


# Flashcard Deck Endpoints
@router.post("/decks", response_model=FlashcardDeckResponse, status_code=status.HTTP_201_CREATED)
def create_deck(deck: FlashcardDeckCreate, db: Session = Depends(get_db)):
    db_deck = FlashcardDeck(**deck.model_dump())
    db.add(db_deck)
    db.commit()
    db.refresh(db_deck)
    return db_deck


@router.post("/decks/bulk", response_model=FlashcardDeckResponse, status_code=status.HTTP_201_CREATED)
def create_deck_with_cards(bulk_data: FlashcardDeckBulkCreate, db: Session = Depends(get_db)):
    # Create deck
    db_deck = FlashcardDeck(**bulk_data.deck.model_dump())
    db.add(db_deck)
    db.flush()
    
    # Create flashcards
    for idx, card in enumerate(bulk_data.flashcards):
        db_card = Flashcard(
            **card.model_dump(),
            deck_id=db_deck.id,
            order_index=idx
        )
        db.add(db_card)
    
    db_deck.total_cards = len(bulk_data.flashcards)
    db.commit()
    db.refresh(db_deck)
    return db_deck


@router.get("/decks", response_model=List[FlashcardDeckResponse])
def list_decks(
    skip: int = 0,
    limit: int = 100,
    institution_id: Optional[int] = None,
    creator_id: Optional[int] = None,
    grade_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    visibility: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(FlashcardDeck).filter(FlashcardDeck.is_active == True)
    
    if institution_id:
        query = query.filter(FlashcardDeck.institution_id == institution_id)
    if creator_id:
        query = query.filter(FlashcardDeck.creator_id == creator_id)
    if grade_id:
        query = query.filter(FlashcardDeck.grade_id == grade_id)
    if subject_id:
        query = query.filter(FlashcardDeck.subject_id == subject_id)
    if visibility:
        query = query.filter(FlashcardDeck.visibility == visibility)
    if search:
        query = query.filter(
            or_(
                FlashcardDeck.title.ilike(f"%{search}%"),
                FlashcardDeck.description.ilike(f"%{search}%"),
                FlashcardDeck.tags.ilike(f"%{search}%")
            )
        )
    
    return query.offset(skip).limit(limit).all()


@router.get("/decks/{deck_id}", response_model=FlashcardDeckResponse)
def get_deck(deck_id: int, db: Session = Depends(get_db)):
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


@router.put("/decks/{deck_id}", response_model=FlashcardDeckResponse)
def update_deck(deck_id: int, deck_update: FlashcardDeckUpdate, db: Session = Depends(get_db)):
    db_deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id).first()
    if not db_deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    for field, value in deck_update.model_dump(exclude_unset=True).items():
        setattr(db_deck, field, value)
    
    db.commit()
    db.refresh(db_deck)
    return db_deck


@router.delete("/decks/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck(deck_id: int, db: Session = Depends(get_db)):
    db_deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id).first()
    if not db_deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    db.delete(db_deck)
    db.commit()


# Flashcard Endpoints
@router.post("/cards", response_model=FlashcardResponse, status_code=status.HTTP_201_CREATED)
def create_flashcard(card: FlashcardCreate, db: Session = Depends(get_db)):
    db_card = Flashcard(**card.model_dump())
    db.add(db_card)
    
    # Update deck total cards
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == card.deck_id).first()
    if deck:
        deck.total_cards = db.query(Flashcard).filter(
            and_(Flashcard.deck_id == card.deck_id, Flashcard.is_active == True)
        ).count() + 1
    
    db.commit()
    db.refresh(db_card)
    return db_card


@router.get("/decks/{deck_id}/cards", response_model=List[FlashcardResponse])
def list_deck_cards(deck_id: int, db: Session = Depends(get_db)):
    cards = db.query(Flashcard).filter(
        and_(Flashcard.deck_id == deck_id, Flashcard.is_active == True)
    ).order_by(Flashcard.order_index).all()
    return cards


@router.get("/cards/{card_id}", response_model=FlashcardResponse)
def get_flashcard(card_id: int, db: Session = Depends(get_db)):
    card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return card


@router.put("/cards/{card_id}", response_model=FlashcardResponse)
def update_flashcard(card_id: int, card_update: FlashcardUpdate, db: Session = Depends(get_db)):
    db_card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    for field, value in card_update.model_dump(exclude_unset=True).items():
        setattr(db_card, field, value)
    
    db.commit()
    db.refresh(db_card)
    return db_card


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flashcard(card_id: int, db: Session = Depends(get_db)):
    db_card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    deck_id = db_card.deck_id
    db.delete(db_card)
    
    # Update deck total cards
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id).first()
    if deck:
        deck.total_cards = db.query(Flashcard).filter(
            and_(Flashcard.deck_id == deck_id, Flashcard.is_active == True)
        ).count()
    
    db.commit()


# Deck Sharing Endpoints
@router.post("/decks/{deck_id}/share", response_model=FlashcardDeckShareResponse, status_code=status.HTTP_201_CREATED)
def share_deck(deck_id: int, share: FlashcardDeckShareCreate, db: Session = Depends(get_db)):
    share.deck_id = deck_id
    db_share = FlashcardDeckShare(**share.model_dump())
    db.add(db_share)
    db.commit()
    db.refresh(db_share)
    return db_share


@router.get("/decks/{deck_id}/shares", response_model=List[FlashcardDeckShareResponse])
def list_deck_shares(deck_id: int, db: Session = Depends(get_db)):
    shares = db.query(FlashcardDeckShare).filter(FlashcardDeckShare.deck_id == deck_id).all()
    return shares


@router.delete("/decks/shares/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def unshare_deck(share_id: int, db: Session = Depends(get_db)):
    share = db.query(FlashcardDeckShare).filter(FlashcardDeckShare.id == share_id).first()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    db.delete(share)
    db.commit()


# Study Progress Endpoints
@router.get("/decks/{deck_id}/progress/{user_id}", response_model=FlashcardStudyProgressResponse)
def get_study_progress(deck_id: int, user_id: int, db: Session = Depends(get_db)):
    progress = db.query(FlashcardStudyProgress).filter(
        and_(FlashcardStudyProgress.deck_id == deck_id, FlashcardStudyProgress.user_id == user_id)
    ).first()
    
    if not progress:
        # Create initial progress
        progress = FlashcardStudyProgress(deck_id=deck_id, user_id=user_id)
        db.add(progress)
        db.commit()
        db.refresh(progress)
    
    return progress


@router.get("/decks/{deck_id}/stats/{user_id}", response_model=FlashcardDeckStats)
def get_deck_stats(deck_id: int, user_id: int, db: Session = Depends(get_db)):
    # Get total cards
    total_cards = db.query(Flashcard).filter(
        and_(Flashcard.deck_id == deck_id, Flashcard.is_active == True)
    ).count()
    
    # Get progress
    progress = db.query(FlashcardStudyProgress).filter(
        and_(FlashcardStudyProgress.deck_id == deck_id, FlashcardStudyProgress.user_id == user_id)
    ).first()
    
    cards_studied = progress.cards_studied if progress else 0
    cards_mastered = progress.cards_mastered if progress else 0
    study_time = progress.total_study_time_minutes if progress else 0
    
    # Get accuracy
    sessions = db.query(FlashcardStudySession).join(Flashcard).filter(
        and_(Flashcard.deck_id == deck_id, FlashcardStudySession.user_id == user_id)
    ).all()
    
    total_correct = sum(s.correct_count for s in sessions)
    total_incorrect = sum(s.incorrect_count for s in sessions)
    total_attempts = total_correct + total_incorrect
    accuracy = (total_correct / total_attempts * 100) if total_attempts > 0 else 0
    
    # Get cards due today
    today = datetime.utcnow().date()
    cards_due = db.query(FlashcardStudySession).join(Flashcard).filter(
        and_(
            Flashcard.deck_id == deck_id,
            FlashcardStudySession.user_id == user_id,
            FlashcardStudySession.next_review_date <= datetime.utcnow()
        )
    ).count()
    
    return FlashcardDeckStats(
        total_cards=total_cards,
        cards_studied=cards_studied,
        cards_mastered=cards_mastered,
        study_time_minutes=study_time,
        average_accuracy=accuracy,
        cards_due_today=cards_due
    )


# Study Session Endpoints
@router.post("/cards/{card_id}/study/{user_id}", response_model=FlashcardStudySessionResponse)
def update_study_session(
    card_id: int,
    user_id: int,
    session_update: FlashcardStudySessionUpdate,
    db: Session = Depends(get_db)
):
    # Get or create session
    session = db.query(FlashcardStudySession).filter(
        and_(FlashcardStudySession.flashcard_id == card_id, FlashcardStudySession.user_id == user_id)
    ).first()
    
    if not session:
        session = FlashcardStudySession(flashcard_id=card_id, user_id=user_id)
        db.add(session)
    
    # Update session based on SM-2 algorithm
    session.last_reviewed_at = datetime.utcnow()
    session.repetitions += 1
    
    if session_update.is_correct:
        session.correct_count += 1
        session.repetitions += 1
        
        if session.repetitions == 1:
            session.interval_days = 1
        elif session.repetitions == 2:
            session.interval_days = 6
        else:
            session.interval_days = int(session.interval_days * session.ease_factor)
        
        # Update ease factor
        session.ease_factor = max(1.3, session.ease_factor + 0.1)
        
        # Update level
        if session.interval_days >= 21:
            session.repetition_level = SpacedRepetitionLevel.MASTERED
        elif session.interval_days >= 6:
            session.repetition_level = SpacedRepetitionLevel.REVIEWING
        else:
            session.repetition_level = SpacedRepetitionLevel.LEARNING
    else:
        session.incorrect_count += 1
        session.repetitions = 0
        session.interval_days = 1
        session.ease_factor = max(1.3, session.ease_factor - 0.2)
        session.repetition_level = SpacedRepetitionLevel.NEW
    
    # Set next review date
    session.next_review_date = datetime.utcnow() + timedelta(days=session.interval_days)
    
    # Update deck progress
    flashcard = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if flashcard:
        progress = db.query(FlashcardStudyProgress).filter(
            and_(
                FlashcardStudyProgress.deck_id == flashcard.deck_id,
                FlashcardStudyProgress.user_id == user_id
            )
        ).first()
        
        if not progress:
            progress = FlashcardStudyProgress(deck_id=flashcard.deck_id, user_id=user_id)
            db.add(progress)
        
        # Update progress stats
        studied_count = db.query(FlashcardStudySession).join(Flashcard).filter(
            and_(
                Flashcard.deck_id == flashcard.deck_id,
                FlashcardStudySession.user_id == user_id
            )
        ).count()
        
        mastered_count = db.query(FlashcardStudySession).join(Flashcard).filter(
            and_(
                Flashcard.deck_id == flashcard.deck_id,
                FlashcardStudySession.user_id == user_id,
                FlashcardStudySession.repetition_level == SpacedRepetitionLevel.MASTERED
            )
        ).count()
        
        progress.cards_studied = studied_count
        progress.cards_mastered = mastered_count
        progress.last_studied_at = datetime.utcnow()
    
    db.commit()
    db.refresh(session)
    return session


@router.get("/decks/{deck_id}/due-cards/{user_id}", response_model=List[FlashcardResponse])
def get_due_cards(deck_id: int, user_id: int, db: Session = Depends(get_db)):
    """Get flashcards that are due for review"""
    now = datetime.utcnow()
    
    # Get cards with due sessions
    due_sessions = db.query(FlashcardStudySession).join(Flashcard).filter(
        and_(
            Flashcard.deck_id == deck_id,
            Flashcard.is_active == True,
            FlashcardStudySession.user_id == user_id,
            FlashcardStudySession.next_review_date <= now
        )
    ).all()
    
    due_card_ids = [s.flashcard_id for s in due_sessions]
    
    # Get cards that haven't been studied yet
    studied_card_ids = db.query(FlashcardStudySession.flashcard_id).join(Flashcard).filter(
        and_(
            Flashcard.deck_id == deck_id,
            FlashcardStudySession.user_id == user_id
        )
    ).all()
    studied_card_ids = [id[0] for id in studied_card_ids]
    
    new_cards = db.query(Flashcard).filter(
        and_(
            Flashcard.deck_id == deck_id,
            Flashcard.is_active == True,
            ~Flashcard.id.in_(studied_card_ids)
        )
    ).limit(10).all()
    
    # Combine due cards and new cards
    due_cards = db.query(Flashcard).filter(Flashcard.id.in_(due_card_ids)).all() if due_card_ids else []
    
    return due_cards + new_cards
