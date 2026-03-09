from contextlib import contextmanager
from typing import Optional, Generator
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from src.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def set_rls_context(
    db: Session,
    institution_id: Optional[int] = None,
    user_id: Optional[int] = None,
    bypass_rls: bool = False
) -> None:
    if bypass_rls:
        db.execute("SET LOCAL app.bypass_rls = true")
    else:
        db.execute("SET LOCAL app.bypass_rls = false")
        
    if institution_id is not None:
        db.execute(f"SET LOCAL app.current_institution_id = {institution_id}")
    
    if user_id is not None:
        db.execute(f"SET LOCAL app.current_user_id = {user_id}")


@contextmanager
def get_db_with_context(
    institution_id: Optional[int] = None,
    user_id: Optional[int] = None,
    bypass_rls: bool = False
) -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        set_rls_context(db, institution_id, user_id, bypass_rls)
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def reset_rls_context(db: Session) -> None:
    db.execute("RESET app.current_institution_id")
    db.execute("RESET app.current_user_id")
    db.execute("RESET app.bypass_rls")
