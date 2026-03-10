# Scripts

This directory contains utility scripts for managing the application.

## create_admin.py

Creates an admin user for the application.

**Prerequisites:**
- Database migrations must be run first (`alembic upgrade head`)
- Permissions and roles must be seeded (migration 002)

**Usage:**
```bash
python scripts/create_admin.py
```

The script will prompt you for:
- Admin email
- Admin username
- Admin password (minimum 8 characters)
- First name (optional, defaults to "Admin")
- Last name (optional, defaults to "User")

The script will:
1. Create a default institution if it doesn't exist
2. Create an admin user with super admin role
3. Set the user as a superuser with all permissions

**Example:**
```bash
$ python scripts/create_admin.py
Create Admin User Script
============================================================
Enter admin email: admin@example.com
Enter admin username: admin
Enter admin password (min 8 characters): ********
Enter first name (default: Admin): Admin
Enter last name (default: User): User

Creating admin user with:
  Email: admin@example.com
  Username: admin
  Name: Admin User

Proceed? (y/n): y

Using existing institution: Default Institution (ID: 1)

============================================================
Admin user created successfully!
============================================================
Email: admin@example.com
Username: admin
Name: Admin User
Institution: Default Institution
Role: Super Admin
Is Superuser: True
============================================================
```
