#!/usr/bin/env python3
"""
Script to create an admin user for the application.
Usage: python scripts/create_admin.py
"""

import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime
from sqlalchemy.orm import Session

from src.database import SessionLocal, engine, Base
from src.models import User, Role, Institution
from src.utils.security import get_password_hash


def create_default_institution(db: Session) -> Institution:
    institution = db.query(Institution).filter(Institution.slug == "default").first()
    if not institution:
        institution = Institution(
            name="Default Institution",
            slug="default",
            domain="default.local",
            description="Default institution for initial setup",
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(institution)
        db.commit()
        db.refresh(institution)
        print(f"Created default institution: {institution.name} (ID: {institution.id})")
    else:
        print(f"Using existing institution: {institution.name} (ID: {institution.id})")
    return institution


def create_admin_user(
    db: Session,
    email: str,
    username: str,
    password: str,
    first_name: str = "Admin",
    last_name: str = "User",
) -> User:
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"User with email {email} already exists!")
        return existing_user

    institution = create_default_institution(db)

    admin_role = db.query(Role).filter(Role.slug == "super_admin").first()
    if not admin_role:
        print("Error: Super admin role not found. Please run migrations first.")
        sys.exit(1)

    user = User(
        email=email,
        username=username,
        hashed_password=get_password_hash(password),
        first_name=first_name,
        last_name=last_name,
        institution_id=institution.id,
        role_id=admin_role.id,
        is_active=True,
        is_superuser=True,
        email_verified=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    print(f"\n{'='*60}")
    print(f"Admin user created successfully!")
    print(f"{'='*60}")
    print(f"Email: {user.email}")
    print(f"Username: {user.username}")
    print(f"Name: {user.first_name} {user.last_name}")
    print(f"Institution: {institution.name}")
    print(f"Role: {admin_role.name}")
    print(f"Is Superuser: {user.is_superuser}")
    print(f"{'='*60}\n")

    return user


def main():
    print("Create Admin User Script")
    print("=" * 60)

    email = input("Enter admin email: ").strip()
    if not email:
        print("Email is required!")
        sys.exit(1)

    username = input("Enter admin username: ").strip()
    if not username:
        print("Username is required!")
        sys.exit(1)

    password = input("Enter admin password (min 8 characters): ").strip()
    if len(password) < 8:
        print("Password must be at least 8 characters long!")
        sys.exit(1)

    first_name = input("Enter first name (default: Admin): ").strip() or "Admin"
    last_name = input("Enter last name (default: User): ").strip() or "User"

    print(f"\nCreating admin user with:")
    print(f"  Email: {email}")
    print(f"  Username: {username}")
    print(f"  Name: {first_name} {last_name}")

    confirm = input("\nProceed? (y/n): ").strip().lower()
    if confirm != "y":
        print("Cancelled.")
        sys.exit(0)

    db = SessionLocal()
    try:
        create_admin_user(
            db,
            email=email,
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
    except Exception as e:
        print(f"\nError creating admin user: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
