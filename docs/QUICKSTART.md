# Quick Start Guide

## Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis 5.0+
- Poetry (for dependency management)

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd <repository-name>
```

2. **Install dependencies**
```bash
poetry install
```

3. **Activate virtual environment**
```bash
poetry shell
```

4. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database credentials
- Redis credentials
- SECRET_KEY (generate a secure random key)

5. **Start services with Docker Compose**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

6. **Run database migrations**
```bash
alembic upgrade head
```

This creates:
- All database tables
- Multi-tenant schema with RLS policies
- Permissions and roles seed data
- Password reset tokens table
- Audit logging triggers

7. **Create an admin user**
```bash
python scripts/create_admin.py
```

Follow the prompts to create your first admin user.

## Running the Application

### Development Server
```bash
uvicorn src.main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

### Using Docker
```bash
docker-compose up
```

## Testing the API

### 1. Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### 2. Access Protected Endpoint

```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <your_access_token>"
```

### 3. Create a User

```bash
curl -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer <your_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "institution_id": 1,
    "role_id": 4,
    "is_active": true,
    "is_superuser": false
  }'
```

## Project Structure

```
.
├── alembic/                  # Database migrations
│   └── versions/             # Migration scripts
├── docs/                     # Documentation
│   ├── AUTH_SYSTEM.md        # Auth system documentation
│   ├── API_EXAMPLES.md       # API request examples
│   └── QUICKSTART.md         # This file
├── scripts/                  # Utility scripts
│   ├── create_admin.py       # Create admin user script
│   └── README.md
├── src/                      # Source code
│   ├── api/                  # API routes
│   │   └── v1/               # API version 1
│   │       ├── auth.py       # Authentication endpoints
│   │       └── users.py      # User management endpoints
│   ├── dependencies/         # FastAPI dependencies
│   │   ├── auth.py           # Authentication dependencies
│   │   └── rbac.py           # RBAC dependencies
│   ├── middleware/           # Middleware
│   │   ├── tenant_context.py # Multi-tenant context middleware
│   │   └── rbac.py           # RBAC middleware utilities
│   ├── models/               # SQLAlchemy models
│   │   ├── user.py
│   │   ├── role.py
│   │   ├── permission.py
│   │   ├── institution.py
│   │   ├── password_reset_token.py
│   │   └── ...
│   ├── schemas/              # Pydantic schemas
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── ...
│   ├── services/             # Business logic
│   │   └── auth_service.py   # Authentication service
│   ├── utils/                # Utility functions
│   │   ├── security.py       # Password & JWT utilities
│   │   ├── session.py        # Session management
│   │   ├── rbac.py           # RBAC utilities
│   │   ├── context.py        # Request context
│   │   └── tenant.py         # Multi-tenant utilities
│   ├── config.py             # Configuration
│   ├── database.py           # Database setup
│   ├── redis_client.py       # Redis client
│   └── main.py               # FastAPI application
├── tests/                    # Test files
│   └── test_auth.py          # Authentication tests
├── .env.example              # Example environment variables
├── docker-compose.yml        # Docker services
├── pyproject.toml            # Poetry dependencies
└── README.md                 # Main README
```

## Available Roles

Default roles created by migrations:

1. **Super Admin** (`super_admin`)
   - All permissions across all institutions
   - System-wide access

2. **Institution Admin** (`institution_admin`)
   - Full access within their institution
   - Manage users, roles, settings

3. **Manager** (`manager`)
   - Manage users and view reports
   - Limited administrative access

4. **User** (`user`)
   - Basic user access
   - View own data and dashboard

5. **Viewer** (`viewer`)
   - Read-only access
   - Cannot modify data

## Default Permissions

Permissions follow the format `resource:action`:

- `users:read`, `users:create`, `users:update`, `users:delete`
- `roles:read`, `roles:create`, `roles:update`, `roles:delete`
- `permissions:read`, `permissions:manage`
- `institution:read`, `institution:update`
- `subscriptions:read`, `subscriptions:manage`
- `audit_logs:read`
- `dashboard:read`
- `reports:read`, `reports:generate`

## Development Workflow

### Running Tests
```bash
poetry run pytest
```

### Code Formatting
```bash
poetry run black src/
```

### Linting
```bash
poetry run ruff check src/
```

### Type Checking
```bash
poetry run mypy src/
```

### Creating a New Migration
```bash
alembic revision --autogenerate -m "description"
```

### Applying Migrations
```bash
alembic upgrade head
```

### Rolling Back Migration
```bash
alembic downgrade -1
```

## Common Tasks

### Add a New Permission

1. Add to database:
```python
from src.models import Permission
from src.database import SessionLocal

db = SessionLocal()
permission = Permission(
    name="Export Data",
    slug="data:export",
    resource="data",
    action="export",
    description="Export data to CSV/Excel"
)
db.add(permission)
db.commit()
```

2. Assign to role:
```python
from src.models import Role

role = db.query(Role).filter(Role.slug == "manager").first()
role.permissions.append(permission)
db.commit()
```

### Protect an Endpoint with RBAC

```python
from fastapi import APIRouter, Depends
from src.dependencies.rbac import require_permissions
from src.dependencies.auth import get_current_user

router = APIRouter()

@router.post(
    "/export",
    dependencies=[Depends(require_permissions(["data:export"]))]
)
async def export_data(current_user = Depends(get_current_user)):
    # Only users with "data:export" permission can access
    pass
```

### Check Permissions Programmatically

```python
from src.utils.rbac import has_permission

if has_permission(user, "data:export"):
    # Allow export
    pass
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `docker-compose ps`
- Check credentials in `.env`
- Test connection: `psql -h localhost -U postgres -d fastapi_db`

### Redis Connection Issues
- Verify Redis is running: `docker-compose ps`
- Test connection: `redis-cli ping`

### Authentication Issues
- Verify SECRET_KEY is set in `.env`
- Check token expiration settings
- Ensure migrations are applied

### Permission Denied
- Verify user has the required role
- Check role has necessary permissions
- Superusers bypass all permission checks

## Next Steps

- Read [AUTH_SYSTEM.md](AUTH_SYSTEM.md) for detailed authentication documentation
- Check [API_EXAMPLES.md](API_EXAMPLES.md) for API usage examples
- Explore the interactive API docs at http://localhost:8000/docs
- Review the code in `src/api/v1/` for endpoint examples

## Support

For issues or questions:
1. Check existing documentation
2. Review error logs
3. Consult the FastAPI documentation
4. Check the project's issue tracker
