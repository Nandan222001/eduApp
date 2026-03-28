# API Examples

This document provides example API requests and responses for testing the authentication system.

## Base URL

```
http://localhost:8000
```

## Authentication Flow

### 1. Login

**Request:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "adminpassword123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Response (401 Unauthorized):**
```json
{
  "detail": "Incorrect email or password"
}
```

### 2. Get Current User Info

**Request:**
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "admin@example.com",
  "username": "admin",
  "first_name": "Admin",
  "last_name": "User",
  "phone": null,
  "institution_id": 1,
  "role_id": 1,
  "is_active": true,
  "is_superuser": true,
  "email_verified": true,
  "last_login": "2024-01-15T10:30:00Z",
  "permissions": [
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "roles:read",
    "roles:create"
  ],
  "role": {
    "id": 1,
    "name": "Super Admin",
    "slug": "super_admin"
  },
  "institution": {
    "id": 1,
    "name": "ACME Corporation",
    "slug": "acme-corp"
  }
}
```

### 3. Refresh Token

**Request:**
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 4. Logout

**Request:**
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

### 5. Logout from All Sessions

**Request:**
```http
POST /api/v1/auth/logout-all
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Successfully logged out from all sessions"
}
```

### 6. Forgot Password

**Request:**
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

### 7. Reset Password

**Request:**
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "new_password": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been reset successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "detail": "Invalid or expired reset token"
}
```

### 8. Change Password

**Request:**
```http
POST /api/v1/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "current_password": "OldPassword123",
  "new_password": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been changed successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "detail": "Current password is incorrect"
}
```

## User Management

### 1. List Users

**Request:**
```http
GET /api/v1/users?skip=0&limit=10
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "email": "user1@example.com",
    "username": "user1",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "institution_id": 1,
    "role_id": 2,
    "is_active": true,
    "is_superuser": false,
    "email_verified": true,
    "last_login": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

**Response (403 Forbidden):**
```json
{
  "detail": "Missing required permission: users:read"
}
```

### 2. Get User by ID

**Request:**
```http
GET /api/v1/users/1
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "institution_id": 1,
  "role_id": 2,
  "is_active": true,
  "is_superuser": false,
  "email_verified": true,
  "last_login": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 3. Create User

**Request:**
```http
POST /api/v1/users
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "SecurePassword123!",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",
  "institution_id": 1,
  "role_id": 4,
  "is_active": true,
  "is_superuser": false
}
```

**Response (201 Created):**
```json
{
  "id": 5,
  "email": "newuser@example.com",
  "username": "newuser",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",
  "institution_id": 1,
  "role_id": 4,
  "is_active": true,
  "is_superuser": false,
  "email_verified": false,
  "last_login": null,
  "created_at": "2024-01-15T12:00:00Z",
  "updated_at": "2024-01-15T12:00:00Z"
}
```

**Response (400 Bad Request):**
```json
{
  "detail": "Email already registered in this institution"
}
```

### 4. Update User

**Request:**
```http
PUT /api/v1/users/5
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "Janet",
  "phone": "+0987654321",
  "is_active": true
}
```

**Response (200 OK):**
```json
{
  "id": 5,
  "email": "newuser@example.com",
  "username": "newuser",
  "first_name": "Janet",
  "last_name": "Smith",
  "phone": "+0987654321",
  "institution_id": 1,
  "role_id": 4,
  "is_active": true,
  "is_superuser": false,
  "email_verified": false,
  "last_login": null,
  "created_at": "2024-01-15T12:00:00Z",
  "updated_at": "2024-01-15T12:30:00Z"
}
```

### 5. Delete User

**Request:**
```http
DELETE /api/v1/users/5
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

**Response (400 Bad Request):**
```json
{
  "detail": "Cannot delete your own account"
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Missing required permission: users:create"
}
```

### 404 Not Found
```json
{
  "detail": "User not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "adminpassword123"
  }'
```

### Get User Info
```bash
TOKEN="your_access_token_here"
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Create User
```bash
TOKEN="your_access_token_here"
curl -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "SecurePassword123!",
    "first_name": "Jane",
    "last_name": "Smith",
    "institution_id": 1,
    "role_id": 4,
    "is_active": true,
    "is_superuser": false
  }'
```

## Postman Collection

You can import this collection into Postman:

1. Create a new collection named "FastAPI Auth System"
2. Add environment variables:
   - `base_url`: http://localhost:8000
   - `access_token`: (will be set automatically)
   - `refresh_token`: (will be set automatically)

3. Add requests as shown above
4. For login endpoint, add a test script to save tokens:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.access_token);
    pm.environment.set("refresh_token", response.refresh_token);
}
```

5. For authenticated requests, use `{{access_token}}` in the Authorization header
