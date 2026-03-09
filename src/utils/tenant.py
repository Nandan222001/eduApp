from typing import Optional
from sqlalchemy.orm import Session

from src.models import Institution, User, Subscription


def get_institution_by_slug(db: Session, slug: str) -> Optional[Institution]:
    return db.query(Institution).filter(Institution.slug == slug).first()


def get_institution_by_domain(db: Session, domain: str) -> Optional[Institution]:
    return db.query(Institution).filter(Institution.domain == domain).first()


def is_institution_active(institution: Institution) -> bool:
    return institution.is_active


def get_active_subscription(db: Session, institution_id: int) -> Optional[Subscription]:
    return (
        db.query(Subscription)
        .filter(
            Subscription.institution_id == institution_id,
            Subscription.status == 'active'
        )
        .order_by(Subscription.created_at.desc())
        .first()
    )


def check_institution_user_limit(db: Session, institution_id: int) -> bool:
    institution = db.query(Institution).filter(Institution.id == institution_id).first()
    if not institution or not institution.max_users:
        return True
    
    user_count = db.query(User).filter(
        User.institution_id == institution_id,
        User.is_active == True
    ).count()
    
    return user_count < institution.max_users


def can_add_user(db: Session, institution_id: int) -> bool:
    institution = db.query(Institution).filter(Institution.id == institution_id).first()
    if not institution or not institution.is_active:
        return False
    
    subscription = get_active_subscription(db, institution_id)
    if subscription and subscription.max_users:
        user_count = db.query(User).filter(
            User.institution_id == institution_id,
            User.is_active == True
        ).count()
        return user_count < subscription.max_users
    
    return check_institution_user_limit(db, institution_id)
