"""seed permissions and roles

Revision ID: 002
Revises: 001
Create Date: 2024-01-01 00:00:01.000000

"""
from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    permissions_table = table('permissions',
        column('id', sa.Integer),
        column('name', sa.String),
        column('slug', sa.String),
        column('resource', sa.String),
        column('action', sa.String),
        column('description', sa.Text),
        column('created_at', sa.DateTime),
        column('updated_at', sa.DateTime),
    )

    roles_table = table('roles',
        column('id', sa.Integer),
        column('name', sa.String),
        column('slug', sa.String),
        column('description', sa.Text),
        column('institution_id', sa.Integer),
        column('is_system_role', sa.Boolean),
        column('is_active', sa.Boolean),
        column('created_at', sa.DateTime),
        column('updated_at', sa.DateTime),
    )

    role_permissions_table = table('role_permissions',
        column('role_id', sa.Integer),
        column('permission_id', sa.Integer),
        column('created_at', sa.DateTime),
    )

    now = datetime.utcnow()

    permissions_data = [
        {'id': 1, 'name': 'Read Users', 'slug': 'users:read', 'resource': 'users', 'action': 'read', 'description': 'View user list and details'},
        {'id': 2, 'name': 'Create Users', 'slug': 'users:create', 'resource': 'users', 'action': 'create', 'description': 'Create new users'},
        {'id': 3, 'name': 'Update Users', 'slug': 'users:update', 'resource': 'users', 'action': 'update', 'description': 'Update user information'},
        {'id': 4, 'name': 'Delete Users', 'slug': 'users:delete', 'resource': 'users', 'action': 'delete', 'description': 'Delete users'},
        {'id': 5, 'name': 'Read Roles', 'slug': 'roles:read', 'resource': 'roles', 'action': 'read', 'description': 'View role list and details'},
        {'id': 6, 'name': 'Create Roles', 'slug': 'roles:create', 'resource': 'roles', 'action': 'create', 'description': 'Create new roles'},
        {'id': 7, 'name': 'Update Roles', 'slug': 'roles:update', 'resource': 'roles', 'action': 'update', 'description': 'Update role information'},
        {'id': 8, 'name': 'Delete Roles', 'slug': 'roles:delete', 'resource': 'roles', 'action': 'delete', 'description': 'Delete roles'},
        {'id': 9, 'name': 'Read Permissions', 'slug': 'permissions:read', 'resource': 'permissions', 'action': 'read', 'description': 'View permission list'},
        {'id': 10, 'name': 'Manage Permissions', 'slug': 'permissions:manage', 'resource': 'permissions', 'action': 'manage', 'description': 'Assign/revoke permissions'},
        {'id': 11, 'name': 'Read Institution', 'slug': 'institution:read', 'resource': 'institution', 'action': 'read', 'description': 'View institution details'},
        {'id': 12, 'name': 'Update Institution', 'slug': 'institution:update', 'resource': 'institution', 'action': 'update', 'description': 'Update institution settings'},
        {'id': 13, 'name': 'Read Subscriptions', 'slug': 'subscriptions:read', 'resource': 'subscriptions', 'action': 'read', 'description': 'View subscription details'},
        {'id': 14, 'name': 'Manage Subscriptions', 'slug': 'subscriptions:manage', 'resource': 'subscriptions', 'action': 'manage', 'description': 'Manage subscription plans'},
        {'id': 15, 'name': 'Read Audit Logs', 'slug': 'audit_logs:read', 'resource': 'audit_logs', 'action': 'read', 'description': 'View audit logs'},
        {'id': 16, 'name': 'Read Dashboard', 'slug': 'dashboard:read', 'resource': 'dashboard', 'action': 'read', 'description': 'Access dashboard'},
        {'id': 17, 'name': 'Read Reports', 'slug': 'reports:read', 'resource': 'reports', 'action': 'read', 'description': 'View reports'},
        {'id': 18, 'name': 'Generate Reports', 'slug': 'reports:generate', 'resource': 'reports', 'action': 'generate', 'description': 'Generate custom reports'},
    ]

    op.bulk_insert(permissions_table, [
        {**p, 'created_at': now, 'updated_at': now}
        for p in permissions_data
    ])

    roles_data = [
        {
            'id': 1,
            'name': 'Super Admin',
            'slug': 'super_admin',
            'description': 'Full system access with all permissions',
            'institution_id': None,
            'is_system_role': True,
            'is_active': True,
        },
        {
            'id': 2,
            'name': 'Institution Admin',
            'slug': 'institution_admin',
            'description': 'Full access within institution',
            'institution_id': None,
            'is_system_role': True,
            'is_active': True,
        },
        {
            'id': 3,
            'name': 'Manager',
            'slug': 'manager',
            'description': 'Manage users and view reports',
            'institution_id': None,
            'is_system_role': True,
            'is_active': True,
        },
        {
            'id': 4,
            'name': 'User',
            'slug': 'user',
            'description': 'Basic user access',
            'institution_id': None,
            'is_system_role': True,
            'is_active': True,
        },
        {
            'id': 5,
            'name': 'Viewer',
            'slug': 'viewer',
            'description': 'Read-only access',
            'institution_id': None,
            'is_system_role': True,
            'is_active': True,
        },
    ]

    op.bulk_insert(roles_table, [
        {**r, 'created_at': now, 'updated_at': now}
        for r in roles_data
    ])

    role_permission_mappings = [
        {'role_id': 1, 'permission_ids': list(range(1, 19))},
        {'role_id': 2, 'permission_ids': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]},
        {'role_id': 3, 'permission_ids': [1, 2, 3, 5, 11, 13, 15, 16, 17, 18]},
        {'role_id': 4, 'permission_ids': [1, 11, 16]},
        {'role_id': 5, 'permission_ids': [1, 5, 11, 13, 16, 17]},
    ]

    role_permissions_data = []
    for mapping in role_permission_mappings:
        for perm_id in mapping['permission_ids']:
            role_permissions_data.append({
                'role_id': mapping['role_id'],
                'permission_id': perm_id,
                'created_at': now,
            })

    op.bulk_insert(role_permissions_table, role_permissions_data)


def downgrade() -> None:
    op.execute("DELETE FROM role_permissions WHERE role_id IN (1, 2, 3, 4, 5)")
    op.execute("DELETE FROM roles WHERE id IN (1, 2, 3, 4, 5)")
    op.execute("DELETE FROM permissions WHERE id BETWEEN 1 AND 18")
