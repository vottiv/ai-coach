"""health module: analyses and biomarkers

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-31

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "health_analyses",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("source", sa.String(length=160), nullable=True),
        sa.Column("photo_url", sa.String(length=512), nullable=True),
        sa.Column("raw_data", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_health_analyses_user_id", "health_analyses", ["user_id"])
    op.create_index("ix_health_analyses_date", "health_analyses", ["date"])

    op.create_table(
        "biomarkers",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("analysis_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("unit", sa.String(length=32), nullable=True),
        sa.Column("reference_min", sa.Float(), nullable=True),
        sa.Column("reference_max", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=8), server_default="normal", nullable=False),
        sa.ForeignKeyConstraint(["analysis_id"], ["health_analyses.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_biomarkers_analysis_id", "biomarkers", ["analysis_id"])


def downgrade() -> None:
    op.drop_table("biomarkers")
    op.drop_table("health_analyses")
