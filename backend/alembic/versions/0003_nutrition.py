"""nutrition module: logs and food entries

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-31

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "nutrition_logs",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("meal_type", sa.String(length=16), nullable=False),
        sa.Column("photo_url", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_nutrition_logs_user_id", "nutrition_logs", ["user_id"])
    op.create_index("ix_nutrition_logs_date", "nutrition_logs", ["date"])

    op.create_table(
        "food_entries",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("nutrition_log_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("weight", sa.Float(), server_default="0", nullable=False),
        sa.Column("protein", sa.Float(), server_default="0", nullable=False),
        sa.Column("fat", sa.Float(), server_default="0", nullable=False),
        sa.Column("carbs", sa.Float(), server_default="0", nullable=False),
        sa.Column("calories", sa.Float(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(
            ["nutrition_log_id"], ["nutrition_logs.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_food_entries_nutrition_log_id", "food_entries", ["nutrition_log_id"])


def downgrade() -> None:
    op.drop_table("food_entries")
    op.drop_table("nutrition_logs")
