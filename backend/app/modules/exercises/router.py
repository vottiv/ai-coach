from fastapi import APIRouter, status

from app.core.deps import CurrentUser, DbSession
from app.modules.exercises import service
from app.modules.exercises.catalog_data import CATEGORIES
from app.modules.exercises.schemas import ExerciseCreate, ExerciseOut
from app.services.targets import MUSCLE_GROUPS

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("", response_model=list[ExerciseOut])
async def list_exercises(
    user: CurrentUser,
    db: DbSession,
    category: str | None = None,
    search: str | None = None,
) -> list[ExerciseOut]:
    items = await service.list_exercises(db, user.id, category=category, search=search)
    return [ExerciseOut.model_validate(i) for i in items]


@router.get("/meta")
async def meta() -> dict[str, list[str]]:
    """Справочники для UI: категории и мышечные группы."""
    return {"categories": CATEGORIES, "muscle_groups": MUSCLE_GROUPS}


@router.post("", response_model=ExerciseOut, status_code=status.HTTP_201_CREATED)
async def create_exercise(body: ExerciseCreate, user: CurrentUser, db: DbSession) -> ExerciseOut:
    exercise = await service.create_custom(db, user.id, body)
    await db.commit()
    return ExerciseOut.model_validate(exercise)
