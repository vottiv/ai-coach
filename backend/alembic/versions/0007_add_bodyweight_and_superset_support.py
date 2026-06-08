"""add bodyweight and superset support

Revision ID: 0007
Revises: 98ba9055b714
Create Date: 2026-06-08 00:00:00.000000

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = '0007'
down_revision: str | None = '98ba9055b714'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('exercise_catalog', sa.Column('equipment_type', sa.String(length=32), nullable=False, server_default='other'))
    op.add_column('exercise_catalog', sa.Column('default_bodyweight_percent', sa.Float(), nullable=True))
    
    op.add_column('workout_exercises', sa.Column('superset_id', sa.String(length=32), nullable=True))
    op.create_index(op.f('ix_workout_exercises_superset_id'), 'workout_exercises', ['superset_id'], unique=False)
    op.add_column('workout_exercises', sa.Column('superset_order', sa.Integer(), nullable=True))
    
    op.add_column('exercise_sets', sa.Column('uses_bodyweight', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('exercise_sets', sa.Column('bodyweight_percent', sa.Float(), nullable=True))
    op.add_column('exercise_sets', sa.Column('bodyweight_used', sa.Float(), nullable=True))
    op.add_column('exercise_sets', sa.Column('calculated_weight', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('exercise_sets', 'calculated_weight')
    op.drop_column('exercise_sets', 'bodyweight_used')
    op.drop_column('exercise_sets', 'bodyweight_percent')
    op.drop_column('exercise_sets', 'uses_bodyweight')
    
    op.drop_column('workout_exercises', 'superset_order')
    op.drop_index(op.f('ix_workout_exercises_superset_id'), table_name='workout_exercises')
    op.drop_column('workout_exercises', 'superset_id')
    
    op.drop_column('exercise_catalog', 'default_bodyweight_percent')
    op.drop_column('exercise_catalog', 'equipment_type')