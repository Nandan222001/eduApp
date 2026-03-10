"""add ml prediction tables

Revision ID: add_ml_prediction_001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_ml_prediction_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ml_models table
    op.create_table(
        'ml_models',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('model_type', sa.Enum('REGRESSION', 'CLASSIFICATION', 'TIME_SERIES', name='modeltype'), nullable=False),
        sa.Column('prediction_type', sa.Enum('EXAM_PERFORMANCE', 'OVERALL_PERCENTAGE', 'SUBJECT_SCORE', 'PASS_FAIL', name='predictiontype'), nullable=False),
        sa.Column('algorithm', sa.String(length=100), nullable=False),
        sa.Column('hyperparameters', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('feature_names', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('target_column', sa.String(length=100), nullable=False),
        sa.Column('status', sa.Enum('TRAINING', 'ACTIVE', 'DEPRECATED', 'FAILED', name='modelstatus'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_ml_model_institution', 'ml_models', ['institution_id'])
    op.create_index('idx_ml_model_type', 'ml_models', ['model_type'])
    op.create_index('idx_ml_model_prediction_type', 'ml_models', ['prediction_type'])
    op.create_index('idx_ml_model_status', 'ml_models', ['status'])
    op.create_index('idx_ml_model_active', 'ml_models', ['is_active'])

    # Create ml_model_versions table
    op.create_table(
        'ml_model_versions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.Integer(), nullable=False),
        sa.Column('version', sa.String(length=50), nullable=False),
        sa.Column('model_path', sa.String(length=500), nullable=False),
        sa.Column('s3_key', sa.String(length=500), nullable=True),
        sa.Column('scaler_path', sa.String(length=500), nullable=True),
        sa.Column('scaler_s3_key', sa.String(length=500), nullable=True),
        sa.Column('training_metrics', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('validation_metrics', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('test_metrics', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('cross_validation_scores', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('feature_importance', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('training_samples', sa.Integer(), nullable=False),
        sa.Column('training_date', sa.DateTime(), nullable=False),
        sa.Column('is_deployed', sa.Boolean(), nullable=False),
        sa.Column('deployed_at', sa.DateTime(), nullable=True),
        sa.Column('deployed_by', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['model_id'], ['ml_models.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['deployed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_model_version_model', 'ml_model_versions', ['model_id'])
    op.create_index('idx_model_version_deployed', 'ml_model_versions', ['is_deployed'])

    # Create performance_predictions table
    op.create_table(
        'performance_predictions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.Integer(), nullable=False),
        sa.Column('model_version_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('predicted_value', sa.Float(), nullable=False),
        sa.Column('confidence_lower', sa.Float(), nullable=True),
        sa.Column('confidence_upper', sa.Float(), nullable=True),
        sa.Column('confidence_level', sa.Float(), nullable=True),
        sa.Column('input_features', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('feature_contributions', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('prediction_context', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_scenario', sa.Boolean(), nullable=False),
        sa.Column('predicted_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['model_id'], ['ml_models.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['model_version_id'], ['ml_model_versions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_prediction_institution', 'performance_predictions', ['institution_id'])
    op.create_index('idx_prediction_model', 'performance_predictions', ['model_id'])
    op.create_index('idx_prediction_model_version', 'performance_predictions', ['model_version_id'])
    op.create_index('idx_prediction_student', 'performance_predictions', ['student_id'])
    op.create_index('idx_prediction_scenario', 'performance_predictions', ['is_scenario'])
    op.create_index('idx_prediction_date', 'performance_predictions', ['predicted_at'])

    # Create prediction_scenarios table
    op.create_table(
        'prediction_scenarios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('base_prediction_id', sa.Integer(), nullable=False),
        sa.Column('scenario_name', sa.String(length=200), nullable=False),
        sa.Column('scenario_description', sa.Text(), nullable=True),
        sa.Column('modified_features', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('predicted_value', sa.Float(), nullable=False),
        sa.Column('confidence_lower', sa.Float(), nullable=True),
        sa.Column('confidence_upper', sa.Float(), nullable=True),
        sa.Column('value_change', sa.Float(), nullable=False),
        sa.Column('percentage_change', sa.Float(), nullable=False),
        sa.Column('recommendations', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['base_prediction_id'], ['performance_predictions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_scenario_base_prediction', 'prediction_scenarios', ['base_prediction_id'])


def downgrade() -> None:
    op.drop_index('idx_scenario_base_prediction', table_name='prediction_scenarios')
    op.drop_table('prediction_scenarios')
    
    op.drop_index('idx_prediction_date', table_name='performance_predictions')
    op.drop_index('idx_prediction_scenario', table_name='performance_predictions')
    op.drop_index('idx_prediction_student', table_name='performance_predictions')
    op.drop_index('idx_prediction_model_version', table_name='performance_predictions')
    op.drop_index('idx_prediction_model', table_name='performance_predictions')
    op.drop_index('idx_prediction_institution', table_name='performance_predictions')
    op.drop_table('performance_predictions')
    
    op.drop_index('idx_model_version_deployed', table_name='ml_model_versions')
    op.drop_index('idx_model_version_model', table_name='ml_model_versions')
    op.drop_table('ml_model_versions')
    
    op.drop_index('idx_ml_model_active', table_name='ml_models')
    op.drop_index('idx_ml_model_status', table_name='ml_models')
    op.drop_index('idx_ml_model_prediction_type', table_name='ml_models')
    op.drop_index('idx_ml_model_type', table_name='ml_models')
    op.drop_index('idx_ml_model_institution', table_name='ml_models')
    op.drop_table('ml_models')
    
    sa.Enum(name='modeltype').drop(op.get_bind(), checkfirst=False)
    sa.Enum(name='predictiontype').drop(op.get_bind(), checkfirst=False)
    sa.Enum(name='modelstatus').drop(op.get_bind(), checkfirst=False)
