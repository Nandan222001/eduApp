from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timedelta

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
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

# Staff who may edit/delete/share any deck belonging to their own institution,
# and view any student's study progress within it, even if they didn't
# create the deck themselves.
STAFF_ROLES = ["teacher", "admin", "super_admin"]


def _is_staff(current_user: User) -> bool:
    return bool(current_user.role and current_user.role.slug in STAFF_ROLES)


def _check_institution_access(current_user: User, institution_id: int) -> None:
    """403s unless the caller is a superuser or belongs to this institution."""
    if not current_user.is_superuser and current_user.institution_id != institution_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def _check_deck_owner_or_staff(current_user: User, deck: FlashcardDeck) -> None:
    """Only the deck's creator, institution staff, or a superuser may modify it."""
    if current_user.is_superuser:
        return
    if deck.creator_id == current_user.id:
        return
    if _is_staff(current_user) and deck.institution_id == current_user.institution_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def _get_deck_or_404(db: Session, deck_id: int) -> FlashcardDeck:
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


def _check_self_or_staff(current_user: User, target_user_id: int, institution_id: Optional[int]) -> None:
    """For reading another user's study data: the user themself, institution
    staff (of the deck's institution), or a superuser."""
    if current_user.is_superuser:
        return
    if current_user.id == target_user_id:
        return
    if _is_staff(current_user) and institution_id is not None and current_user.institution_id == institution_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def _check_self_only(current_user: User, target_user_id: int) -> None:
    """For recording another user's personal study activity: only the user
    themself or a superuser -- this is exercise/progress data, not
    something staff should be able to fabricate on a student's behalf."""
    if current_user.is_superuser:
        return
    if current_user.id != target_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot record study activity for another user"
        )


# Flashcard Deck Endpoints
@router.post("/decks", response_model=FlashcardDeckResponse, status_code=status.HTTP_201_CREATED)
def create_deck(
    deck: FlashcardDeckCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _check_institution_access(current_user, deck.institution_id)
    if deck.creator_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create a deck on behalf of another user"
        )

    db_deck = FlashcardDeck(**deck.model_dump())
    db.add(db_deck)
    db.commit()
    db.refresh(db_deck)
    return db_deck


@router.post("/decks/bulk", response_model=FlashcardDeckResponse, status_code=status.HTTP_201_CREATED)
def create_deck_with_cards(
    bulk_data: FlashcardDeckBulkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _check_institution_access(current_user, bulk_data.deck.institution_id)
    if bulk_data.deck.creator_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create a deck on behalf of another user"
        )

    # Create deck
    db_deck = FlashcardDeck(**bulk_data.deck.model_dump())
    db.add(db_deck)
    db.flush()

    # Create flashcards
    for idx, card in enumerate(bulk_data.flashcards):
        # `card.model_dump()` already includes `order_index` (FlashcardBase
        # defaults it to 0), so passing `order_index=idx` alongside it as a
        # separate kwarg raised "got multiple values for keyword argument
        # 'order_index'" on every single bulk-create call -- this endpoint
        # was 100% broken for its actual purpose. Excluded here so the list
        # position (idx) always wins, as originally intended (same fix
        # shape as this codebase's quizzes.py POST /quizzes/bulk fix).
        db_card = Flashcard(
            **card.model_dump(exclude={"order_index"}),
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(FlashcardDeck).filter(FlashcardDeck.is_active == True)

    # Non-superusers can only ever list decks belonging to their own
    # institution -- the institution_id query param is honored only for
    # superusers, otherwise it's silently ignored to prevent cross-tenant
    # enumeration of another institution's decks.
    if current_user.is_superuser:
        if institution_id:
            query = query.filter(FlashcardDeck.institution_id == institution_id)
    else:
        query = query.filter(FlashcardDeck.institution_id == current_user.institution_id)

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
def get_deck(
    deck_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deck = _get_deck_or_404(db, deck_id)
    _check_institution_access(current_user, deck.institution_id)
    return deck


@router.put("/decks/{deck_id}", response_model=FlashcardDeckResponse)
def update_deck(
    deck_id: int,
    deck_update: FlashcardDeckUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_deck = _get_deck_or_404(db, deck_id)
    _check_deck_owner_or_staff(current_user, db_deck)

    for field, value in deck_update.model_dump(exclude_unset=True).items():
        setattr(db_deck, field, value)

    db.commit()
    db.refresh(db_deck)
    return db_deck


@router.delete("/decks/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck(
    deck_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_deck = _get_deck_or_404(db, deck_id)
    _check_deck_owner_or_staff(current_user, db_deck)

    db.delete(db_deck)
    db.commit()


# Flashcard Endpoints
@router.post("/cards", response_model=FlashcardResponse, status_code=status.HTTP_201_CREATED)
def create_flashcard(
    card: FlashcardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Previously the target deck was looked up *after* the card had already
    # been added to the session (only to update its total_cards counter),
    # so an unknown deck_id raised an unhandled FK IntegrityError (500)
    # instead of a clean 404, and there was no ownership/institution check
    # at all -- any authenticated caller could add cards to any deck.
    deck = _get_deck_or_404(db, card.deck_id)
    _check_deck_owner_or_staff(current_user, deck)

    db_card = Flashcard(**card.model_dump())
    db.add(db_card)

    # Update deck total cards
    deck.total_cards = db.query(Flashcard).filter(
        and_(Flashcard.deck_id == card.deck_id, Flashcard.is_active == True)
    ).count() + 1

    db.commit()
    db.refresh(db_card)
    return db_card


@router.get("/decks/{deck_id}/cards", response_model=List[FlashcardResponse])
def list_deck_cards(
    deck_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deck = _get_deck_or_404(db, deck_id)
    _check_institution_access(current_user, deck.institution_id)

    cards = db.query(Flashcard).filter(
        and_(Flashcard.deck_id == deck_id, Flashcard.is_active == True)
    ).order_by(Flashcard.order_index).all()
    return cards


@router.get("/cards/{card_id}", response_model=FlashcardResponse)
def get_flashcard(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == card.deck_id).first()
    if deck:
        _check_institution_access(current_user, deck.institution_id)
    return card


@router.put("/cards/{card_id}", response_model=FlashcardResponse)
def update_flashcard(
    card_id: int,
    card_update: FlashcardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == db_card.deck_id).first()
    if deck:
        _check_deck_owner_or_staff(current_user, deck)

    for field, value in card_update.model_dump(exclude_unset=True).items():
        setattr(db_card, field, value)

    db.commit()
    db.refresh(db_card)
    return db_card


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flashcard(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    deck_id = db_card.deck_id
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id).first()
    if deck:
        _check_deck_owner_or_staff(current_user, deck)

    db.delete(db_card)
    # This app's Session is configured with autoflush=False (see
    # src/database.py's SessionLocal), so the DELETE above is not sent to
    # the database until the next explicit flush/commit -- the count query
    # right below used to still see the row being deleted and included it,
    # leaving deck.total_cards permanently off by one (too high) after
    # every single card deletion. Flushing first makes the DELETE visible
    # to the COUNT in the same transaction.
    db.flush()

    # Update deck total cards
    if deck:
        deck.total_cards = db.query(Flashcard).filter(
            and_(Flashcard.deck_id == deck_id, Flashcard.is_active == True)
        ).count()

    db.commit()


# Deck Sharing Endpoints
@router.post("/decks/{deck_id}/share", response_model=FlashcardDeckShareResponse, status_code=status.HTTP_201_CREATED)
def share_deck(
    deck_id: int,
    share: FlashcardDeckShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deck = _get_deck_or_404(db, deck_id)
    _check_deck_owner_or_staff(current_user, deck)

    share.deck_id = deck_id
    db_share = FlashcardDeckShare(**share.model_dump())
    db.add(db_share)
    db.commit()
    db.refresh(db_share)
    return db_share


@router.get("/decks/{deck_id}/shares", response_model=List[FlashcardDeckShareResponse])
def list_deck_shares(
    deck_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deck = _get_deck_or_404(db, deck_id)
    _check_deck_owner_or_staff(current_user, deck)

    shares = db.query(FlashcardDeckShare).filter(FlashcardDeckShare.deck_id == deck_id).all()
    return shares


@router.delete("/decks/shares/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def unshare_deck(
    share_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    share = db.query(FlashcardDeckShare).filter(FlashcardDeckShare.id == share_id).first()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")

    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == share.deck_id).first()
    if deck:
        _check_deck_owner_or_staff(current_user, deck)

    db.delete(share)
    db.commit()


# Study Progress Endpoints
@router.get("/decks/{deck_id}/progress/{user_id}", response_model=FlashcardStudyProgressResponse)
def get_study_progress(
    deck_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deck = _get_deck_or_404(db, deck_id)
    _check_self_or_staff(current_user, user_id, deck.institution_id)

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
def get_deck_stats(
    deck_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deck = _get_deck_or_404(db, deck_id)
    _check_self_or_staff(current_user, user_id, deck.institution_id)

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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _check_self_only(current_user, user_id)

    flashcard = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    # Get or create session
    session = db.query(FlashcardStudySession).filter(
        and_(FlashcardStudySession.flashcard_id == card_id, FlashcardStudySession.user_id == user_id)
    ).first()

    if not session:
        # The model's column defaults (repetitions=0, correct_count=0,
        # incorrect_count=0, interval_days=0, ease_factor=2.5) are only
        # materialized into the Python object once SQLAlchemy actually
        # flushes/inserts it -- before that, these attributes are plain
        # `None` on a freshly-constructed instance. The arithmetic just
        # below (`session.repetitions += 1`, `.correct_count += 1`,
        # `.ease_factor + 0.1`, etc.) ran unconditionally on every "first
        # study of this card" request without ever flushing or supplying
        # these values explicitly, so `None + 1` / `None + 0.1` raised an
        # unhandled TypeError (500) on every single first-time study
        # session -- this endpoint's primary use case. Fixed by
        # constructing the object with the same defaults the model
        # declares, so the arithmetic below always has real numbers to
        # work with regardless of flush timing.
        session = FlashcardStudySession(
            flashcard_id=card_id,
            user_id=user_id,
            repetitions=0,
            correct_count=0,
            incorrect_count=0,
            interval_days=0,
            ease_factor=2.5,
            repetition_level=SpacedRepetitionLevel.NEW,
        )
        db.add(session)

    # Update session based on SM-2 algorithm
    session.last_reviewed_at = datetime.utcnow()

    if session_update.is_correct:
        session.correct_count += 1
        # `repetitions` used to also be incremented once, unconditionally,
        # right above this `if` -- on top of the increment here, that made
        # every *first-ever* correct review jump straight from
        # repetitions=0 to repetitions=2, permanently skipping the
        # `repetitions == 1` branch below (interval_days=1, the intended
        # "review again tomorrow" first step of the SM-2 schedule) and
        # landing every first correct answer on a 6-day interval instead.
        # The `else` branch already resets `repetitions` to 0 outright on
        # an incorrect answer, so that redundant increment was dead code
        # there too. Removed; this is the only increment now.
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
    progress = db.query(FlashcardStudyProgress).filter(
        and_(
            FlashcardStudyProgress.deck_id == flashcard.deck_id,
            FlashcardStudyProgress.user_id == user_id
        )
    ).first()

    if not progress:
        progress = FlashcardStudyProgress(deck_id=flashcard.deck_id, user_id=user_id)
        db.add(progress)

    # This app's Session is configured with autoflush=False (see
    # src/database.py's SessionLocal), so a brand-new `session` row added
    # above (the "first-ever study of this card" case) is not yet visible
    # to the plain SELECT COUNT queries below -- `studied_count` silently
    # undercounted by 1 (and `mastered_count` likewise, whenever that first
    # study already reached MASTERED) on every single "first study session
    # for a deck" request, persisting a wrong (too-low) cards_studied on
    # FlashcardStudyProgress. Flushing first makes the new session visible
    # to these counts in the same transaction.
    db.flush()

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
def get_due_cards(
    deck_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get flashcards that are due for review"""
    deck = _get_deck_or_404(db, deck_id)
    _check_self_or_staff(current_user, user_id, deck.institution_id)

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
