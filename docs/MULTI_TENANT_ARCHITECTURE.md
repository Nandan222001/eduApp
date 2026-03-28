# Multi-Tenant Architecture

## Overview

This application implements a comprehensive multi-tenant architecture with institution-based data isolation, role-based access control (RBAC), and comprehensive audit logging.

## Database Schema

### Core Tables

#### 1. Institutions
The root entity for multi-tenancy. Each institution is a separate tenant with isolated data.

- **Primary Key**: `id`
- **Unique Constraints**: `slug`, `domain`
- **Key Fields**:
  - `name`: Institution name
  - `slug`: URL-friendly identifier
  - `domain`: Optional custom domain
  - `max_users`: Maximum allowed users
  - `is_active`: Enable/disable institution

#### 2. Users
User accounts scoped to institutions.

- **Primary Key**: `id`
- **Foreign Keys**: 
  - `institution_id` → `institutions.id` (CASCADE)
  - `role_id` → `roles.id` (RESTRICT)
- **Unique Constraints**: 
  - `(institution_id, email)`
  - `(institution_id, username)`
- **Key Fields**:
  - Email and username are unique per institution
  - Password stored as hash
  - Support for email verification and last login tracking

#### 3. Roles
Define user roles with associated permissions.

- **Primary Key**: `id`
- **Foreign Keys**: `institution_id` → `institutions.id` (CASCADE, nullable)
- **Unique Constraints**: `(institution_id, slug)`
- **Key Fields**:
  - `is_system_role`: System-wide roles (e.g., Super Admin)
  - `is_active`: Enable/disable role
  - System roles have `institution_id = NULL`

#### 4. Permissions
Granular permissions for resources and actions.

- **Primary Key**: `id`
- **Unique Constraints**: `slug`, `(resource, action)`
- **Key Fields**:
  - `resource`: Target resource (e.g., 'users', 'reports')
  - `action`: Allowed action (e.g., 'view', 'create', 'update', 'delete')
  - `slug`: Permission identifier (e.g., 'users.view')

#### 5. Role_Permissions
Many-to-many relationship between roles and permissions.

- **Composite Primary Key**: `(role_id, permission_id)`
- **Foreign Keys**: Both with CASCADE delete

#### 6. Subscriptions
Track institution subscription plans and billing.

- **Primary Key**: `id`
- **Foreign Keys**: `institution_id` → `institutions.id` (CASCADE)
- **Key Fields**:
  - `status`: active, trial, canceled, expired
  - `billing_cycle`: monthly, yearly
  - `price`, `currency`: Pricing information
  - `max_users`, `max_storage_gb`: Plan limits
  - Date tracking for start, end, trial, and cancellation

#### 7. Audit_Logs
Comprehensive audit trail for all data changes.

- **Primary Key**: `id`
- **Foreign Keys**: 
  - `institution_id` → `institutions.id` (SET NULL)
  - `user_id` → `users.id` (SET NULL)
- **Key Fields**:
  - `table_name`, `record_id`: Track which record changed
  - `action`: INSERT, UPDATE, DELETE
  - `old_values`, `new_values`: JSONB snapshots
  - `ip_address`, `user_agent`: Request metadata

## Row-Level Security (RLS)

### Overview
Application-level security enforces data isolation at the query level using middleware and filters.

### Session Variables
- `app.current_institution_id`: Current institution context
- `app.current_user_id`: Current user context
- `app.bypass_rls`: Allow superuser bypass (use carefully)

### RLS Policies

All major tables have isolation policies:

```sql
-- Example: Users table policy
CREATE POLICY users_isolation_policy ON users
USING (
    institution_id = current_setting('app.current_institution_id', true)::integer
    OR current_setting('app.bypass_rls', true)::boolean = true
);
```

### Using RLS in Application Code

```python
from src.database import get_db_with_context, set_rls_context

# Method 1: Context manager (recommended)
with get_db_with_context(institution_id=1, user_id=123) as db:
    users = db.query(User).all()  # Only returns users for institution 1

# Method 2: Manual context setting
db = SessionLocal()
set_rls_context(db, institution_id=1, user_id=123)
users = db.query(User).all()

# Bypass RLS (admin operations only)
with get_db_with_context(bypass_rls=True) as db:
    all_users = db.query(User).all()  # Returns users from all institutions
```

## Audit Logging

### Automatic Triggers

Database triggers automatically log all changes to:
- `institutions`
- `users`
- `roles`
- `subscriptions`

### Trigger Implementation

The `audit_trigger_func()` function:
1. Captures the operation (INSERT, UPDATE, DELETE)
2. Stores old and new values as JSONB
3. Links to institution and user from session variables
4. Handles errors gracefully (doesn't block operations)

### Manual Audit Logging

For application-level events:

```python
from src.models import AuditLog

audit_log = AuditLog(
    institution_id=institution_id,
    user_id=user_id,
    table_name='custom_event',
    action='LOGIN',
    new_values={'ip_address': '192.168.1.1'},
    ip_address='192.168.1.1',
    user_agent='Mozilla/5.0...'
)
db.add(audit_log)
db.commit()
```

## Default Roles and Permissions

### System Roles

1. **Super Admin** (`super_admin`)
   - All permissions
   - System-wide access
   - Can bypass RLS

2. **Institution Admin** (`institution_admin`)
   - Full access within institution
   - Manage users, roles, subscriptions
   - View audit logs

3. **Manager** (`manager`)
   - Manage users
   - View and generate reports
   - View institution details

4. **User** (`user`)
   - Basic access
   - View own profile
   - Access dashboard

5. **Viewer** (`viewer`)
   - Read-only access
   - View users, roles, institution
   - Access reports

### Permission Categories

- **Users**: view, create, update, delete
- **Roles**: view, create, update, delete
- **Permissions**: view, manage
- **Institution**: view, update
- **Subscriptions**: view, manage
- **Audit Logs**: view
- **Dashboard**: view
- **Reports**: view, generate

## Indexes

### Performance Optimization

All tables include strategic indexes:

1. **Primary lookup indexes**: id, email, username
2. **Foreign key indexes**: All FK columns
3. **Composite indexes**: Multi-column queries
4. **Filtered indexes**: Status and active flags
5. **Timestamp indexes**: Date range queries

### Key Composite Indexes

- `users(institution_id, email)` - Unique constraint + fast lookup
- `users(institution_id, username)` - Unique constraint + fast lookup
- `roles(institution_id, slug)` - Unique constraint + fast lookup
- `subscriptions(institution_id, status)` - Filter active subscriptions
- `audit_logs(table_name, record_id)` - Track record history

## Migration Scripts

### Initial Migration (001)

Creates all tables with:
- Schema definitions
- Foreign key constraints
- Indexes
- RLS policies
- Audit triggers

### Seed Migration (002)

Populates:
- 18 default permissions
- 5 system roles
- Role-permission mappings

### Running Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Run migrations
alembic upgrade head

# Rollback one version
alembic downgrade -1

# Rollback to specific version
alembic downgrade 001
```

## Best Practices

### 1. Always Set RLS Context

```python
# WRONG - queries may return wrong data or fail
db.query(User).all()

# RIGHT - set institution context
with get_db_with_context(institution_id=institution_id) as db:
    db.query(User).all()
```

### 2. Use Transactions

```python
with get_db_with_context(institution_id=1) as db:
    user = User(...)
    db.add(user)
    # Automatically commits on success, rolls back on exception
```

### 3. Verify Institution Access

```python
def get_user(db: Session, user_id: int, institution_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.institution_id != institution_id:
        raise PermissionError("Access denied")
    return user
```

### 4. Audit Important Actions

Set session variables before operations:
```python
set_rls_context(db, institution_id=inst_id, user_id=user_id)
# Now triggers will capture user_id in audit logs
```

### 5. Handle Role Hierarchy

```python
def has_permission(user: User, permission_slug: str) -> bool:
    if user.is_superuser:
        return True
    return any(
        p.slug == permission_slug 
        for p in user.role.permissions
    )
```

## Security Considerations

1. **RLS is not a replacement for application logic** - Always validate permissions in code
2. **Bypass RLS sparingly** - Only for system admin operations
3. **Audit log protection** - Audit logs use RLS but with SET NULL on deletes
4. **Password security** - Always hash passwords before storing
5. **Session variables** - Clear between requests in web applications
6. **SQL injection** - Use parameterized queries, SQLAlchemy ORM handles this

## Testing Multi-Tenancy

```python
def test_data_isolation():
    # Create two institutions
    inst1 = Institution(name="Inst 1", slug="inst1")
    inst2 = Institution(name="Inst 2", slug="inst2")
    db.add_all([inst1, inst2])
    db.commit()
    
    # Create users in each
    user1 = User(institution_id=inst1.id, ...)
    user2 = User(institution_id=inst2.id, ...)
    db.add_all([user1, user2])
    db.commit()
    
    # Test isolation
    with get_db_with_context(institution_id=inst1.id) as db:
        users = db.query(User).all()
        assert len(users) == 1
        assert users[0].id == user1.id
```
