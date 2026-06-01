"""workouts module: exercises, workouts, sets, personal records

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-31

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "exercise_catalog",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column(
            "muscle_groups", postgresql.JSONB(), server_default=sa.text("'[]'::jsonb"), nullable=False
        ),
        sa.Column("is_custom", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_by", sa.BigInteger(), nullable=True),
        sa.Column("description", sa.String(length=1024), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_exercise_catalog_name", "exercise_catalog", ["name"])
    op.create_index("ix_exercise_catalog_category", "exercise_catalog", ["category"])
    op.create_index("ix_exercise_catalog_is_custom", "exercise_catalog", ["is_custom"])
    op.create_index("ix_exercise_catalog_created_by", "exercise_catalog", ["created_by"])

    op.create_table(
        "workouts",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("type", sa.String(length=16), nullable=False),
        sa.Column("duration", sa.Integer(), nullable=True),
        sa.Column("feeling", sa.Integer(), nullable=True),
        sa.Column("notes", sa.String(length=2048), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_workouts_user_id", "workouts", ["user_id"])
    op.create_index("ix_workouts_date", "workouts", ["date"])

    op.create_table(
        "workout_exercises",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("workout_id", sa.BigInteger(), nullable=False),
        sa.Column("exercise_id", sa.BigInteger(), nullable=True),
        sa.Column("exercise_name", sa.String(length=160), nullable=False),
        sa.Column("order", sa.Integer(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["workout_id"], ["workouts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercise_catalog.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_workout_exercises_workout_id", "workout_exercises", ["workout_id"])
    op.create_index("ix_workout_exercises_exercise_id", "workout_exercises", ["exercise_id"])

    op.create_table(
        "exercise_sets",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("workout_exercise_id", sa.BigInteger(), nullable=False),
        sa.Column("weight", sa.Float(), server_default="0", nullable=False),
        sa.Column("reps", sa.Integer(), server_default="0", nullable=False),
        sa.Column("rpe", sa.Float(), nullable=True),
        sa.Column("order", sa.Integer(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(
            ["workout_exercise_id"], ["workout_exercises.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_exercise_sets_workout_exercise_id", "exercise_sets", ["workout_exercise_id"])

    op.create_table(
        "personal_records",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("exercise_id", sa.BigInteger(), nullable=True),
        sa.Column("exercise_name", sa.String(length=160), nullable=False),
        sa.Column("type", sa.String(length=16), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("achieved_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercise_catalog.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "exercise_id", "type", name="uq_pr_user_exercise_type"),
    )
    op.create_index("ix_personal_records_user_id", "personal_records", ["user_id"])
    op.create_index("ix_personal_records_exercise_id", "personal_records", ["exercise_id"])


def downgrade() -> None:
    op.drop_table("personal_records")
    op.drop_table("exercise_sets")
    op.drop_table("workout_exercises")
    op.drop_table("workouts")
    op.drop_table("exercise_catalog")
