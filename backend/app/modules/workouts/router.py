from datetime import date

from fastapi import APIRouter, HTTPException, status

from app.core.deps import CurrentUser, DbSession
from app.models.workout import Workout
from app.modules.workouts import service
from app.modules.workouts.schemas import (
    CalendarOut,
    MuscleBalanceItem,
    PersonalRecordOut,
    VolumePoint,
    WorkoutCreate,
    WorkoutListItem,
    WorkoutOut,
)

router = APIRouter(prefix="/workouts", tags=["workouts"])


def _to_out(workout: Workout) -> WorkoutOut:
    out = WorkoutOut.model_validate(workout)
    out.tonnage = service.tonnage(workout)
    return out


@router.post("", response_model=WorkoutOut, status_code=status.HTTP_201_CREATED)
async def create_workout(body: WorkoutCreate, user: CurrentUser, db: DbSession) -> WorkoutOut:
    workout = await service.create_workout(db, user.id, body)
    return _to_out(workout)


@router.get("", response_model=list[WorkoutListItem])
async def list_workouts(
    user: CurrentUser,
    db: DbSession,
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[WorkoutListItem]:
    workouts = await service.list_workouts(db, user.id, from_date=from_date, to_date=to_date)
    return [
        WorkoutListItem(
            id=w.id,
            date=w.date,
            type=w.type,
            feeling=w.feeling,
            exercise_count=len(w.exercises),
            tonnage=service.tonnage(w),
        )
        for w in workouts
    ]


@router.get("/calendar", response_model=CalendarOut)
async def calendar(
    user: CurrentUser,
    db: DbSession,
    year: int,
    month: int,
) -> CalendarOut:
    if not 1 <= month <= 12:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "month must be 1..12")
    return CalendarOut.model_validate(await service.calendar(db, user.id, year, month))


@router.get("/muscle-balance", response_model=list[MuscleBalanceItem])
async def muscle_balance(user: CurrentUser, db: DbSession) -> list[MuscleBalanceItem]:
    items = await service.muscle_balance(db, user.id, user.goals or [])
    return [MuscleBalanceItem(**i) for i in items]


@router.get("/records", response_model=list[PersonalRecordOut])
async def records(user: CurrentUser, db: DbSession) -> list[PersonalRecordOut]:
    items = await service.list_records(db, user.id)
    return [PersonalRecordOut.model_validate(i) for i in items]


@router.get("/progress/volume", response_model=list[VolumePoint])
async def volume(user: CurrentUser, db: DbSession, period: str = "month") -> list[VolumePoint]:
    points = await service.volume_progress(db, user.id, period)
    return [VolumePoint(**p) for p in points]


@router.get("/{workout_id}", response_model=WorkoutOut)
async def get_workout(workout_id: int, user: CurrentUser, db: DbSession) -> WorkoutOut:
    workout = await service.get_workout(db, user.id, workout_id)
    if workout is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workout not found")
    return _to_out(workout)


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout(workout_id: int, user: CurrentUser, db: DbSession) -> None:
    ok = await service.delete_workout(db, user.id, workout_id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workout not found")
    return None
