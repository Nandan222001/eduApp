# Multi-Tenant Schema Quick Start Guide

## Setup

### 1. Install Dependencies
```bash
poetry install
```

### 2. Configure Database
Ensure your `.env` file has PostgreSQL settings:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=fastapi_db
```

### 3. Run Migrations
```bash
# Apply all migrations
alembic upgrade head

# This will create:
# - All tables (institutions, users, roles, permissions, subscriptions, audit_logs)
# - Indexes for performance
# - Row-Level Security policies
# - Audit triggers
# - Default permissions and roles
```

## Basic Usage

### Creating an Institution
```python
from src.database import get_db_with_context
from src.models import Institution

with get_db_with_context(bypass_rls=True) as db:
    institution = Institution(
        name="Acme Corporation",
        slug="acme-corp",
        domain="acme.example.com",
        is_active=True,
        max_users=100
    )
    db.add(institution)
    db.flush()
    institution_id = institution.id
```

### Creating a User
```python
from src.models import User
from src.utils.security import get_password_hash

with get_db_with_context(institution_id=institution_id, bypass_rls=False) as db:
    user = User(
        institution_id=institution_id,
        role_id=2,  # Institution Admin
        email="admin@acme.com",
        username="admin",
        hashed_password=get_password_hash("SecurePassword123"),
        first_name="John",
        last_name="Doe",
        is_active=True
    )
    db.add(user)
```

### Querying with RLS Context
```python
# Query users for specific institution
with get_db_with_context(institution_id=1, user_id=123) as db:
    users = db.query(User).all()
    # Only returns users from institution 1
```

### Checking Permissions
```python
from src.utils.rbac import has_permission, can_access_resource

# Check if user has specific permission
if has_permission(user, "users.create"):
    # User can create users
    pass

# Check resource access
if can_access_resource(user, "users", "delete"):
    # User can delete users
    pass
```

### Verifying Institution Access
```python
from src.utils.rbac import verify_institution_access

if verify_institution_access(user, target_institution_id):
    # User has access to this institution
    pass
```

### Checking Subscription Limits
```python
from src.utils.tenant import can_add_user

if can_add_user(db, institution_id):
    # Can add more users
    user = User(...)
    db.add(user)
else:
    raise Exception("User limit reached")
```

## Common Patterns

### 1. API Endpoint with RLS
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db, set_rls_context

router = APIRouter()

@router.get("/users")
def get_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Set RLS context for this request
    set_rls_context(db, current_user.institution_id, current_user.id)
    
    # Query - automatically filtered by RLS
    users = db.query(User).all()
    return users
```

### 2. Permission-Protected Endpoint
```python
from src.utils.rbac import has_permission
from fastapi import HTTPException

@router.post("/users")
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check permission
    if not has_permission(current_user, "users.create"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    set_rls_context(db, current_user.institution_id, current_user.id)
    
    # Create user
    user = User(**user_data.dict())
    db.add(user)
    db.commit()
    return user
```

### 3. Admin Bypass for System Operations
```python
@router.get("/admin/all-institutions")
def get_all_institutions(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Bypass RLS for superuser operations
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Superuser required")
    
    with get_db_with_context(bypass_rls=True) as admin_db:
        institutions = admin_db.query(Institution).all()
        return institutions
```

### 4. Audit Log Query
```python
from src.models import AuditLog

@router.get("/audit-logs")
def get_audit_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not has_permission(current_user, "audit_logs.view"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    set_rls_context(db, current_user.institution_id, current_user.id)
    
    # Get audit logs for current institution
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return logs
```

## Default System Roles

Use these role IDs when creating users:

| ID | Role | Slug | Use Case |
|----|------|------|----------|
| 1 | Super Admin | super_admin | Platform administrators |
| 2 | Institution Admin | institution_admin | Organization administrators |
| 3 | Manager | manager | Team managers |
| 4 | User | user | Regular users |
| 5 | Viewer | viewer | Read-only access |

## Default Permissions Reference

```python
# User management
"users.view", "users.create", "users.update", "users.delete"

# Role management
"roles.view", "roles.create", "roles.update", "roles.delete"

# Permission management
"permissions.view", "permissions.manage"

# Institution management
"institution.view", "institution.update"

# Subscription management
"subscriptions.view", "subscriptions.manage"

# Audit logs
"audit_logs.view"

# Dashboard and reports
"dashboard.view", "reports.view", "reports.generate"
```

## Testing Data Isolation

```python
def test_multi_tenant_isolation():
    # Create two institutions
    with get_db_with_context(bypass_rls=True) as db:
        inst1 = Institution(name="Inst1", slug="inst1")
        inst2 = Institution(name="Inst2", slug="inst2")
        db.add_all([inst1, inst2])
        db.flush()
        
        # Create users in each institution
        role_id = 4  # User role
        user1 = User(
            institution_id=inst1.id,
            role_id=role_id,
            email="user1@inst1.com",
            username="user1",
            hashed_password=get_password_hash("pass")
        )
        user2 = User(
            institution_id=inst2.id,
            role_id=role_id,
            email="user2@inst2.com",
            username="user2",
            hashed_password=get_password_hash("pass")
        )
        db.add_all([user1, user2])
    
    # Query with RLS - should only see inst1 users
    with get_db_with_context(institution_id=inst1.id) as db:
        users = db.query(User).all()
        assert len(users) == 1
        assert users[0].email == "user1@inst1.com"
    
    # Query with RLS - should only see inst2 users
    with get_db_with_context(institution_id=inst2.id) as db:
        users = db.query(User).all()
        assert len(users) == 1
        assert users[0].email == "user2@inst2.com"
```

## Troubleshooting

### RLS Errors
If you get empty results or RLS policy violations:
```python
# Make sure to set context before queries
set_rls_context(db, institution_id=1, user_id=123)

# For admin operations, bypass RLS
with get_db_with_context(bypass_rls=True) as db:
    # admin operations
    pass
```

### Audit Triggers Not Working
Ensure session variables are set:
```python
# User ID must be set for audit logs to capture it
set_rls_context(db, institution_id=1, user_id=123)

# Now any INSERT/UPDATE/DELETE will be logged with user_id
```

### Permission Checks Failing
```python
# Eager load permissions
from sqlalchemy.orm import joinedload

user = db.query(User).options(
    joinedload(User.role).joinedload(Role.permissions)
).filter(User.id == user_id).first()

# Now has_permission() will work without additional queries
```

## Additional Resources

- **Full Documentation**: See `docs/MULTI_TENANT_ARCHITECTURE.md`
- **Implementation Details**: See `docs/IMPLEMENTATION_SUMMARY.md`
- **Migration Scripts**: See `alembic/versions/`
- **Model Definitions**: See `src/models/`
- **Helper Utilities**: See `src/utils/`
