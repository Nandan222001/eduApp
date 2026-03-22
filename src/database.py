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
    pool_recycle=3600,
    connect_args={'charset': 'utf8mb4'},
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
    db.info['institution_id'] = institution_id
    db.info['user_id'] = user_id
    db.info['bypass_rls'] = bypass_rls


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
    db.info.pop('institution_id', None)
    db.info.pop('user_id', None)
    db.info.pop('bypass_rls', None)


def apply_tenant_filter(query, model, db: Session):
    if db.info.get('bypass_rls', False):
        return query
    
    institution_id = db.info.get('institution_id')
    if institution_id is not None and hasattr(model, 'institution_id'):
        query = query.filter(model.institution_id == institution_id)
    
    return query
