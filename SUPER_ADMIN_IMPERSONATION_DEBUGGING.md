# Super Admin Impersonation & Debugging Tools

## Overview

This document describes the comprehensive impersonation and debugging tools available to super administrators for troubleshooting user issues, investigating problems, and ensuring platform security.

## Features

### 1. User Impersonation

Super administrators can impersonate any user in the system to:
- View the system from the user's perspective
- Troubleshoot user-reported issues
- Test features in real user contexts
- Verify permissions and access controls

#### Impersonation Endpoint

**POST** `/api/v1/super-admin/impersonate`

Request:
```json
{
  "user_id": 123,
  "reason": "Investigating reported issue with assignment submission",
  "duration_minutes": 60
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": 123,
  "user_email": "user@example.com",
  "user_name": "John Doe",
  "institution_id": 5,
  "institution_name": "Example School",
  "role": "student",
  "expires_at": "2024-01-15T15:30:00Z",
  "impersonation_log_id": 456
}
```

#### Security Features

- **Audit Logging**: All impersonation sessions are logged with:
  - Super admin identity
  - Impersonated user
  - Reason for impersonation
  - Start/end timestamps
  - IP address and user agent
  - Actions performed during session

- **Time Limits**: Sessions are limited to 8 hours maximum
- **Visual Indicators**: Prominent toolbar shows impersonation status
- **Session Tracking**: All actions during impersonation are tracked

### 2. Institution Admin Panel Access

Super admins can access any institution's admin panel without impersonating a specific user.

**GET** `/api/v1/super-admin/institutions/{institution_id}/access-admin-panel`

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "institution_id": 5,
  "institution_name": "Example School",
  "admin_user_id": 789,
  "admin_email": "admin@example.com",
  "expires_at": "2024-01-15T17:30:00Z"
}
```

### 3. Activity Log Viewer

View comprehensive activity logs for troubleshooting.

**GET** `/api/v1/super-admin/activity-logs`

Query Parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 50, max: 100)
- `user_id`: Filter by user ID
- `institution_id`: Filter by institution
- `activity_category`: Filter by category (api_call, user_action, system_event, error)
- `activity_type`: Filter by specific type
- `start_date`: Filter from date
- `end_date`: Filter to date
- `has_errors`: Filter for errors only (true/false)

Response:
```json
{
  "items": [
    {
      "id": 1,
      "user_id": 123,
      "user_email": "user@example.com",
      "institution_id": 5,
      "activity_type": "assignment_submit",
      "activity_category": "user_action",
      "endpoint": "/api/v1/assignments/5/submit",
      "method": "POST",
      "status_code": 200,
      "description": "User submitted assignment",
      "error_message": null,
      "ip_address": "192.168.1.1",
      "duration_ms": 245,
      "created_at": "2024-01-15T14:30:00Z"
    }
  ],
  "total": 1500,
  "page": 1,
  "page_size": 50,
  "total_pages": 30
}
```

### 4. Session Replay

Record and replay user sessions for bug reproduction.

#### Recording Sessions

**POST** `/api/v1/super-admin/session-replays/record`

Request:
```json
{
  "session_id": "sess_abc123",
  "events": [
    {
      "type": "page_view",
      "timestamp": "2024-01-15T14:30:00Z",
      "data": {
        "path": "/dashboard",
        "title": "Dashboard"
      }
    },
    {
      "type": "click",
      "timestamp": "2024-01-15T14:30:05Z",
      "data": {
        "element": "button#submit-assignment",
        "x": 150,
        "y": 300
      }
    },
    {
      "type": "error",
      "timestamp": "2024-01-15T14:30:10Z",
      "data": {
        "message": "Network error",
        "stack": "Error: Network error\n  at..."
      }
    }
  ],
  "metadata": {
    "browser": "Chrome 120",
    "screen_resolution": "1920x1080",
    "device_type": "desktop"
  },
  "started_at": "2024-01-15T14:30:00Z",
  "ended_at": "2024-01-15T14:35:00Z"
}
```

#### Viewing Replays

**GET** `/api/v1/super-admin/session-replays`

Query Parameters:
- `page`, `page_size`: Pagination
- `user_id`: Filter by user
- `institution_id`: Filter by institution
- `start_date`, `end_date`: Date range
- `has_errors`: Filter sessions with errors

**GET** `/api/v1/super-admin/session-replays/{replay_id}`

Returns full session replay with all events.

### 5. SQL Query Execution

Execute read-only SQL queries for data investigation.

**POST** `/api/v1/super-admin/execute-sql`

Request:
```json
{
  "query": "SELECT * FROM users WHERE institution_id = 5 ORDER BY created_at DESC",
  "limit": 100
}
```

Response:
```json
{
  "columns": ["id", "email", "first_name", "last_name", "created_at"],
  "rows": [
    [123, "user@example.com", "John", "Doe", "2024-01-15T10:00:00Z"],
    [124, "jane@example.com", "Jane", "Smith", "2024-01-14T15:30:00Z"]
  ],
  "row_count": 2,
  "execution_time_ms": 45.23,
  "query": "SELECT * FROM users WHERE institution_id = 5 ORDER BY created_at DESC LIMIT 100"
}
```

#### Security

- Only SELECT queries allowed
- Dangerous keywords blocked (INSERT, UPDATE, DELETE, DROP, etc.)
- Automatic LIMIT applied if not specified
- Maximum 1000 rows returned

### 6. Impersonation Logs

View history of all impersonation sessions.

**GET** `/api/v1/super-admin/impersonation-logs`

Query Parameters:
- `page`, `page_size`: Pagination
- `user_id`: Filter by super admin or impersonated user
- `institution_id`: Filter by institution
- `is_active`: Filter active sessions

Response:
```json
{
  "items": [
    {
      "id": 456,
      "super_admin_id": 1,
      "super_admin_email": "superadmin@platform.com",
      "impersonated_user_id": 123,
      "impersonated_user_email": "user@example.com",
      "institution_id": 5,
      "institution_name": "Example School",
      "reason": "Investigating reported issue",
      "started_at": "2024-01-15T14:00:00Z",
      "ended_at": "2024-01-15T14:30:00Z",
      "is_active": false,
      "duration_minutes": 30
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 20,
  "total_pages": 8
}
```

### 7. End Impersonation

**POST** `/api/v1/super-admin/end-impersonation`

Request:
```json
{
  "impersonation_log_id": 456
}
```

Response:
```json
{
  "message": "Impersonation ended successfully",
  "duration_minutes": 30
}
```

## Frontend Component: ImpersonationToolbar

### Features

- **Prominent Visual Indicator**: Fixed top bar with gradient background and pulsing warning
- **User Information**: Shows impersonated user name, email, institution
- **Time Tracking**: Live countdown of remaining session time
- **Quick Actions**:
  - View activity timeline
  - Exit impersonation
  - Expand/collapse detailed view
- **Activity Timeline**: Real-time view of user's recent actions
- **Confirmation Dialog**: Prevents accidental exits

### Integration

Add to your main layout component:

```tsx
import ImpersonationToolbar from '@/components/admin/ImpersonationToolbar';

function Layout({ children }) {
  return (
    <>
      <ImpersonationToolbar />
      {/* Rest of your layout */}
      {children}
    </>
  );
}
```

### Styling

The toolbar automatically:
- Positions at top of viewport (z-index: 9999)
- Adds appropriate spacing below (60px collapsed, 180px expanded)
- Uses gradient purple background for high visibility
- Includes pulsing animation on warning badge

## Database Schema

### impersonation_logs

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| super_admin_id | Integer | Super admin user ID |
| impersonated_user_id | Integer | Impersonated user ID |
| institution_id | Integer | Institution ID |
| reason | Text | Reason for impersonation |
| started_at | DateTime | Session start time |
| ended_at | DateTime | Session end time |
| ip_address | String(45) | IP address |
| user_agent | Text | User agent string |
| actions_performed | JSONB | Actions during session |
| is_active | Boolean | Session active status |

### activity_logs

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| institution_id | Integer | Institution ID |
| user_id | Integer | User ID |
| activity_type | String(100) | Type of activity |
| activity_category | String(50) | Category |
| endpoint | String(255) | API endpoint |
| method | String(10) | HTTP method |
| status_code | Integer | Response status |
| description | Text | Activity description |
| request_data | JSONB | Request payload |
| response_data | JSONB | Response data |
| error_message | Text | Error message if any |
| ip_address | String(45) | IP address |
| user_agent | Text | User agent |
| duration_ms | Integer | Duration in milliseconds |
| created_at | DateTime | Timestamp |

### session_replays

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| session_id | String(255) | Unique session ID |
| user_id | Integer | User ID |
| institution_id | Integer | Institution ID |
| events | JSONB | Session events array |
| metadata | JSONB | Additional metadata |
| started_at | DateTime | Session start |
| ended_at | DateTime | Session end |
| duration_seconds | Integer | Duration |
| page_count | Integer | Pages visited |
| interaction_count | Integer | Interactions |
| error_count | Integer | Errors encountered |
| ip_address | String(45) | IP address |
| user_agent | Text | User agent |
| created_at | DateTime | Record creation time |

## Usage Examples

### Example 1: Troubleshoot Login Issue

```python
# 1. Impersonate user
response = requests.post(
    'https://api.platform.com/v1/super-admin/impersonate',
    headers={'Authorization': 'Bearer <super_admin_token>'},
    json={
        'user_id': 123,
        'reason': 'User reports unable to login',
        'duration_minutes': 30
    }
)
impersonation_token = response.json()['access_token']

# 2. Use token to test login flow
# ...

# 3. Check activity logs
logs = requests.get(
    'https://api.platform.com/v1/super-admin/activity-logs',
    headers={'Authorization': 'Bearer <super_admin_token>'},
    params={
        'user_id': 123,
        'has_errors': True,
        'activity_type': 'login_attempt'
    }
)

# 4. End impersonation
requests.post(
    'https://api.platform.com/v1/super-admin/end-impersonation',
    headers={'Authorization': 'Bearer <super_admin_token>'},
    json={'impersonation_log_id': response.json()['impersonation_log_id']}
)
```

### Example 2: Investigate Performance Issue

```python
# Query slow queries
result = requests.post(
    'https://api.platform.com/v1/super-admin/execute-sql',
    headers={'Authorization': 'Bearer <super_admin_token>'},
    json={
        'query': '''
            SELECT endpoint, AVG(duration_ms) as avg_duration, COUNT(*) as count
            FROM activity_logs
            WHERE created_at >= NOW() - INTERVAL '1 day'
            GROUP BY endpoint
            HAVING AVG(duration_ms) > 1000
            ORDER BY avg_duration DESC
        ''',
        'limit': 50
    }
)
```

## Security Considerations

1. **Role-Based Access**: Only users with `is_superuser=True` can access these endpoints
2. **Audit Trail**: All actions are logged and immutable
3. **Time Limits**: Impersonation sessions automatically expire
4. **Read-Only SQL**: Write operations are blocked
5. **IP Tracking**: All requests tracked by IP address
6. **Reason Required**: Impersonation requires documented reason

## Best Practices

1. **Always Document**: Provide clear reasons for impersonation
2. **Minimize Duration**: Use shortest necessary time window
3. **Review Logs**: Regularly audit impersonation logs
4. **End Sessions**: Explicitly end sessions when done
5. **Protect Credentials**: Never share impersonation tokens
6. **Monitor Activity**: Watch for suspicious patterns

## Migration

Run the migration to create required tables:

```bash
alembic upgrade head
```

This creates:
- `impersonation_logs` table
- `activity_logs` table
- `session_replays` table
- Required indexes

## Testing

Example test cases:

```python
def test_impersonation():
    # Test successful impersonation
    # Test impersonation with invalid user
    # Test time limit enforcement
    # Test audit logging
    # Test end impersonation

def test_activity_logs():
    # Test filtering by user
    # Test filtering by date range
    # Test error filtering
    # Test pagination

def test_session_replay():
    # Test recording session
    # Test retrieving replay
    # Test error tracking

def test_sql_execution():
    # Test SELECT query
    # Test blocked keywords
    # Test automatic LIMIT
    # Test invalid SQL
```
