from datetime import datetime, timedelta
from typing import Optional
from celery import shared_task
from sqlalchemy.orm import Session
from src.database import SessionLocal
from src.models.rate_limit import RateLimitViolation
from src.schemas.rate_limit import RateLimitViolationCreate
from src.services.rate_limit_service import RateLimitService
from src.redis_client import get_redis
import asyncio
import json
import logging

logger = logging.getLogger(__name__)


async def _persist_rate_limit_violations_async(db: Session) -> Optional[int]:
    client = await get_redis()
    if not client:
        return None

    keys = await client.keys("rate_limit:violations:*")
    total_persisted = 0

    for key in keys:
        violations = await client.lrange(key, 0, -1)

        for violation_json in violations:
            try:
                violation_data = json.loads(violation_json)

                violation_create = RateLimitViolationCreate(
                    user_id=violation_data.get("user_id"),
                    role_slug=violation_data.get("role_slug"),
                    path=violation_data.get("path"),
                    method=violation_data.get("method"),
                    ip_address=violation_data.get("ip_address"),
                    limit_hit=violation_data.get("limit"),
                    user_agent=violation_data.get("user_agent"),
                )

                RateLimitService.create_violation(db, violation_create)
                total_persisted += 1

            except Exception as e:
                logger.error(f"Error persisting violation: {e}")
                continue

        await client.delete(key)

    return total_persisted


@shared_task(name="persist_rate_limit_violations")
def persist_rate_limit_violations():
    db = SessionLocal()
    try:
        total_persisted = asyncio.run(_persist_rate_limit_violations_async(db))
        if total_persisted is None:
            logger.warning("Redis client not available for rate limit persistence")
            return
        logger.info(f"Persisted {total_persisted} rate limit violations to database")
        return {"persisted": total_persisted}

    except Exception as e:
        logger.error(f"Error in persist_rate_limit_violations task: {e}")
        raise
    finally:
        db.close()


@shared_task(name="cleanup_old_rate_limit_violations")
def cleanup_old_rate_limit_violations(days: int = 90):
    db = SessionLocal()
    try:
        deleted_count = RateLimitService.cleanup_old_violations(db, days)
        logger.info(f"Cleaned up {deleted_count} old rate limit violations")
        return {"deleted": deleted_count}
    except Exception as e:
        logger.error(f"Error in cleanup_old_rate_limit_violations task: {e}")
        raise
    finally:
        db.close()


@shared_task(name="generate_rate_limit_stats")
def generate_rate_limit_stats():
    db = SessionLocal()
    try:
        today = datetime.utcnow().date()
        
        from sqlalchemy import func
        from src.models.rate_limit import RateLimitStats
        
        violations_by_role = db.query(
            RateLimitViolation.role_slug,
            func.count(RateLimitViolation.id).label('count'),
            func.count(func.distinct(RateLimitViolation.user_id)).label('unique_users'),
            func.count(func.distinct(RateLimitViolation.ip_address)).label('unique_ips'),
        ).filter(
            func.date(RateLimitViolation.created_at) == today
        ).group_by(
            RateLimitViolation.role_slug
        ).all()
        
        for result in violations_by_role:
            stats = db.query(RateLimitStats).filter(
                func.date(RateLimitStats.date) == today,
                RateLimitStats.role_slug == result.role_slug
            ).first()
            
            if stats:
                stats.total_violations = result.count
                stats.unique_users = result.unique_users
                stats.unique_ips = result.unique_ips
                stats.updated_at = datetime.utcnow()
            else:
                stats = RateLimitStats(
                    date=datetime.combine(today, datetime.min.time()),
                    role_slug=result.role_slug,
                    total_requests=0,
                    total_violations=result.count,
                    unique_users=result.unique_users,
                    unique_ips=result.unique_ips,
                )
                db.add(stats)
        
        db.commit()
        logger.info(f"Generated rate limit stats for {today}")
        return {"date": str(today), "role_count": len(violations_by_role)}
        
    except Exception as e:
        logger.error(f"Error in generate_rate_limit_stats task: {e}")
        db.rollback()
        raise
    finally:
        db.close()
