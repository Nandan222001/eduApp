# Rate Limiting Documentation

## Overview

The FastAPI application implements comprehensive API rate limiting to protect backend endpoints from abuse and ensure fair resource allocation across users. The rate limiting system features:

- **Tiered Rate Limits by User Role**: Different rate limits for different user roles (higher limits for teachers/admins)
- **Rate Limit Headers**: All responses include rate limit information in headers
- **Admin Dashboard**: Comprehensive monitoring dashboard for rate limit violations
- **Graceful Degradation**: Helpful error messages with retry information
- **Redis-backed Storage**: Fast, distributed rate limiting using Redis
- **Automatic Cleanup**: Background tasks to persist and clean up old violation data

## Rate Limit Tiers

### By User Role

| Role                | Rate Limit      | Requests/Minute |
|---------------------|-----------------|-----------------|
| Super Admin         | 1000/minute     | 1000            |
| Institution Admin   | 500/minute      | 500             |
| Manager             | 300/minute      | 300             |
| Teacher             | 200/minute      | 200             |
| Staff               | 150/minute      | 150             |
| Student             | 100/minute      | 100             |
| Parent              | 100/minute      | 100             |
| Anonymous/Guest     | 50/minute       | 50              |

## Response Headers

All API responses include the following rate limit headers:

```
X-RateLimit-Limit: 200              # Maximum requests allowed per window
X-RateLimit-Policy: 200/minute      # Human-readable policy description
X-RateLimit-Role: teacher           # User's role (used for rate limiting)
X-RateLimit-Remaining: 195          # Requests remaining in current window
X-RateLimit-Reset: 1705335600       # Unix timestamp when limit resets
```

## Error Response

When rate limit is exceeded (HTTP 429):

```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Your account allows up to 200 requests per minute.",
  "retry_after": 60,
  "limit": "200/minute",
  "upgrade_message": null
}
```

Headers include:
```
Retry-After: 60
```

## Admin Dashboard API Endpoints

### Get Dashboard Overview
```
GET /api/v1/rate-limits/dashboard
```

Returns comprehensive dashboard data including:
- Total violations (today, 7 days, 30 days)
- Violations by role
- Violations by endpoint
- Top violators
- Recent violations
- Rate limit configuration

**Authentication**: Super Admin only

**Response Example**:
```json
{
  "total_violations_today": 45,
  "total_violations_last_7_days": 312,
  "total_violations_last_30_days": 1205,
  "violations_by_role": [
    {
      "role": "student",
      "violations": 156
    },
    {
      "role": "teacher",
      "violations": 89
    }
  ],
  "violations_by_endpoint": [
    {
      "endpoint": "GET /api/v1/students",
      "violations": 45
    }
  ],
  "top_violators": [
    {
      "user_id": 123,
      "role": "student",
      "ip_address": "192.168.1.100",
      "violations": 23
    }
  ],
  "recent_violations": [...],
  "rate_limit_config": {...}
}
```

### Get Violations List
```
GET /api/v1/rate-limits/violations?user_id=123&role_slug=student&page=1&page_size=50
```

**Query Parameters**:
- `user_id` (optional): Filter by user ID
- `role_slug` (optional): Filter by role
- `path` (optional): Filter by endpoint path
- `ip_address` (optional): Filter by IP address
- `page` (default: 1): Page number
- `page_size` (default: 50, max: 100): Items per page

**Authentication**: Super Admin only

### Get Violations by Role
```
GET /api/v1/rate-limits/violations/by-role?days=7
```

**Query Parameters**:
- `days` (default: 7, max: 90): Number of days to analyze

**Authentication**: Super Admin only

### Get Violations by Endpoint
```
GET /api/v1/rate-limits/violations/by-endpoint?days=7&limit=10
```

**Query Parameters**:
- `days` (default: 7, max: 90): Number of days to analyze
- `limit` (default: 10, max: 50): Number of top endpoints to return

**Authentication**: Super Admin only

### Get Top Violators
```
GET /api/v1/rate-limits/violations/top-violators?days=7&limit=10
```

**Query Parameters**:
- `days` (default: 7, max: 90): Number of days to analyze
- `limit` (default: 10, max: 50): Number of top violators to return

**Authentication**: Super Admin only

### Cleanup Old Violations
```
DELETE /api/v1/rate-limits/violations/cleanup?days=90
```

**Query Parameters**:
- `days` (default: 90, min: 30, max: 365): Delete violations older than this

**Authentication**: Super Admin only

### Get Rate Limit Config
```
GET /api/v1/rate-limits/config
```

Returns rate limit configuration for the authenticated user.

**Authentication**: Required (any authenticated user)

### Get My Usage
```
GET /api/v1/rate-limits/my-usage?days=7
```

Returns rate limit usage statistics for the authenticated user.

**Authentication**: Required (any authenticated user)

## Implementation Details

### Architecture

1. **SlowAPI Integration**: Uses SlowAPI library for rate limiting with Redis backend
2. **Redis Storage**: Rate limits are tracked in Redis for fast, distributed access
3. **Database Persistence**: Violations are logged to database for long-term analysis
4. **Middleware**: Custom middleware adds rate limit headers to all responses
5. **Background Tasks**: Celery tasks handle periodic data persistence and cleanup

### Key Components

#### Rate Limit Middleware (`src/middleware/rate_limit.py`)
- Determines user identity (authenticated user or IP address)
- Applies appropriate rate limit based on user role
- Logs violations to Redis
- Provides custom error handler with helpful messages

#### Rate Limit Headers Middleware (`src/middleware/rate_limit_headers.py`)
- Adds X-RateLimit-* headers to all responses
- Provides transparency about rate limits to API consumers

#### Rate Limit Service (`src/services/rate_limit_service.py`)
- Manages violation data in database
- Provides analytics and reporting functionality
- Handles data cleanup

#### Background Tasks (`src/tasks/rate_limit_tasks.py`)
- `persist_rate_limit_violations`: Moves violations from Redis to database (run every 5 minutes)
- `cleanup_old_rate_limit_violations`: Removes old violation records (run daily)
- `generate_rate_limit_stats`: Generates daily statistics (run daily)

### Database Schema

#### rate_limit_violations
Stores individual rate limit violation events.

```sql
CREATE TABLE rate_limit_violations (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    role_slug VARCHAR(100),
    path VARCHAR(500),
    method VARCHAR(10),
    ip_address VARCHAR(45),
    limit_hit VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP
);
```

#### rate_limit_stats
Stores aggregated daily statistics.

```sql
CREATE TABLE rate_limit_stats (
    id INTEGER PRIMARY KEY,
    date TIMESTAMP,
    role_slug VARCHAR(100),
    total_requests BIGINT,
    total_violations BIGINT,
    unique_users INTEGER,
    unique_ips INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Configuration

Rate limits are configured in `src/middleware/rate_limit.py`:

```python
def get_rate_limit_for_role(role_slug: Optional[str] = None) -> str:
    role_limits = {
        "super_admin": "1000/minute",
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

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Total Violations**: Track sudden spikes in rate limit violations
2. **Violations by Role**: Identify roles that frequently hit limits
3. **Violations by Endpoint**: Find endpoints that may need optimization
4. **Top Violators**: Identify potentially abusive users or scripts

### Recommended Alerts

- Alert when violations exceed 100/hour for any single user
- Alert when total violations increase by 200% week-over-week
- Alert when specific endpoints account for >50% of violations

## Best Practices

### For API Consumers

1. **Monitor Response Headers**: Check X-RateLimit-Remaining to avoid hitting limits
2. **Implement Exponential Backoff**: When receiving 429 responses, wait progressively longer
3. **Cache Responses**: Reduce API calls by caching frequently accessed data
4. **Use Webhooks**: For real-time updates instead of polling
5. **Batch Requests**: Combine multiple operations where possible

### For Administrators

1. **Review Dashboard Weekly**: Check for unusual patterns
2. **Adjust Limits as Needed**: Modify limits based on usage patterns
3. **Cleanup Old Data**: Run cleanup tasks regularly to manage storage
4. **Monitor Redis Usage**: Ensure Redis has adequate memory
5. **Document Limits**: Inform users about rate limits in API documentation

## Troubleshooting

### Common Issues

**Issue**: Rate limits not being enforced
- Check Redis connection is working
- Verify limiter is properly initialized in main.py
- Check SlowAPI dependency is installed

**Issue**: Violations not appearing in dashboard
- Ensure Celery worker is running
- Check `persist_rate_limit_violations` task is scheduled
- Verify database migrations are applied

**Issue**: Headers not appearing in responses
- Verify RateLimitHeadersMiddleware is registered in main.py
- Check middleware order (should be before other middlewares)

## Future Enhancements

Potential improvements to consider:

1. **Dynamic Rate Limits**: Adjust limits based on system load
2. **Whitelist/Blacklist**: Allow/block specific IPs or users
3. **Rate Limit Quotas**: Monthly or daily quotas in addition to per-minute limits
4. **Custom Limits per Endpoint**: Different limits for expensive operations
5. **Rate Limit Increase Requests**: Allow users to request temporary limit increases
6. **Burst Allowance**: Allow brief bursts above the limit
7. **GraphQL Support**: Special handling for GraphQL queries
8. **Real-time Notifications**: Alert users when approaching limits
