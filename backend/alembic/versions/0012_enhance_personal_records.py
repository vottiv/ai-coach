"""enhance_personal_records

Revision ID: 0012
Revises: 0011
Create Date: 2026-06-09 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0012'
down_revision = '0011'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Добавить новые поля
    op.add_column('personal_records', sa.Column('set_id', sa.Integer(), nullable=True))
    op.add_column('personal_records', sa.Column('workout_id', sa.Integer(), nullable=True))
    op.add_column('personal_records', sa.Column('reps_at_max_weight', sa.Integer(), server_default='0', nullable=False))
    op.add_column('personal_records', sa.Column('exercise_key', sa.String(160), nullable=True))
    
    # Создать индекс на exercise_key
    op.create_index('ix_personal_records_exercise_key', 'personal_records', ['exercise_key'])
    
    # Обновить exercise_key для существующих записей
    op.execute("""
        UPDATE personal_records 
        SET exercise_key = CASE 
            WHEN exercise_id IS NOT NULL THEN CAST(exercise_id AS TEXT)
            ELSE exercise_name
        END
    """)
    
    # Сделать exercise_key обязательным
    op.alter_column('personal_records', 'exercise_key', nullable=False)


def downgrade() -> None:
    op.drop_index('ix_personal_records_exercise_key', table_name='personal_records')
    op.drop_column('personal_records', 'exercise_key')
    op.drop_column('personal_records', 'reps_at_max_weight')
    op.drop_column('personal_records', 'workout_id')
    op.drop_column('personal_records', 'set_id')