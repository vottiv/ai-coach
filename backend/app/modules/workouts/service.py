from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.exercise import ExerciseCatalog
from app.models.personal_record import PersonalRecord
from app.models.workout import ExerciseSet, Workout, WorkoutExercise
from app.modules.workouts.schemas import WorkoutCreate
from app.services.targets import MUSCLE_GROUPS, recommended_weekly_sets

PR_TYPES = ("max_weight", "max_reps", "max_volume")


def tonnage(workout: Workout) -> float:
    return float(
        sum(s.weight * s.reps for we in workout.exercises for s in we.sets)
    )


# --- CRUD -----------------------------------------------------------------

async def create_workout(db: AsyncSession, user_id: int, data: WorkoutCreate) -> Workout:
    workout = Workout(
        user_id=user_id,
        date=data.date,
        type=data.type,
        feeling=data.feeling,
        notes=data.notes,
        duration=data.duration,
    )
    for i, ex in enumerate(data.exercises):
        we = WorkoutExercise(
            exercise_id=ex.exercise_id, exercise_name=ex.exercise_name, order=i
        )
        for j, s in enumerate(ex.sets):
            we.sets.append(ExerciseSet(weight=s.weight, reps=s.reps, rpe=s.rpe, order=j))
        workout.exercises.append(we)

    db.add(workout)
    await db.flush()
    await _update_personal_records(db, user_id, data)
    await db.commit()
    # Граф exercises/sets построен в памяти (expire_on_commit=False) — IO не требуется.
    return workout


async def get_workout(db: AsyncSession, user_id: int, workout_id: int) -> Workout | None:
    stmt = (
        select(Workout)
        .where(Workout.id == workout_id)
        .options(selectinload(Workout.exercises).selectinload(WorkoutExercise.sets))
    )
    workout = await db.scalar(stmt)
    if workout is None or workout.user_id != user_id:
        return None
    return workout


async def list_workouts(
    db: AsyncSession, user_id: int, *, from_date: date | None, to_date: date | None
) -> list[Workout]:
    stmt = (
        select(Workout)
        .where(Workout.user_id == user_id)
        .options(selectinload(Workout.exercises).selectinload(WorkoutExercise.sets))
    )
    if from_date:
        stmt = stmt.where(Workout.date >= from_date)
    if to_date:
        stmt = stmt.where(Workout.date <= to_date)
    stmt = stmt.order_by(Workout.date.desc(), Workout.id.desc())
    return list(await db.scalars(stmt))


async def delete_workout(db: AsyncSession, user_id: int, workout_id: int) -> bool:
    workout = await get_workout(db, user_id, workout_id)
    if workout is None:
        return False
    await db.delete(workout)
    await db.commit()
    return True


# --- Personal records (ТЗ п. 8.1) ----------------------------------------

async def _update_personal_records(
    db: AsyncSession, user_id: int, data: WorkoutCreate
) -> None:
    # Кандидаты-максимумы по упражнению из текущей тренировки
    candidates: dict[int, dict[str, float]] = {}
    names: dict[int, str] = {}
    for ex in data.exercises:
        if ex.exercise_id is None or not ex.sets:
            continue
        max_weight = max(s.weight for s in ex.sets)
        max_reps = max(s.reps for s in ex.sets)
        max_volume = max(s.weight * s.reps for s in ex.sets)
        cur = candidates.setdefault(
            ex.exercise_id, {"max_weight": 0, "max_reps": 0, "max_volume": 0}
        )
        cur["max_weight"] = max(cur["max_weight"], max_weight)
        cur["max_reps"] = max(cur["max_reps"], max_reps)
        cur["max_volume"] = max(cur["max_volume"], max_volume)
        names[ex.exercise_id] = ex.exercise_name

    if not candidates:
        return

    existing = list(
        await db.scalars(
            select(PersonalRecord).where(
                PersonalRecord.user_id == user_id,
                PersonalRecord.exercise_id.in_(candidates.keys()),
            )
        )
    )
    by_key = {(pr.exercise_id, pr.type): pr for pr in existing}

    for exercise_id, maxes in candidates.items():
        for pr_type in PR_TYPES:
            value = maxes[pr_type]
            if value <= 0:
                continue
            pr = by_key.get((exercise_id, pr_type))
            if pr is None:
                db.add(
                    PersonalRecord(
                        user_id=user_id,
                        exercise_id=exercise_id,
                        exercise_name=names[exercise_id],
                        type=pr_type,
                        value=value,
                    )
                )
            elif value > pr.value:
                pr.value = value
                pr.exercise_name = names[exercise_id]
                pr.achieved_at = func.now()


async def list_records(db: AsyncSession, user_id: int) -> list[PersonalRecord]:
    stmt = (
        select(PersonalRecord)
        .where(PersonalRecord.user_id == user_id)
        .order_by(PersonalRecord.achieved_at.desc())
    )
    return list(await db.scalars(stmt))


# --- Calendar (ТЗ п. 6.2.2, п. 11) ---------------------------------------

async def calendar(db: AsyncSession, user_id: int, year: int, month: int) -> dict:
    month_start = date(year, month, 1)
    next_month = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    day_counts = await db.execute(
        select(Workout.date, func.count())
        .where(
            Workout.user_id == user_id,
            Workout.date >= month_start,
            Workout.date < next_month,
        )
        .group_by(Workout.date)
    )
    days = [{"date": d, "count": c} for d, c in day_counts.all()]
    month_total = sum(d["count"] for d in days)

    year_total = await db.scalar(
        select(func.count())
        .select_from(Workout)
        .where(
            Workout.user_id == user_id,
            Workout.date >= date(year, 1, 1),
            Workout.date < date(year + 1, 1, 1),
        )
    )
    return {"days": days, "month_total": month_total, "year_total": year_total or 0}


# --- Muscle balance (ТЗ п. 8.2) ------------------------------------------

async def muscle_balance(db: AsyncSession, user_id: int, goals: list[str]) -> list[dict]:
    week_ago = date.today() - timedelta(days=7)

    rows = await db.execute(
        select(ExerciseCatalog.muscle_groups, func.count(ExerciseSet.id))
        .select_from(Workout)
        .join(WorkoutExercise, WorkoutExercise.workout_id == Workout.id)
        .join(ExerciseSet, ExerciseSet.workout_exercise_id == WorkoutExercise.id)
        .join(ExerciseCatalog, ExerciseCatalog.id == WorkoutExercise.exercise_id)
        .where(Workout.user_id == user_id, Workout.date >= week_ago)
        .group_by(WorkoutExercise.id, ExerciseCatalog.muscle_groups)
    )

    sets_per_group: dict[str, int] = defaultdict(int)
    for groups, set_count in rows.all():
        for g in groups or []:
            sets_per_group[g] += set_count

    biweekly = await db.scalar(
        select(func.count())
        .select_from(Workout)
        .where(Workout.user_id == user_id, Workout.date >= date.today() - timedelta(days=14))
    )
    targets = recommended_weekly_sets(goals or [], biweekly or 0)

    result = []
    for group in MUSCLE_GROUPS:
        if group not in targets:  # Кардио — без целевого
            continue
        actual = sets_per_group.get(group, 0)
        target = targets[group]
        pct = round(actual / target * 100) if target else 0
        result.append(
            {
                "muscle_group": group,
                "weekly_sets": actual,
                "recommended_sets": target,
                "percentage": pct,
            }
        )
    return result


# --- Volume progress (ТЗ п. 6.3) -----------------------------------------

def _period_start(period: str) -> date:
    today = date.today()
    return {
        "week": today - timedelta(days=6),
        "month": today - timedelta(days=29),
        "3months": today - timedelta(days=89),
        "year": today - timedelta(days=364),
    }.get(period, today - timedelta(days=29))


def _bucket_label(d: date, period: str) -> str:
    if period in ("week", "month"):
        return d.isoformat()
    if period == "3months":
        monday = d - timedelta(days=d.weekday())
        return monday.isoformat()
    return d.strftime("%Y-%m")  # year → по месяцам


async def volume_progress(db: AsyncSession, user_id: int, period: str) -> list[dict]:
    start = _period_start(period)
    rows = await db.execute(
        select(Workout.date, func.coalesce(func.sum(ExerciseSet.weight * ExerciseSet.reps), 0))
        .select_from(Workout)
        .join(WorkoutExercise, WorkoutExercise.workout_id == Workout.id, isouter=True)
        .join(ExerciseSet, ExerciseSet.workout_exercise_id == WorkoutExercise.id, isouter=True)
        .where(Workout.user_id == user_id, Workout.date >= start)
        .group_by(Workout.date)
        .order_by(Workout.date)
    )
    buckets: dict[str, float] = defaultdict(float)
    for d, vol in rows.all():
        buckets[_bucket_label(d, period)] += float(vol or 0)
    return [{"label": label, "volume": buckets[label]} for label in sorted(buckets)]
