"""subjective module: morning/evening logs

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-31

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "subjective_logs",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("slot", sa.String(length=16), nullable=False),
        sa.Column("sleep_quality", sa.Integer(), nullable=True),
        sa.Column("energy", sa.Integer(), nullable=True),
        sa.Column("mood", sa.Integer(), nullable=True),
        sa.Column("soreness", sa.Integer(), nullable=True),
        sa.Column("motivation", sa.Integer(), nullable=True),
        sa.Column("stress", sa.Integer(), nullable=True),
        sa.Column("fatigue", sa.Integer(), nullable=True),
        sa.Column("satisfaction", sa.Integer(), nullable=True),
        sa.Column("body_weight", sa.Float(), nullable=True),
        sa.Column("notes", sa.String(length=2048), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "date", "slot", name="uq_subjective_user_date_slot"),
    )
    op.create_index("ix_subjective_logs_user_id", "subjective_logs", ["user_id"])
    op.create_index("ix_subjective_logs_date", "subjective_logs", ["date"])


def downgrade() -> None:
    op.drop_table("subjective_logs")
