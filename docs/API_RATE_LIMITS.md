# API Rate Limits

All API endpoints are protected by rate limiting to ensure fair usage and protect against abuse.

## Rate Limits by User Role

| User Role          | Rate Limit   | 
|--------------------|--------------|
| Super Admin        | 1000/min     |
| Institution Admin  | 500/min      |
| Manager            | 300/min      |
| Teacher            | 200/min      |
| Staff              | 150/min      |
| Student            | 100/min      |
| Parent             | 100/min      |
| Anonymous/Guest    | 50/min       |

## Response Headers

Every API response includes rate limit information:

```
X-RateLimit-Limit: 200              # Your maximum requests per minute
X-RateLimit-Policy: 200/minute      # Rate limit policy in effect
X-RateLimit-Role: teacher           # Your role (determines limit)
X-RateLimit-Remaining: 195          # Requests remaining in current window
X-RateLimit-Reset: 1705335600       # When the limit resets (Unix timestamp)
```

## Rate Limit Exceeded Response

When you exceed your rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Your account allows up to 200 requests per minute.",
  "retry_after": 60,
  "limit": "200/minute"
}
```

The response includes a `Retry-After` header indicating how long to wait (in seconds) before making another request.

## Best Practices

### Monitor Your Usage
- Check the `X-RateLimit-Remaining` header to track your usage
- Implement logic to slow down requests as you approach the limit

### Handle Rate Limit Errors
```javascript
// Example: JavaScript/TypeScript
async function apiRequest(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check remaining requests
    const remaining = response.headers.get('X-RateLimit-Remaining');
    console.log(`Requests remaining: ${remaining}`);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.log(`Rate limited. Retry after ${retryAfter} seconds`);
      
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return apiRequest(url);
    }
    
    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

### Implement Exponential Backoff
```python
# Example: Python
import time
import requests

def api_request_with_retry(url, max_retries=3):
    for attempt in range(max_retries):
        response = requests.get(url)
        
        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 60))
            wait_time = retry_after * (2 ** attempt)  # Exponential backoff
            print(f"Rate limited. Waiting {wait_time} seconds...")
            time.sleep(wait_time)
            continue
            
        return response.json()
    
    raise Exception("Max retries exceeded")
```

### Cache Responses
Reduce API calls by caching responses locally:
- Use browser localStorage/sessionStorage for web apps
- Implement in-memory or Redis cache for server-side apps
- Set appropriate cache TTL based on data update frequency

### Batch Operations
When possible, use batch endpoints instead of making multiple individual requests:
```
✅ POST /api/v1/users/batch (single request, 5 users)
❌ POST /api/v1/users (5 separate requests)
```

## Need Higher Limits?

If you consistently need higher rate limits:

1. **Optimize Your Application**: Review your API usage patterns and implement caching
2. **Contact Support**: Reach out to your institution administrator
3. **Upgrade Role**: Users with higher roles (teachers, admins) have higher limits
4. **Review Endpoints**: Check if you're using the most efficient endpoints

## Monitoring Your Usage

### Check Your Current Limit
```bash
GET /api/v1/rate-limits/config
```

Response:
```json
{
  "your_role": "teacher",
  "your_limit": "200/minute",
  "all_limits": {...},
  "description": "Rate limits are applied per minute per user/IP"
}
```

### View Your Usage History
```bash
GET /api/v1/rate-limits/my-usage?days=7
```

Response:
```json
{
  "user_id": 123,
  "role": "teacher",
  "rate_limit": "200/minute",
  "total_violations": 5,
  "recent_violations": [...],
  "message": "Monitor your API usage to avoid rate limit violations"
}
```

## FAQ

**Q: Do rate limits reset at a specific time?**  
A: No, rate limits use a sliding window. They reset one minute after your first request in the window.

**Q: Are rate limits shared across different devices?**  
A: Yes, rate limits are per user account, not per device. All your devices share the same limit.

**Q: Do webhooks count toward rate limits?**  
A: No, incoming webhooks do not count toward your rate limit. Only outgoing API requests are counted.

**Q: What happens if I hit the rate limit?**  
A: You'll receive a 429 error response. Simply wait for the time indicated in the `Retry-After` header and try again.

**Q: Can rate limits be temporarily increased?**  
A: Contact your system administrator or institution admin for temporary limit increases during special circumstances.

## Technical Implementation

For developers interested in the implementation details:

- **Technology**: SlowAPI with Redis backend
- **Strategy**: Fixed window with automatic sliding
- **Storage**: Redis for real-time limiting, MySQL for historical data
- **Granularity**: Per minute per user/IP
- **Enforcement**: Applied via middleware at application level

For complete technical documentation, see [Rate Limiting Documentation](./RATE_LIMITING.md).
