"""Add birthdate to users, create body_measurements table

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-01

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("birthdate", sa.Date(), nullable=True))

    op.create_table(
        "body_measurements",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("measured_at", sa.Date(), nullable=False),
        sa.Column("weight", sa.Float(), nullable=True),
        sa.Column("bicep", sa.Float(), nullable=True),
        sa.Column("shoulders", sa.Float(), nullable=True),
        sa.Column("chest", sa.Float(), nullable=True),
        sa.Column("waist", sa.Float(), nullable=True),
        sa.Column("glutes", sa.Float(), nullable=True),
        sa.Column("hips", sa.Float(), nullable=True),
        sa.Column("calves", sa.Float(), nullable=True),
        sa.Column("notes", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_bm_user_id", "body_measurements", ["user_id"])
    op.create_index("ix_bm_measured_at", "body_measurements", ["measured_at"])


def downgrade() -> None:
    op.drop_index("ix_bm_measured_at", table_name="body_measurements")
    op.drop_index("ix_bm_user_id", table_name="body_measurements")
    op.drop_table("body_measurements")
    op.drop_column("users", "birthdate")
