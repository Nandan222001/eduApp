"""create multi-tenant schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('institutions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('domain', sa.String(length=255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('max_users', sa.Integer(), nullable=True),
        sa.Column('settings', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_institutions_id'), 'institutions', ['id'], unique=False)
    op.create_index(op.f('ix_institutions_name'), 'institutions', ['name'], unique=False)
    op.create_index(op.f('ix_institutions_slug'), 'institutions', ['slug'], unique=True)
    op.create_index(op.f('ix_institutions_domain'), 'institutions', ['domain'], unique=True)
    op.create_index('idx_institution_active', 'institutions', ['is_active'], unique=False)
    op.create_index('idx_institution_created', 'institutions', ['created_at'], unique=False)

    op.create_table('permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('resource', sa.String(length=100), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_permissions_id'), 'permissions', ['id'], unique=False)
    op.create_index(op.f('ix_permissions_name'), 'permissions', ['name'], unique=True)
    op.create_index(op.f('ix_permissions_slug'), 'permissions', ['slug'], unique=True)
    op.create_index(op.f('ix_permissions_resource'), 'permissions', ['resource'], unique=False)
    op.create_index(op.f('ix_permissions_action'), 'permissions', ['action'], unique=False)
    op.create_index('idx_permission_resource_action', 'permissions', ['resource', 'action'], unique=True)

    op.create_table('roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('is_system_role', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_roles_id'), 'roles', ['id'], unique=False)
    op.create_index(op.f('ix_roles_name'), 'roles', ['name'], unique=False)
    op.create_index(op.f('ix_roles_slug'), 'roles', ['slug'], unique=False)
    op.create_index(op.f('ix_roles_institution_id'), 'roles', ['institution_id'], unique=False)
    op.create_index('idx_role_institution_slug', 'roles', ['institution_id', 'slug'], unique=True)
    op.create_index('idx_role_system', 'roles', ['is_system_role'], unique=False)
    op.create_index('idx_role_active', 'roles', ['is_active'], unique=False)

    op.create_table('role_permissions',
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('role_id', 'permission_id')
    )
    op.create_index('idx_role_permissions_role', 'role_permissions', ['role_id'], unique=False)
    op.create_index('idx_role_permissions_permission', 'role_permissions', ['permission_id'], unique=False)

    op.create_table('subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('plan_name', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('billing_cycle', sa.String(length=50), nullable=False),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('max_users', sa.Integer(), nullable=True),
        sa.Column('max_storage_gb', sa.Integer(), nullable=True),
        sa.Column('features', sa.Text(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('trial_end_date', sa.DateTime(), nullable=True),
        sa.Column('canceled_at', sa.DateTime(), nullable=True),
        sa.Column('external_subscription_id', sa.String(length=255), nullable=True),
        sa.Column('metadata', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subscriptions_id'), 'subscriptions', ['id'], unique=False)
    op.create_index(op.f('ix_subscriptions_institution_id'), 'subscriptions', ['institution_id'], unique=False)
    op.create_index(op.f('ix_subscriptions_plan_name'), 'subscriptions', ['plan_name'], unique=False)
    op.create_index(op.f('ix_subscriptions_status'), 'subscriptions', ['status'], unique=False)
    op.create_index(op.f('ix_subscriptions_external_subscription_id'), 'subscriptions', ['external_subscription_id'], unique=False)
    op.create_index('idx_subscription_institution_status', 'subscriptions', ['institution_id', 'status'], unique=False)
    op.create_index('idx_subscription_dates', 'subscriptions', ['start_date', 'end_date'], unique=False)
    op.create_index('idx_subscription_status', 'subscriptions', ['status'], unique=False)

    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=True),
        sa.Column('last_name', sa.String(length=100), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_superuser', sa.Boolean(), nullable=False),
        sa.Column('email_verified', sa.Boolean(), nullable=False),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_institution_id'), 'users', ['institution_id'], unique=False)
    op.create_index(op.f('ix_users_role_id'), 'users', ['role_id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=False)
    op.create_index('idx_user_institution_email', 'users', ['institution_id', 'email'], unique=True)
    op.create_index('idx_user_institution_username', 'users', ['institution_id', 'username'], unique=True)
    op.create_index('idx_user_active', 'users', ['is_active'], unique=False)

    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('table_name', sa.String(length=100), nullable=False),
        sa.Column('record_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('old_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('new_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_audit_logs_institution_id'), 'audit_logs', ['institution_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_table_name'), 'audit_logs', ['table_name'], unique=False)
    op.create_index(op.f('ix_audit_logs_record_id'), 'audit_logs', ['record_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)
    op.create_index('idx_audit_log_institution_user', 'audit_logs', ['institution_id', 'user_id'], unique=False)
    op.create_index('idx_audit_log_table_record', 'audit_logs', ['table_name', 'record_id'], unique=False)
    op.create_index('idx_audit_log_action', 'audit_logs', ['action'], unique=False)
    op.create_index('idx_audit_log_created', 'audit_logs', ['created_at'], unique=False)

    op.execute("""
        CREATE OR REPLACE FUNCTION audit_trigger_func()
        RETURNS TRIGGER AS $$
        DECLARE
            audit_row audit_logs%ROWTYPE;
            institution_id_val INTEGER;
        BEGIN
            IF TG_OP = 'DELETE' THEN
                audit_row.action = 'DELETE';
                audit_row.old_values = row_to_json(OLD)::jsonb;
                audit_row.new_values = NULL;
                audit_row.record_id = OLD.id;
                IF TG_TABLE_NAME = 'institutions' THEN
                    institution_id_val = OLD.id;
                ELSIF TG_TABLE_NAME = 'users' THEN
                    institution_id_val = OLD.institution_id;
                ELSIF TG_TABLE_NAME = 'roles' THEN
                    institution_id_val = OLD.institution_id;
                ELSIF TG_TABLE_NAME = 'subscriptions' THEN
                    institution_id_val = OLD.institution_id;
                ELSE
                    institution_id_val = NULL;
                END IF;
            ELSIF TG_OP = 'UPDATE' THEN
                audit_row.action = 'UPDATE';
                audit_row.old_values = row_to_json(OLD)::jsonb;
                audit_row.new_values = row_to_json(NEW)::jsonb;
                audit_row.record_id = NEW.id;
                IF TG_TABLE_NAME = 'institutions' THEN
                    institution_id_val = NEW.id;
                ELSIF TG_TABLE_NAME = 'users' THEN
                    institution_id_val = NEW.institution_id;
                ELSIF TG_TABLE_NAME = 'roles' THEN
                    institution_id_val = NEW.institution_id;
                ELSIF TG_TABLE_NAME = 'subscriptions' THEN
                    institution_id_val = NEW.institution_id;
                ELSE
                    institution_id_val = NULL;
                END IF;
            ELSIF TG_OP = 'INSERT' THEN
                audit_row.action = 'INSERT';
                audit_row.old_values = NULL;
                audit_row.new_values = row_to_json(NEW)::jsonb;
                audit_row.record_id = NEW.id;
                IF TG_TABLE_NAME = 'institutions' THEN
                    institution_id_val = NEW.id;
                ELSIF TG_TABLE_NAME = 'users' THEN
                    institution_id_val = NEW.institution_id;
                ELSIF TG_TABLE_NAME = 'roles' THEN
                    institution_id_val = NEW.institution_id;
                ELSIF TG_TABLE_NAME = 'subscriptions' THEN
                    institution_id_val = NEW.institution_id;
                ELSE
                    institution_id_val = NULL;
                END IF;
            END IF;
            
            audit_row.table_name = TG_TABLE_NAME;
            audit_row.institution_id = institution_id_val;
            audit_row.user_id = current_setting('app.current_user_id', true)::integer;
            audit_row.created_at = NOW();
            
            INSERT INTO audit_logs (institution_id, user_id, table_name, record_id, action, old_values, new_values, created_at)
            VALUES (audit_row.institution_id, audit_row.user_id, audit_row.table_name, audit_row.record_id, 
                    audit_row.action, audit_row.old_values, audit_row.new_values, audit_row.created_at);
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                IF TG_OP = 'DELETE' THEN
                    RETURN OLD;
                ELSE
                    RETURN NEW;
                END IF;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE TRIGGER audit_institutions_trigger
        AFTER INSERT OR UPDATE OR DELETE ON institutions
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
    """)

    op.execute("""
        CREATE TRIGGER audit_users_trigger
        AFTER INSERT OR UPDATE OR DELETE ON users
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
    """)

    op.execute("""
        CREATE TRIGGER audit_roles_trigger
        AFTER INSERT OR UPDATE OR DELETE ON roles
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
    """)

    op.execute("""
        CREATE TRIGGER audit_subscriptions_trigger
        AFTER INSERT OR UPDATE OR DELETE ON subscriptions
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
    """)

    op.execute("ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE users ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE roles ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;")

    op.execute("""
        CREATE POLICY institutions_isolation_policy ON institutions
        USING (
            id = current_setting('app.current_institution_id', true)::integer
            OR current_setting('app.bypass_rls', true)::boolean = true
        );
    """)

    op.execute("""
        CREATE POLICY users_isolation_policy ON users
        USING (
            institution_id = current_setting('app.current_institution_id', true)::integer
            OR current_setting('app.bypass_rls', true)::boolean = true
        );
    """)

    op.execute("""
        CREATE POLICY roles_isolation_policy ON roles
        USING (
            (institution_id = current_setting('app.current_institution_id', true)::integer OR institution_id IS NULL)
            OR current_setting('app.bypass_rls', true)::boolean = true
        );
    """)

    op.execute("""
        CREATE POLICY subscriptions_isolation_policy ON subscriptions
        USING (
            institution_id = current_setting('app.current_institution_id', true)::integer
            OR current_setting('app.bypass_rls', true)::boolean = true
        );
    """)

    op.execute("""
        CREATE POLICY audit_logs_isolation_policy ON audit_logs
        USING (
            institution_id = current_setting('app.current_institution_id', true)::integer
            OR current_setting('app.bypass_rls', true)::boolean = true
        );
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS audit_logs_isolation_policy ON audit_logs;")
    op.execute("DROP POLICY IF EXISTS subscriptions_isolation_policy ON subscriptions;")
    op.execute("DROP POLICY IF EXISTS roles_isolation_policy ON roles;")
    op.execute("DROP POLICY IF EXISTS users_isolation_policy ON users;")
    op.execute("DROP POLICY IF EXISTS institutions_isolation_policy ON institutions;")

    op.execute("ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE roles DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE users DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE institutions DISABLE ROW LEVEL SECURITY;")

    op.execute("DROP TRIGGER IF EXISTS audit_subscriptions_trigger ON subscriptions;")
    op.execute("DROP TRIGGER IF EXISTS audit_roles_trigger ON roles;")
    op.execute("DROP TRIGGER IF EXISTS audit_users_trigger ON users;")
    op.execute("DROP TRIGGER IF EXISTS audit_institutions_trigger ON institutions;")
    op.execute("DROP FUNCTION IF EXISTS audit_trigger_func();")

    op.drop_index('idx_audit_log_created', table_name='audit_logs')
    op.drop_index('idx_audit_log_action', table_name='audit_logs')
    op.drop_index('idx_audit_log_table_record', table_name='audit_logs')
    op.drop_index('idx_audit_log_institution_user', table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_created_at'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_action'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_record_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_table_name'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_user_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_institution_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
    op.drop_table('audit_logs')

    op.drop_index('idx_user_active', table_name='users')
    op.drop_index('idx_user_institution_username', table_name='users')
    op.drop_index('idx_user_institution_email', table_name='users')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_role_id'), table_name='users')
    op.drop_index(op.f('ix_users_institution_id'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')

    op.drop_index('idx_subscription_status', table_name='subscriptions')
    op.drop_index('idx_subscription_dates', table_name='subscriptions')
    op.drop_index('idx_subscription_institution_status', table_name='subscriptions')
    op.drop_index(op.f('ix_subscriptions_external_subscription_id'), table_name='subscriptions')
    op.drop_index(op.f('ix_subscriptions_status'), table_name='subscriptions')
    op.drop_index(op.f('ix_subscriptions_plan_name'), table_name='subscriptions')
    op.drop_index(op.f('ix_subscriptions_institution_id'), table_name='subscriptions')
    op.drop_index(op.f('ix_subscriptions_id'), table_name='subscriptions')
    op.drop_table('subscriptions')

    op.drop_index('idx_role_permissions_permission', table_name='role_permissions')
    op.drop_index('idx_role_permissions_role', table_name='role_permissions')
    op.drop_table('role_permissions')

    op.drop_index('idx_role_active', table_name='roles')
    op.drop_index('idx_role_system', table_name='roles')
    op.drop_index('idx_role_institution_slug', table_name='roles')
    op.drop_index(op.f('ix_roles_institution_id'), table_name='roles')
    op.drop_index(op.f('ix_roles_slug'), table_name='roles')
    op.drop_index(op.f('ix_roles_name'), table_name='roles')
    op.drop_index(op.f('ix_roles_id'), table_name='roles')
    op.drop_table('roles')

    op.drop_index('idx_permission_resource_action', table_name='permissions')
    op.drop_index(op.f('ix_permissions_action'), table_name='permissions')
    op.drop_index(op.f('ix_permissions_resource'), table_name='permissions')
    op.drop_index(op.f('ix_permissions_slug'), table_name='permissions')
    op.drop_index(op.f('ix_permissions_name'), table_name='permissions')
    op.drop_index(op.f('ix_permissions_id'), table_name='permissions')
    op.drop_table('permissions')

    op.drop_index('idx_institution_created', table_name='institutions')
    op.drop_index('idx_institution_active', table_name='institutions')
    op.drop_index(op.f('ix_institutions_domain'), table_name='institutions')
    op.drop_index(op.f('ix_institutions_slug'), table_name='institutions')
    op.drop_index(op.f('ix_institutions_name'), table_name='institutions')
    op.drop_index(op.f('ix_institutions_id'), table_name='institutions')
    op.drop_table('institutions')
