"""split measurements to left_right

Revision ID: 98ba9055b714
Revises: 0006
Create Date: 2026-06-02 17:19:13.428672

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = '98ba9055b714'
down_revision: str | None = '0006'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('body_measurements', sa.Column('bicep_left', sa.Float(), nullable=True))
    op.add_column('body_measurements', sa.Column('bicep_right', sa.Float(), nullable=True))
    op.add_column('body_measurements', sa.Column('hips_left', sa.Float(), nullable=True))
    op.add_column('body_measurements', sa.Column('hips_right', sa.Float(), nullable=True))
    op.add_column('body_measurements', sa.Column('calves_left', sa.Float(), nullable=True))
    op.add_column('body_measurements', sa.Column('calves_right', sa.Float(), nullable=True))

    op.execute("UPDATE body_measurements SET bicep_left = bicep, bicep_right = bicep WHERE bicep IS NOT NULL")
    op.execute("UPDATE body_measurements SET hips_left = hips, hips_right = hips WHERE hips IS NOT NULL")
    op.execute("UPDATE body_measurements SET calves_left = calves, calves_right = calves WHERE calves IS NOT NULL")

    op.drop_column('body_measurements', 'bicep')
    op.drop_column('body_measurements', 'hips')
    op.drop_column('body_measurements', 'calves')


def downgrade() -> None:
    op.add_column('body_measurements', sa.Column('bicep', sa.Float(), nullable=True))
    op.add_column('body_measurements', sa.Column('hips', sa.Float(), nullable=True))
    op.add_column('body_measurements', sa.Column('calves', sa.Float(), nullable=True))

    op.execute("UPDATE body_measurements SET bicep = COALESCE(bicep_left, bicep_right) WHERE bicep_left IS NOT NULL OR bicep_right IS NOT NULL")
    op.execute("UPDATE body_measurements SET hips = COALESCE(hips_left, hips_right) WHERE hips_left IS NOT NULL OR hips_right IS NOT NULL")
    op.execute("UPDATE body_measurements SET calves = COALESCE(calves_left, calves_right) WHERE calves_left IS NOT NULL OR calves_right IS NOT NULL")

    op.drop_column('body_measurements', 'bicep_left')
    op.drop_column('body_measurements', 'bicep_right')
    op.drop_column('body_measurements', 'hips_left')
    op.drop_column('body_measurements', 'hips_right')
    op.drop_column('body_measurements', 'hips_left')
    op.drop_column('body_measurements', 'hips_right')
    op.drop_column('body_measurements', 'calves_left')
    op.drop_column('body_measurements', 'calves_right')