from fastapi import APIRouter, HTTPException, status

from app.core.deps import CurrentUser, DbSession
from app.modules.tracked_exercises import schemas, service
from app.modules.tracked_exercises.schemas import TrackedExerciseOut

router = APIRouter(prefix="/tracked-exercises", tags=["tracked-exercises"])


@router.get("", response_model=list[int])
async def list_tracked_exercises(user: CurrentUser, db: DbSession) -> list[int]:
    tracked = await service.get_tracked_exercises(db, user.id)
    return [t.exercise_id for t in tracked]


@router.post("", response_model=TrackedExerciseOut, status_code=status.HTTP_201_CREATED)
async def add_tracked_exercise(
    body: schemas.TrackedExerciseCreate, user: CurrentUser, db: DbSession
) -> TrackedExerciseOut:
    tracked = await service.add_tracked_exercise(db, user.id, body.exercise_id)
    return TrackedExerciseOut.model_validate(tracked)


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_tracked_exercise(
    exercise_id: int, user: CurrentUser, db: DbSession
) -> None:
    ok = await service.remove_tracked_exercise(db, user.id, exercise_id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tracked exercise not found")
    return None