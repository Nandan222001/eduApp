# Authentication & Authorization Architecture

## Overview

This document describes the architecture of the authentication and authorization system implemented in this FastAPI application.

## System Components

### 1. Authentication Layer

#### JWT Token System
- **Access Tokens**: Short-lived tokens (30 minutes default) for API access
- **Refresh Tokens**: Long-lived tokens (7 days default) for obtaining new access tokens
- **Token Payload**: Contains user ID, institution ID, role ID, email, and token type
- **Algorithm**: HS256 (configurable)

#### Password Security
- **Hashing**: bcrypt with automatic salt generation
- **Minimum Length**: 8 characters (configurable in schemas)
- **Storage**: Only hashed passwords stored in database
- **Verification**: Constant-time comparison to prevent timing attacks

#### Password Reset Flow
1. User requests reset via email
2. System generates unique token with expiration (60 minutes default)
3. Token stored in database with `is_used` flag
4. User submits token with new password
5. Token marked as used, all sessions invalidated
6. Previous tokens become invalid after use

### 2. Authorization Layer

#### Role-Based Access Control (RBAC)
```
User → Role → Permissions → Resources:Actions
```

**Roles:**
- System roles: Global across all institutions (`is_system_role=True`)
- Institution roles: Specific to an institution (`institution_id` set)
- Active/Inactive flag for role management

**Permissions:**
- Format: `resource:action` (e.g., `users:create`)
- Granular control over resources
- Many-to-many relationship with roles

**Permission Checking:**
1. Check if user is superuser (bypass all checks)
2. Load user's role and associated permissions
3. Verify required permission exists in user's permission set
4. Grant or deny access

### 3. Multi-Tenant Architecture

#### Institution Isolation
- Each user belongs to one institution
- Database queries filtered by institution_id
- Row-Level Security (RLS) policies enforce isolation at database level

#### Request Context
```python
RequestContext:
  - user_id: int
  - institution_id: int
  - role_id: int
  - email: str
  - is_superuser: bool
  - permissions: List[str]
```

Stored in context variables, accessible throughout request lifecycle.

#### Row-Level Security
PostgreSQL RLS policies automatically filter queries:
```sql
CREATE POLICY users_isolation_policy ON users
USING (
    institution_id = current_setting('app.current_institution_id')::integer
    OR current_setting('app.bypass_rls')::boolean = true
);
```

Superusers can bypass RLS with `bypass_rls=True`.

### 4. Session Management

#### Redis-Based Sessions
- **Session Key Format**: `session:{user_id}:{access_token}`
- **Refresh Token Key**: `refresh:{user_id}:{refresh_token}`
- **TTL**: Matches token expiration times
- **Session Data**: User context, permissions, metadata

#### Session Operations
- Create: Store session data on login
- Validate: Check session exists on each authenticated request
- Revoke: Delete session on logout
- Cleanup: Sessions auto-expire via Redis TTL

### 5. Middleware

#### TenantContextMiddleware
Automatically executed on every request:
1. Extract JWT token from Authorization header
2. Decode and validate token
3. Verify session exists in Redis
4. Load user from database
5. Set request context with user info and permissions
6. Set RLS context for database queries
7. Clear context after request completes

#### Order of Execution
```
Request → TenantContextMiddleware → Route → Dependencies → Handler
```

### 6. Dependencies

#### Authentication Dependencies
- `get_current_user`: Require valid authentication
- `get_current_active_user`: Require active user
- `get_current_superuser`: Require superuser status
- `get_optional_current_user`: Optional authentication

#### Authorization Dependencies
- `require_permissions([perms])`: Require specific permissions
- `require_any_permission([perms])`: Require any of multiple permissions
- `require_role([roles])`: Require specific role
- `require_institution_access()`: Verify institution access

## Request Flow

### 1. Login Flow
```
User submits credentials
    ↓
AuthService.login()
    ↓
Authenticate user (verify password)
    ↓
Check user & institution active status
    ↓
Generate access & refresh tokens
    ↓
Create session in Redis
    ↓
Update last_login timestamp
    ↓
Return tokens to user
```

### 2. Protected Endpoint Flow
```
Request with Authorization header
    ↓
TenantContextMiddleware
    ↓
Extract & decode token
    ↓
Verify session in Redis
    ↓
Load user from database
    ↓
Set request context
    ↓
get_current_user dependency
    ↓
Permission check (if required)
    ↓
Execute endpoint handler
    ↓
Return response
```

### 3. Token Refresh Flow
```
User submits refresh token
    ↓
AuthService.refresh_access_token()
    ↓
Decode & validate refresh token
    ↓
Verify token exists in Redis
    ↓
Load user from database
    ↓
Generate new access & refresh tokens
    ↓
Create new session
    ↓
Revoke old refresh token
    ↓
Return new tokens
```

## Security Features

### 1. Token Security
- Short-lived access tokens minimize exposure window
- Refresh token rotation prevents reuse attacks
- Token type validation prevents token confusion
- Tokens stored in Redis with automatic expiration

### 2. Session Security
- Session validation on every request
- Ability to revoke single session or all sessions
- Session data includes creation timestamp
- Automatic cleanup via Redis TTL

### 3. Password Security
- bcrypt with automatic salting
- Secure password reset with single-use tokens
- All sessions invalidated on password change
- Timing-safe password verification

### 4. Multi-Tenant Security
- Database-level isolation via RLS policies
- Application-level filtering by institution_id
- Superuser bypass only when explicitly enabled
- Audit logging tracks all changes

### 5. API Security
- HTTPS enforcement in production (recommended)
- Bearer token authentication
- Token extraction from Authorization header only
- No tokens in URLs or query parameters

## Database Schema

### Core Tables
```
institutions
├── users (FK: institution_id, role_id)
├── roles (FK: institution_id, nullable for system roles)
├── subscriptions (FK: institution_id)
└── audit_logs (FK: institution_id, user_id)

permissions (standalone)

role_permissions (junction table)
├── role_id → roles
└── permission_id → permissions

password_reset_tokens
└── user_id → users
```

### Indexes
- Composite unique indexes on email/username per institution
- Indexes on foreign keys for join performance
- Indexes on commonly filtered columns (is_active, etc.)
- Indexes on audit log created_at for time-based queries

### Triggers
- Automatic audit logging on INSERT, UPDATE, DELETE
- Timestamp updates on modification
- Cascade deletes where appropriate

## Configuration

### Environment Variables
```env
# JWT Settings
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
RESET_PASSWORD_TOKEN_EXPIRE_MINUTES=60

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Redis
REDIS_URL=redis://host:port/db
```

### Security Best Practices
1. **Strong SECRET_KEY**: Use cryptographically secure random key
2. **HTTPS Only**: Enforce HTTPS in production
3. **Token Expiration**: Keep access tokens short-lived
4. **Rate Limiting**: Implement rate limiting on auth endpoints
5. **Monitoring**: Log authentication failures and anomalies
6. **Secrets Management**: Use environment variables, never commit secrets

## Performance Considerations

### 1. Session Storage
- Redis provides fast in-memory session lookup
- TTL-based expiration prevents manual cleanup
- Scan operations for batch deletion use pagination

### 2. Permission Caching
- Permissions loaded once per request and stored in context
- Avoid repeated database queries during request
- Permission lists stored in session data

### 3. Database Queries
- Eager loading of relationships (role, permissions, institution)
- Indexed columns for fast lookups
- Connection pooling for concurrent requests

### 4. Token Operations
- JWT encoding/decoding is CPU-bound but fast
- bcrypt work factor balanced for security and performance
- Minimal token payload size

## Extensibility

### Adding New Permissions
1. Insert permission into database
2. Assign to appropriate roles
3. Use in endpoint decorators or manual checks

### Custom Authentication
- Implement additional auth methods (OAuth, SAML)
- Extend `AuthService` with new methods
- Create custom dependencies for new auth types

### Additional Context
- Extend `RequestContext` model
- Add fields to session data
- Access via `get_request_context()`

### Custom Middleware
- Add additional middleware for logging, metrics, etc.
- Ensure proper ordering with TenantContextMiddleware
- Access request context in middleware

## Testing Strategy

### Unit Tests
- Test individual functions (password hashing, token creation)
- Mock external dependencies (database, Redis)
- Test edge cases and error conditions

### Integration Tests
- Test full authentication flow
- Test permission checks
- Test session management
- Use in-memory SQLite and mock Redis

### Security Tests
- Test token tampering
- Test expired tokens
- Test invalid credentials
- Test permission bypass attempts
- Test RLS policy enforcement

## Monitoring & Logging

### Key Metrics
- Failed login attempts
- Token generation rate
- Session count per user
- Permission denial count
- Password reset requests

### Audit Logging
- All user/role/permission changes logged
- Includes old and new values
- Tracks user and institution context
- Immutable audit trail

### Alert Conditions
- Unusual failed login patterns
- Mass permission changes
- Suspicious session patterns
- RLS policy violations

## Future Enhancements

### Potential Additions
1. **OAuth2 Integration**: Support external identity providers
2. **2FA/MFA**: Multi-factor authentication
3. **API Keys**: Alternative authentication for services
4. **Fine-grained Permissions**: Resource-level permissions
5. **Permission Delegation**: Temporary permission grants
6. **Session Limits**: Max concurrent sessions per user
7. **IP Whitelisting**: Restrict access by IP
8. **Device Tracking**: Track and manage user devices
