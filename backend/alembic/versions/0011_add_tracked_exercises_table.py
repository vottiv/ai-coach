"""add_tracked_exercises_table

Revision ID: 0011
Revises: 0010
Create Date: 2026-06-09 13:35:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0011'
down_revision = '0010'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'tracked_exercises',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('exercise_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercise_catalog.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'exercise_id', name='uq_user_exercise')
    )
    op.create_index(op.f('ix_tracked_exercises_user_id'), 'tracked_exercises', ['user_id'], unique=False)
    op.create_index(op.f('ix_tracked_exercises_exercise_id'), 'tracked_exercises', ['exercise_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_tracked_exercises_exercise_id'), table_name='tracked_exercises')
    op.drop_index(op.f('ix_tracked_exercises_user_id'), table_name='tracked_exercises')
    op.drop_table('tracked_exercises')