"""add institution health tables

Revision ID: add_institution_health
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_institution_health'
down_revision = None  # Update this with your latest revision
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create institution_health_scores table
    op.create_table(
        'institution_health_scores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('overall_health_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('payment_health_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('user_activity_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('support_ticket_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('feature_adoption_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('data_quality_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('churn_risk_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('churn_probability', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('risk_level', sa.String(length=20), nullable=False, server_default='low'),
        sa.Column('health_trend', sa.String(length=20), nullable=False, server_default='stable'),
        sa.Column('previous_score', sa.Float(), nullable=True),
        sa.Column('score_change_percentage', sa.Float(), nullable=True),
        sa.Column('metrics_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('risk_factors', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('recommended_actions', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('last_calculated_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('institution_id')
    )
    op.create_index('idx_health_score_churn', 'institution_health_scores', ['churn_risk_score'])
    op.create_index('idx_health_score_institution', 'institution_health_scores', ['institution_id'])
    op.create_index('idx_health_score_overall', 'institution_health_scores', ['overall_health_score'])
    op.create_index('idx_health_score_risk', 'institution_health_scores', ['risk_level'])

    # Create institution_health_alerts table
    op.create_table(
        'institution_health_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('health_score_id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('alert_type', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('metric_name', sa.String(length=100), nullable=True),
        sa.Column('threshold_value', sa.Float(), nullable=True),
        sa.Column('current_value', sa.Float(), nullable=True),
        sa.Column('is_resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_by', sa.Integer(), nullable=True),
        sa.Column('action_taken', sa.Text(), nullable=True),
        sa.Column('notification_sent', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notification_sent_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['health_score_id'], ['institution_health_scores.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_health_alert_created', 'institution_health_alerts', ['created_at'])
    op.create_index('idx_health_alert_institution', 'institution_health_alerts', ['institution_id'])
    op.create_index('idx_health_alert_resolved', 'institution_health_alerts', ['is_resolved'])
    op.create_index('idx_health_alert_severity', 'institution_health_alerts', ['severity'])
    op.create_index('idx_health_alert_type', 'institution_health_alerts', ['alert_type'])

    # Create institution_health_history table
    op.create_table(
        'institution_health_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('health_score_id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('overall_health_score', sa.Float(), nullable=False),
        sa.Column('payment_health_score', sa.Float(), nullable=False),
        sa.Column('user_activity_score', sa.Float(), nullable=False),
        sa.Column('support_ticket_score', sa.Float(), nullable=False),
        sa.Column('feature_adoption_score', sa.Float(), nullable=False),
        sa.Column('data_quality_score', sa.Float(), nullable=False),
        sa.Column('churn_risk_score', sa.Float(), nullable=False),
        sa.Column('churn_probability', sa.Float(), nullable=False),
        sa.Column('risk_level', sa.String(length=20), nullable=False),
        sa.Column('metrics_snapshot', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['health_score_id'], ['institution_health_scores.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_health_history_institution_date', 'institution_health_history', ['institution_id', 'recorded_at'])
    op.create_index('idx_health_history_recorded', 'institution_health_history', ['recorded_at'])

    # Create churn_prediction_models table
    op.create_table(
        'churn_prediction_models',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_version', sa.String(length=50), nullable=False),
        sa.Column('model_type', sa.String(length=50), nullable=False),
        sa.Column('model_path', sa.String(length=500), nullable=False),
        sa.Column('scaler_path', sa.String(length=500), nullable=True),
        sa.Column('accuracy', sa.Float(), nullable=True),
        sa.Column('precision', sa.Float(), nullable=True),
        sa.Column('recall', sa.Float(), nullable=True),
        sa.Column('f1_score', sa.Float(), nullable=True),
        sa.Column('feature_importances', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('feature_names', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('training_metrics', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('hyperparameters', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('trained_at', sa.DateTime(), nullable=False),
        sa.Column('trained_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['trained_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('model_version')
    )
    op.create_index('idx_churn_model_active', 'churn_prediction_models', ['is_active'])
    op.create_index('idx_churn_model_version', 'churn_prediction_models', ['model_version'])


def downgrade() -> None:
    op.drop_index('idx_churn_model_version', table_name='churn_prediction_models')
    op.drop_index('idx_churn_model_active', table_name='churn_prediction_models')
    op.drop_table('churn_prediction_models')
    
    op.drop_index('idx_health_history_recorded', table_name='institution_health_history')
    op.drop_index('idx_health_history_institution_date', table_name='institution_health_history')
    op.drop_table('institution_health_history')
    
    op.drop_index('idx_health_alert_type', table_name='institution_health_alerts')
    op.drop_index('idx_health_alert_severity', table_name='institution_health_alerts')
    op.drop_index('idx_health_alert_resolved', table_name='institution_health_alerts')
    op.drop_index('idx_health_alert_institution', table_name='institution_health_alerts')
    op.drop_index('idx_health_alert_created', table_name='institution_health_alerts')
    op.drop_table('institution_health_alerts')
    
    op.drop_index('idx_health_score_risk', table_name='institution_health_scores')
    op.drop_index('idx_health_score_overall', table_name='institution_health_scores')
    op.drop_index('idx_health_score_institution', table_name='institution_health_scores')
    op.drop_index('idx_health_score_churn', table_name='institution_health_scores')
    op.drop_table('institution_health_scores')
