# Super Admin Impersonation & Debugging - Quick Reference

## Quick Start

### Impersonate a User
```bash
POST /api/v1/super-admin/impersonate
{
  "user_id": 123,
  "reason": "Troubleshooting issue",
  "duration_minutes": 60
}
```

### End Impersonation
```bash
POST /api/v1/super-admin/end-impersonation
{
  "impersonation_log_id": 456
}
```

### View Activity Logs
```bash
GET /api/v1/super-admin/activity-logs?user_id=123&has_errors=true
```

### Execute SQL Query
```bash
POST /api/v1/super-admin/execute-sql
{
  "query": "SELECT * FROM users WHERE id = 123",
  "limit": 10
}
```

## Common Tasks

### Task 1: Investigate User Login Issue
1. Check activity logs for errors:
   ```
   GET /activity-logs?user_id=123&has_errors=true&activity_type=login
   ```
2. Review session replays if errors found:
   ```
   GET /session-replays?user_id=123&has_errors=true
   ```
3. Impersonate user to reproduce:
   ```
   POST /impersonate {"user_id": 123, "reason": "Login issue investigation"}
   ```

### Task 2: Access Institution Admin Panel
```bash
GET /super-admin/institutions/5/access-admin-panel
```
Returns a 2-hour access token for the institution's admin panel.

### Task 3: Find Slow API Endpoints
```sql
SELECT endpoint, AVG(duration_ms) as avg_duration, COUNT(*) as count
FROM activity_logs
WHERE created_at >= NOW() - INTERVAL '1 day'
GROUP BY endpoint
HAVING AVG(duration_ms) > 1000
ORDER BY avg_duration DESC
LIMIT 20
```

### Task 4: Review Impersonation History
```bash
GET /super-admin/impersonation-logs?page=1&page_size=20
```

## Frontend Integration

### Add Impersonation Toolbar
```tsx
import { ImpersonationToolbar } from '@/components/admin';

function Layout({ children }) {
  return (
    <>
      <ImpersonationToolbar />
      {children}
    </>
  );
}
```

### Check If Currently Impersonating
```tsx
const checkImpersonation = (token: string) => {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.is_impersonated === true;
};
```

## Database Queries

### Find Most Impersonated Users
```sql
SELECT 
  u.id, 
  u.email, 
  COUNT(*) as impersonation_count
FROM impersonation_logs il
JOIN users u ON il.impersonated_user_id = u.id
GROUP BY u.id, u.email
ORDER BY impersonation_count DESC
LIMIT 10;
```

### Find Active Impersonation Sessions
```sql
SELECT 
  il.id,
  sa.email as super_admin,
  iu.email as impersonated_user,
  il.started_at,
  il.reason
FROM impersonation_logs il
JOIN users sa ON il.super_admin_id = sa.id
JOIN users iu ON il.impersonated_user_id = iu.id
WHERE il.is_active = true;
```

### Find Sessions with Errors
```sql
SELECT 
  sr.id,
  sr.session_id,
  u.email,
  sr.error_count,
  sr.started_at
FROM session_replays sr
JOIN users u ON sr.user_id = u.id
WHERE sr.error_count > 0
ORDER BY sr.error_count DESC, sr.started_at DESC
LIMIT 20;
```

### Find User's Recent Activity
```sql
SELECT 
  activity_type,
  endpoint,
  status_code,
  error_message,
  created_at
FROM activity_logs
WHERE user_id = 123
ORDER BY created_at DESC
LIMIT 50;
```

## Security Checklist

- [ ] Always provide a clear reason for impersonation
- [ ] Use minimum necessary duration
- [ ] End impersonation explicitly when done
- [ ] Review impersonation logs regularly
- [ ] Monitor for unusual patterns
- [ ] Never share impersonation tokens
- [ ] Document troubleshooting actions
- [ ] Follow data privacy guidelines

## Troubleshooting

### Issue: Impersonation Token Not Working
**Solution:**
1. Check token expiration
2. Verify user is active
3. Confirm institution is active
4. Check impersonation log status

### Issue: SQL Query Blocked
**Solution:**
- Ensure query starts with SELECT
- Remove INSERT, UPDATE, DELETE keywords
- Check for other blocked keywords
- Verify query syntax

### Issue: Activity Logs Not Showing
**Solution:**
1. Check date range filters
2. Verify user ID is correct
3. Confirm activity_category matches
4. Check pagination parameters

### Issue: Session Replay Empty
**Solution:**
1. Verify frontend is recording events
2. Check session_id matches
3. Confirm user_id is set
4. Verify events array is populated

## API Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid token) |
| 403 | Forbidden (not super admin) |
| 404 | Not Found (user/resource missing) |
| 500 | Internal Server Error |

## Important Limits

| Item | Limit |
|------|-------|
| Impersonation duration | 8 hours max |
| SQL query rows | 1000 max |
| Activity logs per page | 100 max |
| Session replay events | No limit |
| Impersonation reason length | 500 chars |

## Keyboard Shortcuts (Frontend)

| Action | Shortcut |
|--------|----------|
| Collapse toolbar | Click arrow icon |
| Exit impersonation | Click "Exit" button |
| View timeline | Click timeline icon |

## Best Practices

1. **Documentation**: Always document why you're impersonating
2. **Time Limits**: Use shortest duration needed
3. **Privacy**: Respect user privacy, access only necessary data
4. **Cleanup**: End sessions explicitly
5. **Review**: Regularly audit impersonation logs
6. **Communication**: Inform users when appropriate
7. **Security**: Protect tokens and credentials
8. **Testing**: Test in staging first when possible

## Migration Commands

```bash
# Apply migration
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Check current revision
alembic current

# View migration history
alembic history
```

## Monitoring Queries

### Daily Impersonation Count
```sql
SELECT 
  DATE(started_at) as date,
  COUNT(*) as count
FROM impersonation_logs
WHERE started_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;
```

### Average Session Duration
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (ended_at - started_at))/60) as avg_minutes
FROM impersonation_logs
WHERE ended_at IS NOT NULL;
```

### Error Rate by Endpoint
```sql
SELECT 
  endpoint,
  COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END)::float / COUNT(*) * 100 as error_rate,
  COUNT(*) as total_calls
FROM activity_logs
WHERE created_at >= NOW() - INTERVAL '1 day'
GROUP BY endpoint
HAVING COUNT(*) > 10
ORDER BY error_rate DESC;
```

## Contact & Support

For issues with impersonation tools:
1. Check this quick reference
2. Review full documentation (SUPER_ADMIN_IMPERSONATION_DEBUGGING.md)
3. Check implementation details (SUPER_ADMIN_IMPERSONATION_IMPLEMENTATION.md)
4. Contact platform engineering team
