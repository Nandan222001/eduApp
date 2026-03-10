# Authentication & Authorization System

## Overview

This authentication and authorization system provides JWT-based authentication with refresh tokens, bcrypt password hashing, role-based access control (RBAC), multi-tenant request context, and Redis-based session management.

## Features

- JWT-based authentication with access and refresh tokens
- Password hashing using bcrypt
- Role-Based Access Control (RBAC)
- Multi-tenant architecture with institution isolation
- Session management with Redis
- Password reset functionality
- Row-level security (RLS) policies
- Audit logging

## Authentication Endpoints

### POST /api/v1/auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "institution_id": 1  // Optional: specify institution
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### POST /api/v1/auth/refresh

Refresh an expired access token.

**Request Body:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### POST /api/v1/auth/logout

Logout and invalidate current session.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body (Optional):**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

### POST /api/v1/auth/logout-all

Logout from all sessions.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "message": "Successfully logged out from all sessions"
}
```

### POST /api/v1/auth/forgot-password

Request a password reset token.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

### POST /api/v1/auth/reset-password

Reset password using the reset token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "new_password": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully"
}
```

### POST /api/v1/auth/change-password

Change password for authenticated user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "current_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password has been changed successfully"
}
```

### GET /api/v1/auth/me

Get current user information.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "institution_id": 1,
  "role_id": 2,
  "is_active": true,
  "is_superuser": false,
  "email_verified": true,
  "permissions": ["users:read", "users:create"],
  "role": {
    "id": 2,
    "name": "Manager",
    "slug": "manager"
  },
  "institution": {
    "id": 1,
    "name": "ACME Corp",
    "slug": "acme-corp"
  }
}
```

## Authorization

### Using Dependencies

#### Require Authentication

```python
from fastapi import APIRouter, Depends
from src.dependencies.auth import get_current_user
from src.models.user import User

router = APIRouter()

@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    return {"message": f"Hello {current_user.email}"}
```

#### Require Specific Permissions

```python
from src.dependencies.rbac import require_permissions

@router.post(
    "/users",
    dependencies=[Depends(require_permissions(["users:create"]))]
)
async def create_user(current_user: User = Depends(get_current_user)):
    # Only users with "users:create" permission can access
    pass
```

#### Require Any of Multiple Permissions

```python
from src.dependencies.rbac import require_any_permission

@router.get(
    "/dashboard",
    dependencies=[Depends(require_any_permission(["dashboard:view", "admin:access"]))]
)
async def view_dashboard():
    pass
```

#### Require Specific Role

```python
from src.dependencies.rbac import require_role

@router.post(
    "/admin-action",
    dependencies=[Depends(require_role(["admin", "super-admin"]))]
)
async def admin_action():
    pass
```

#### Require Superuser

```python
from src.dependencies.auth import get_current_superuser

@router.delete("/system-config")
async def delete_config(current_user: User = Depends(get_current_superuser)):
    # Only superusers can access
    pass
```

### Manual Permission Checking

```python
from src.utils.rbac import has_permission, check_permission

# Check if user has a specific permission
if has_permission(user, "users:delete"):
    # Allow deletion
    pass

# Alternative check
if check_permission(user, "users:delete"):
    # Allow deletion
    pass
```

### Request Context

The system automatically sets request context for authenticated requests:

```python
from src.utils.context import get_request_context

context = get_request_context()
if context:
    print(f"User ID: {context.user_id}")
    print(f"Institution ID: {context.institution_id}")
    print(f"Permissions: {context.permissions}")
    print(f"Is Superuser: {context.is_superuser}")
```

## Multi-Tenant Support

The system includes automatic tenant isolation:

1. **Request Context Middleware**: Automatically sets the tenant context on each request
2. **Row-Level Security**: Database policies ensure data isolation between institutions
3. **Automatic Filtering**: Queries are automatically filtered by institution_id

### Setting RLS Context

```python
from src.database import get_db, set_rls_context

db = next(get_db())
set_rls_context(
    db,
    institution_id=1,
    user_id=5,
    bypass_rls=False  # Set to True for superusers
)
```

## Session Management

Sessions are stored in Redis with configurable expiration:

```python
from src.utils.session import SessionManager
from src.redis_client import get_redis

redis = await get_redis()
session_manager = SessionManager(redis)

# Create session
await session_manager.create_session(user_id, session_data, access_token)

# Get session
session = await session_manager.get_session(user_id, access_token)

# Delete session
await session_manager.delete_session(user_id, access_token)

# Delete all user sessions
await session_manager.delete_all_user_sessions(user_id)
```

## Configuration

Set these environment variables in `.env`:

```env
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
RESET_PASSWORD_TOKEN_EXPIRE_MINUTES=60
```

## Security Best Practices

1. **Never log tokens**: Tokens should never appear in logs
2. **Use HTTPS**: Always use HTTPS in production
3. **Rotate secrets**: Regularly rotate SECRET_KEY
4. **Strong passwords**: Enforce strong password policies
5. **Rate limiting**: Implement rate limiting on auth endpoints
6. **Token expiration**: Keep access token expiration short
7. **Refresh token rotation**: Always issue new refresh tokens

## Permission Format

Permissions follow the format: `{resource}:{action}`

Examples:
- `users:read`
- `users:create`
- `users:update`
- `users:delete`
- `roles:manage`
- `reports:view`
- `settings:update`

## Role Management

Roles can be:
- **System roles**: Global roles (e.g., super-admin)
- **Institution roles**: Specific to an institution

System roles have `is_system_role=True` and `institution_id=NULL`.

## Example: Protected Endpoint with RBAC

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.dependencies.auth import get_current_user
from src.dependencies.rbac import require_permissions
from src.models.user import User
from src.utils.rbac import verify_institution_access

router = APIRouter()

@router.get(
    "/users/{user_id}",
    dependencies=[Depends(require_permissions(["users:read"]))]
)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check institution access
    if not verify_institution_access(current_user, user.institution_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return user
```

## Troubleshooting

### Token Issues

- **401 Unauthorized**: Token is invalid, expired, or missing
- **403 Forbidden**: User lacks required permissions
- Check token expiration settings
- Verify SECRET_KEY matches across environments

### Session Issues

- Ensure Redis is running and accessible
- Check Redis connection settings in `.env`
- Verify session expiration settings

### Permission Issues

- Verify user has correct role assigned
- Check role has necessary permissions in database
- Superusers bypass all permission checks
