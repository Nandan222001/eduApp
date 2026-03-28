# Rate Limiting Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
poetry add slowapi
```

### 2. Run Database Migrations

```bash
alembic upgrade head
```

This will create the following tables:
- `rate_limit_violations` - Stores individual violation events
- `rate_limit_stats` - Stores aggregated daily statistics

### 3. Configure Redis

Ensure Redis is running and configured in your `.env` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

The rate limiter uses Redis for fast, distributed rate limiting.

### 4. Start the Application

```bash
uvicorn src.main:app --reload
```

Rate limiting is now active! All API requests will be rate limited based on user roles.

### 5. (Optional) Configure Celery Background Tasks

For automatic violation persistence and cleanup, configure Celery:

```bash
# Start Celery worker
celery -A src.celery_app worker --loglevel=info

# Start Celery beat scheduler
celery -A src.celery_app beat --loglevel=info
```

Add these tasks to your Celery beat schedule:

```python
# In src/celery_app.py or celeryconfig.py
from celery.schedules import crontab

beat_schedule = {
    'persist-rate-limit-violations': {
        'task': 'persist_rate_limit_violations',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
    'cleanup-old-rate-limit-violations': {
        'task': 'cleanup_old_rate_limit_violations',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
        'kwargs': {'days': 90},
    },
    'generate-rate-limit-stats': {
        'task': 'generate_rate_limit_stats',
        'schedule': crontab(hour=1, minute=0),  # Daily at 1 AM
    },
}
```

## Verification

### Test Rate Limiting

1. **Check Headers**: Make any API request and check response headers:
   ```bash
   curl -I http://localhost:8000/api/v1/users
   ```
   
   You should see:
   ```
   X-RateLimit-Limit: 50
   X-RateLimit-Policy: 50/minute
   X-RateLimit-Role: anonymous
   ```

2. **Test with Authentication**: Login and make requests:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8000/api/v1/users
   ```
   
   Headers will reflect your role's limits.

3. **Trigger Rate Limit**: Make many rapid requests to trigger a 429 response:
   ```bash
   for i in {1..60}; do
     curl http://localhost:8000/api/v1/users
   done
   ```

### Access Admin Dashboard

1. **Login as Super Admin**

2. **Access Dashboard**:
   ```bash
   curl -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
        http://localhost:8000/api/v1/rate-limits/dashboard
   ```

3. **View Violations**:
   ```bash
   curl -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
        "http://localhost:8000/api/v1/rate-limits/violations?page=1&page_size=20"
   ```

## Configuration

### Adjust Rate Limits

Edit `src/middleware/rate_limit.py`:

```python
def get_rate_limit_for_role(role_slug: Optional[str] = None) -> str:
    role_limits = {
        "super_admin": "1000/minute",      # Change these values
        "institution_admin": "500/minute",
        "manager": "300/minute",
        "teacher": "200/minute",
        "staff": "150/minute",
        "student": "100/minute",
        "parent": "100/minute",
    }
    
    if role_slug and role_slug in role_limits:
        return role_limits[role_slug]
    
    return "50/minute"  # Default for anonymous users
```

Restart the application after changes.

### Custom Rate Limits for Specific Endpoints

You can apply custom rate limits to specific endpoints using the decorator:

```python
from fastapi import APIRouter, Request
from src.middleware.rate_limit import limiter

router = APIRouter()

@router.get("/expensive-operation")
@limiter.limit("10/minute")  # Only 10 requests per minute
async def expensive_operation(request: Request):
    return {"message": "This is rate limited to 10/minute"}
```

Or use role-based limits with custom values:

```python
from src.utils.rate_limit_helpers import rate_limit_by_role

@router.post("/create-resource")
@rate_limit_by_role(
    teacher="50/minute",
    student="10/minute",
    default="5/minute"
)
async def create_resource(request: Request):
    return {"message": "Created"}
```

## Monitoring

### Check Redis Keys

View rate limit data in Redis:

```bash
redis-cli

# View all rate limit keys
KEYS "LIMITER:*"

# View violations
KEYS "rate_limit:violations:*"

# View stats
KEYS "rate_limit:stats:*"
```

### Check Database

Query violations in MySQL:

```sql
-- Recent violations
SELECT * FROM rate_limit_violations 
ORDER BY created_at DESC 
LIMIT 10;

-- Violations by role
SELECT role_slug, COUNT(*) as count 
FROM rate_limit_violations 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY role_slug
ORDER BY count DESC;

-- Top violators
SELECT user_id, COUNT(*) as violations 
FROM rate_limit_violations 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY violations DESC
LIMIT 10;
```

### View Logs

Check application logs for rate limiting activity:

```bash
# View rate limit violations
grep "rate_limit" logs/app.log

# View Celery task execution
grep "persist_rate_limit_violations" logs/celery.log
```

## Troubleshooting

### Rate Limits Not Working

**Problem**: Rate limits are not being enforced

**Solutions**:
1. Check Redis is running: `redis-cli ping` should return `PONG`
2. Verify Redis connection in `.env` file
3. Check limiter is initialized: Look for `app.state.limiter = limiter` in `src/main.py`
4. Restart the application

### Headers Not Appearing

**Problem**: X-RateLimit-* headers are missing from responses

**Solutions**:
1. Verify `RateLimitHeadersMiddleware` is added in `src/main.py`
2. Check middleware order - it should be before other middlewares
3. Clear browser cache or use `curl -I` to check headers directly

### Violations Not in Dashboard

**Problem**: Rate limit violations not appearing in admin dashboard

**Solutions**:
1. Check Celery worker is running
2. Run migration: `alembic upgrade head`
3. Manually trigger task: `celery -A src.celery_app call persist_rate_limit_violations`
4. Check database connection
5. Look for errors in Celery logs

### Too Many Violations

**Problem**: Users are hitting rate limits frequently

**Solutions**:
1. Review dashboard to identify patterns
2. Check if specific endpoints need optimization
3. Consider increasing limits for specific roles
4. Implement caching on frontend to reduce API calls
5. Add endpoint-specific limits for expensive operations

### Redis Memory Issues

**Problem**: Redis running out of memory

**Solutions**:
1. Check Redis memory usage: `redis-cli INFO memory`
2. Set Redis maxmemory policy: `maxmemory-policy allkeys-lru`
3. Run cleanup task more frequently
4. Reduce violation retention period
5. Consider using Redis persistence with appropriate eviction policy

## Performance Considerations

### Redis Configuration

For optimal performance:

```conf
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save ""
appendonly no
```

### Database Indexes

Ensure these indexes exist (created by migration):

```sql
CREATE INDEX idx_rate_limit_user_created ON rate_limit_violations(user_id, created_at);
CREATE INDEX idx_rate_limit_role_created ON rate_limit_violations(role_slug, created_at);
CREATE INDEX idx_rate_limit_path_created ON rate_limit_violations(path, created_at);
CREATE INDEX idx_rate_limit_ip_created ON rate_limit_violations(ip_address, created_at);
```

### Cleanup Schedule

Run cleanup regularly to prevent database bloat:

- Persist violations every 5 minutes
- Generate stats daily
- Clean up violations older than 90 days daily

## Security Considerations

1. **Super Admin Access**: Rate limit dashboard is restricted to super admins only
2. **IP-based Limiting**: Anonymous users are rate limited by IP address
3. **User-based Limiting**: Authenticated users are rate limited by user ID + role
4. **Bypass Protection**: Super admins have higher limits but are still rate limited
5. **DDoS Protection**: Low default limit (50/min) for anonymous users

## Next Steps

1. Review the [Rate Limiting Documentation](./RATE_LIMITING.md) for detailed information
2. Configure Celery tasks for automatic cleanup
3. Set up monitoring and alerts
4. Customize rate limits based on your application's needs
5. Inform users about rate limits in your API documentation
