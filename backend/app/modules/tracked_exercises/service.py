from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.tracked_exercise import TrackedExercise
from app.models.user import User


async def get_tracked_exercises(db: AsyncSession, user_id: int) -> list[TrackedExercise]:
    stmt = (
        select(TrackedExercise)
        .where(TrackedExercise.user_id == user_id)
        .order_by(TrackedExercise.created_at.desc())
    )
    return list(await db.scalars(stmt))


async def add_tracked_exercise(db: AsyncSession, user_id: int, exercise_id: int) -> TrackedExercise:
    existing = await db.scalar(
        select(TrackedExercise).where(
            TrackedExercise.user_id == user_id,
            TrackedExercise.exercise_id == exercise_id,
        )
    )
    if existing:
        return existing
    
    tracked = TrackedExercise(user_id=user_id, exercise_id=exercise_id)
    db.add(tracked)
    await db.commit()
    await db.refresh(tracked)
    return tracked


async def remove_tracked_exercise(db: AsyncSession, user_id: int, exercise_id: int) -> bool:
    tracked = await db.scalar(
        select(TrackedExercise).where(
            TrackedExercise.user_id == user_id,
            TrackedExercise.exercise_id == exercise_id,
        )
    )
    if not tracked:
        return False
    
    await db.delete(tracked)
    await db.commit()
    return True