"""create ml training tables

Revision ID: 016
Revises: 015
Create Date: 2024-01-15 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '016'
down_revision = '015'
branch_labels = None
depends_on = None


def upgrade():
    training_job_type = sa.Enum('manual', 'scheduled', 'retraining', name='trainingjobtype')
    training_job_type.create(op.get_bind())
    
    training_status = sa.Enum('pending', 'running', 'completed', 'failed', 'cancelled', name='trainingstatus')
    training_status.create(op.get_bind())
    
    op.create_table(
        'ml_training_jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.Integer(), nullable=True),
        sa.Column('model_version_id', sa.Integer(), nullable=True),
        sa.Column('job_type', training_job_type, nullable=False),
        sa.Column('status', training_status, nullable=False),
        sa.Column('celery_task_id', sa.String(255), nullable=True),
        sa.Column('model_name', sa.String(200), nullable=False),
        sa.Column('algorithm', sa.String(100), nullable=False),
        sa.Column('prediction_type', sa.String(100), nullable=False),
        sa.Column('hyperparameters', sa.JSON(), nullable=True),
        sa.Column('training_config', sa.JSON(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('duration_seconds', sa.Float(), nullable=True),
        sa.Column('training_samples', sa.Integer(), nullable=True),
        sa.Column('test_r2_score', sa.Float(), nullable=True),
        sa.Column('validation_r2_score', sa.Float(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_traceback', sa.Text(), nullable=True),
        sa.Column('auto_promoted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('promotion_threshold', sa.Float(), nullable=True),
        sa.Column('triggered_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['model_id'], ['ml_models.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['model_version_id'], ['ml_model_versions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['triggered_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_training_job_institution', 'ml_training_jobs', ['institution_id'])
    op.create_index('idx_training_job_model', 'ml_training_jobs', ['model_id'])
    op.create_index('idx_training_job_status', 'ml_training_jobs', ['status'])
    op.create_index('idx_training_job_created', 'ml_training_jobs', ['created_at'])
    op.create_index('idx_training_job_celery_task', 'ml_training_jobs', ['celery_task_id'])
    
    op.create_table(
        'model_performance_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_version_id', sa.Integer(), nullable=False),
        sa.Column('metric_date', sa.DateTime(), nullable=False),
        sa.Column('prediction_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('actual_r2_score', sa.Float(), nullable=True),
        sa.Column('actual_mae', sa.Float(), nullable=True),
        sa.Column('actual_rmse', sa.Float(), nullable=True),
        sa.Column('average_prediction_time_ms', sa.Float(), nullable=True),
        sa.Column('error_rate', sa.Float(), nullable=True),
        sa.Column('traffic_percentage', sa.Float(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['model_version_id'], ['ml_model_versions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_performance_metrics_version', 'model_performance_metrics', ['model_version_id'])
    op.create_index('idx_performance_metrics_date', 'model_performance_metrics', ['metric_date'])
    
    op.create_table(
        'model_promotion_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.Integer(), nullable=False),
        sa.Column('previous_version_id', sa.Integer(), nullable=True),
        sa.Column('new_version_id', sa.Integer(), nullable=False),
        sa.Column('previous_r2_score', sa.Float(), nullable=True),
        sa.Column('new_r2_score', sa.Float(), nullable=False),
        sa.Column('improvement', sa.Float(), nullable=True),
        sa.Column('promotion_type', sa.String(50), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('promoted_by', sa.Integer(), nullable=True),
        sa.Column('promoted_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['model_id'], ['ml_models.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['previous_version_id'], ['ml_model_versions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['new_version_id'], ['ml_model_versions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['promoted_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_promotion_log_model', 'model_promotion_logs', ['model_id'])
    op.create_index('idx_promotion_log_date', 'model_promotion_logs', ['promoted_at'])


def downgrade():
    op.drop_index('idx_promotion_log_date', table_name='model_promotion_logs')
    op.drop_index('idx_promotion_log_model', table_name='model_promotion_logs')
    op.drop_table('model_promotion_logs')
    
    op.drop_index('idx_performance_metrics_date', table_name='model_performance_metrics')
    op.drop_index('idx_performance_metrics_version', table_name='model_performance_metrics')
    op.drop_table('model_performance_metrics')
    
    op.drop_index('idx_training_job_celery_task', table_name='ml_training_jobs')
    op.drop_index('idx_training_job_created', table_name='ml_training_jobs')
    op.drop_index('idx_training_job_status', table_name='ml_training_jobs')
    op.drop_index('idx_training_job_model', table_name='ml_training_jobs')
    op.drop_index('idx_training_job_institution', table_name='ml_training_jobs')
    op.drop_table('ml_training_jobs')
    
    training_status = sa.Enum('pending', 'running', 'completed', 'failed', 'cancelled', name='trainingstatus')
    training_status.drop(op.get_bind())
    
    training_job_type = sa.Enum('manual', 'scheduled', 'retraining', name='trainingjobtype')
    training_job_type.drop(op.get_bind())
