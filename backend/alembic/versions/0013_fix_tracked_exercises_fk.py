"""fix_tracked_exercises_fk

Revision ID: 0013
Revises: 0012
Create Date: 2026-06-09 15:30:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '0013'
down_revision = '0012'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Удаляем старый FK и создаём правильный
    op.execute("""
        ALTER TABLE tracked_exercises 
        DROP CONSTRAINT IF EXISTS tracked_exercises_exercise_id_fkey;
    """)
    
    op.execute("""
        ALTER TABLE tracked_exercises 
        ADD CONSTRAINT tracked_exercises_exercise_id_fkey 
        FOREIGN KEY (exercise_id) REFERENCES exercise_catalog(id) ON DELETE CASCADE;
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE tracked_exercises 
        DROP CONSTRAINT tracked_exercises_exercise_id_fkey;
    """)
    
    op.execute("""
        ALTER TABLE tracked_exercises 
        ADD CONSTRAINT tracked_exercises_exercise_id_fkey 
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE;
    """)