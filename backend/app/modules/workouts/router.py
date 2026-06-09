from datetime import date

from fastapi import APIRouter, HTTPException, status

from app.core.deps import CurrentUser, DbSession
from app.models.workout import Workout
from app.modules.workouts import service
from app.modules.workouts.schemas import (
    CalendarOut,
    ExerciseRecordSummary,
    MuscleBalanceItem,
    MuscleGroupBalance,
    PaginatedWorkouts,
    PersonalRecordOut,
    PersonalRecordSummary,
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


async def _get_dominant_muscle_groups(workout: Workout, db: DbSession) -> list[str]:
    from collections import defaultdict
    from sqlalchemy import select
    from app.models.exercise import ExerciseCatalog

    volume_per_group: defaultdict[str, float] = defaultdict(float)
    exercise_ids = [we.exercise_id for we in workout.exercises if we.exercise_id]
    
    if not exercise_ids:
        return []

    exercises = {
        ex.id: ex.muscle_groups
        for ex in await db.scalars(
            select(ExerciseCatalog).where(ExerciseCatalog.id.in_(exercise_ids))
        )
    }

    for we in workout.exercises:
        if not we.exercise_id:
            continue

        exercise_volume = sum(s.weight * s.reps for s in we.sets)
        if exercise_volume == 0:
            continue

        muscle_groups = exercises.get(we.exercise_id, [])
        for group in muscle_groups or []:
            volume_per_group[group] += exercise_volume

    if not volume_per_group:
        return []

    sorted_groups = sorted(volume_per_group.items(), key=lambda x: x[1], reverse=True)
    return [group for group, _ in sorted_groups[:3]]


@router.post("", response_model=WorkoutOut, status_code=status.HTTP_201_CREATED)
async def create_workout(body: WorkoutCreate, user: CurrentUser, db: DbSession) -> WorkoutOut:
    workout = await service.create_workout(db, user.id, body)
    return _to_out(workout)


@router.get("", response_model=PaginatedWorkouts)
async def list_workouts(
    user: CurrentUser,
    db: DbSession,
    from_date: date | None = None,
    to_date: date | None = None,
    skip: int = 0,
    limit: int = 10,
) -> PaginatedWorkouts:
    workouts, total = await service.list_workouts(
        db, user.id, from_date=from_date, to_date=to_date, skip=skip, limit=limit
    )
    
    muscle_groups_map = {
        w.id: await _get_dominant_muscle_groups(w, db)
        for w in workouts
    }
    
    return PaginatedWorkouts(
        items=[
            WorkoutListItem(
                id=w.id,
                date=w.date,
                type=w.type,
                feeling=w.feeling,
                exercise_count=len(w.exercises),
                tonnage=service.tonnage(w),
                intensity=w.intensity,
                muscle_groups=muscle_groups_map[w.id],
            )
            for w in workouts
        ],
        total=total,
        skip=skip,
        limit=limit,
    )


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


@router.get("/muscle-balance/categories", response_model=list[MuscleGroupBalance])
async def muscle_balance_categories(user: CurrentUser, db: DbSession) -> list[MuscleGroupBalance]:
    items = await service.muscle_balance_by_category(db, user.id, user.goals or [])
    return [MuscleGroupBalance(**i) for i in items]


@router.get("/records", response_model=list[PersonalRecordOut])
async def records(user: CurrentUser, db: DbSession) -> list[PersonalRecordOut]:
    items = await service.list_records(db, user.id)
    return [PersonalRecordOut.model_validate(i) for i in items]


@router.get("/records/summary", response_model=list[PersonalRecordSummary])
async def exercise_records_summary(
    user: CurrentUser,
    db: DbSession,
    exercise_ids: str | None = None,
) -> list[PersonalRecordSummary]:
    ids = None
    if exercise_ids:
        ids = [int(x) for x in exercise_ids.split(",")]
    
    items = await service.exercise_records_summary(db, user.id, ids)
    return [PersonalRecordSummary(**item) for item in items]


@router.get("/records/{exercise_key}/history", response_model=list[PersonalRecordOut])
async def pr_history(
    exercise_key: str,
    user: CurrentUser,
    db: DbSession,
    pr_type: str = "max_weight"
) -> list[PersonalRecordOut]:
    records = await service.get_pr_history(db, user.id, exercise_key, pr_type)
    return [PersonalRecordOut.model_validate(r) for r in records]


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


@router.put("/{workout_id}", response_model=WorkoutOut)
async def update_workout(
    workout_id: int,
    body: WorkoutCreate,
    user: CurrentUser,
    db: DbSession,
) -> WorkoutOut:
    workout = await service.update_workout(db, user.id, workout_id, body)
    if workout is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workout not found")
    return _to_out(workout)


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout(workout_id: int, user: CurrentUser, db: DbSession) -> None:
    ok = await service.delete_workout(db, user.id, workout_id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workout not found")
    return None
