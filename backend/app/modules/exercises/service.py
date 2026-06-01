from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exercise import ExerciseCatalog
from app.modules.exercises.schemas import ExerciseCreate


async def list_exercises(
    db: AsyncSession, user_id: int, *, category: str | None, search: str | None
) -> list[ExerciseCatalog]:
    """Глобальные упражнения + кастомные текущего пользователя."""
    stmt = select(ExerciseCatalog).where(
        or_(ExerciseCatalog.is_custom.is_(False), ExerciseCatalog.created_by == user_id)
    )
    if category and category != "Все":
        stmt = stmt.where(ExerciseCatalog.category == category)
    if search:
        stmt = stmt.where(ExerciseCatalog.name.ilike(f"%{search}%"))
    stmt = stmt.order_by(ExerciseCatalog.name)
    return list(await db.scalars(stmt))


async def create_custom(
    db: AsyncSession, user_id: int, data: ExerciseCreate
) -> ExerciseCatalog:
    exercise = ExerciseCatalog(
        name=data.name,
        category=data.category,
        muscle_groups=data.muscle_groups,
        description=data.description,
        is_custom=True,
        created_by=user_id,
    )
    db.add(exercise)
    await db.flush()
    return exercise
