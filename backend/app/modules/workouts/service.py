from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.body_measurement import BodyMeasurement
from app.models.exercise import ExerciseCatalog
from app.models.personal_record import PersonalRecord
from app.models.workout import ExerciseSet, Workout, WorkoutExercise
from app.modules.workouts.schemas import WorkoutCreate
from app.services.targets import MUSCLE_GROUPS, recommended_weekly_sets

PR_TYPES = ("max_weight", "max_reps", "max_volume")


async def _get_user_bodyweight(db: AsyncSession, user_id: int, workout_date: date) -> float | None:
    from app.models.user import User
    
    user = await db.scalar(select(User).where(User.id == user_id))
    if user and user.weight:
        return user.weight
    
    measurement = await db.scalar(
        select(BodyMeasurement.weight)
        .where(BodyMeasurement.user_id == user_id)
        .where(BodyMeasurement.weight.isnot(None))
        .where(BodyMeasurement.measured_at <= workout_date)
        .order_by(BodyMeasurement.measured_at.desc())
        .limit(1)
    )
    return measurement


def tonnage(workout: Workout) -> float:
    return float(
        sum(
            (s.calculated_weight or s.weight) * s.reps 
            for we in workout.exercises 
            for s in we.sets
        )
    )


# --- CRUD -----------------------------------------------------------------

async def create_workout(db: AsyncSession, user_id: int, data: WorkoutCreate) -> Workout:
    bodyweight = await _get_user_bodyweight(db, user_id, data.date)
    
    workout = Workout(
        user_id=user_id,
        date=data.date,
        type=data.type,
        feeling=data.feeling,
        notes=data.notes,
        duration=data.duration,
    )
    
    for i, ex in enumerate(data.exercises):
        exercise_catalog = None
        if ex.exercise_id:
            exercise_catalog = await db.scalar(
                select(ExerciseCatalog).where(ExerciseCatalog.id == ex.exercise_id)
            )
        
        we = WorkoutExercise(
            exercise_id=ex.exercise_id,
            exercise_name=ex.exercise_name,
            order=i,
            superset_id=ex.superset_id,
            superset_order=ex.superset_order,
        )
        
        for j, s in enumerate(ex.sets):
            uses_bodyweight = s.uses_bodyweight or (
                exercise_catalog and exercise_catalog.equipment_type == "bodyweight"
            )
            
            bodyweight_percent = s.bodyweight_percent
            if uses_bodyweight and bodyweight_percent is None and exercise_catalog:
                bodyweight_percent = exercise_catalog.default_bodyweight_percent
            
            calculated_weight = None
            bodyweight_used = None
            
            if uses_bodyweight and bodyweight:
                bodyweight_used = bodyweight
                if bodyweight_percent:
                    calculated_weight = bodyweight * (bodyweight_percent / 100)
                else:
                    calculated_weight = bodyweight
            
            we.sets.append(
                ExerciseSet(
                    weight=s.weight,
                    reps=s.reps,
                    rpe=s.rpe,
                    order=j,
                    uses_bodyweight=uses_bodyweight,
                    bodyweight_percent=bodyweight_percent,
                    bodyweight_used=bodyweight_used,
                    calculated_weight=calculated_weight,
                )
            )
        
        workout.exercises.append(we)

    db.add(workout)
    await db.flush()
    await _update_personal_records(db, user_id, data)
    await db.commit()
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
    db: AsyncSession,
    user_id: int,
    *,
    from_date: date | None,
    to_date: date | None,
    skip: int = 0,
    limit: int = 10,
) -> tuple[list[Workout], int]:
    count_stmt = select(func.count(Workout.id)).where(Workout.user_id == user_id)
    stmt = (
        select(Workout)
        .where(Workout.user_id == user_id)
        .options(selectinload(Workout.exercises).selectinload(WorkoutExercise.sets))
    )
    if from_date:
        count_stmt = count_stmt.where(Workout.date >= from_date)
        stmt = stmt.where(Workout.date >= from_date)
    if to_date:
        count_stmt = count_stmt.where(Workout.date <= to_date)
        stmt = stmt.where(Workout.date <= to_date)

    total = (await db.scalar(count_stmt)) or 0

    stmt = stmt.order_by(Workout.date.desc(), Workout.id.desc()).offset(skip).limit(limit)
    workouts = list(await db.scalars(stmt))
    return workouts, total


async def delete_workout(db: AsyncSession, user_id: int, workout_id: int) -> bool:
    workout = await get_workout(db, user_id, workout_id)
    if workout is None:
        return False
    await db.delete(workout)
    await db.commit()
    return True


async def update_workout(db: AsyncSession, user_id: int, workout_id: int, data: WorkoutCreate) -> Workout | None:
    workout = await get_workout(db, user_id, workout_id)
    if workout is None:
        return None

    workout.date = data.date
    workout.type = data.type
    workout.feeling = data.feeling
    workout.notes = data.notes
    workout.duration = data.duration

    for we in workout.exercises:
        for s in we.sets:
            await db.delete(s)
    for we in workout.exercises:
        await db.delete(we)
    workout.exercises.clear()

    bodyweight = await _get_user_bodyweight(db, user_id, data.date)

    for i, ex in enumerate(data.exercises):
        exercise_catalog = None
        if ex.exercise_id:
            exercise_catalog = await db.scalar(
                select(ExerciseCatalog).where(ExerciseCatalog.id == ex.exercise_id)
            )
        
        we = WorkoutExercise(
            exercise_id=ex.exercise_id,
            exercise_name=ex.exercise_name,
            order=i,
            workout_id=workout.id,
            superset_id=ex.superset_id,
            superset_order=ex.superset_order,
        )
        
        for j, s in enumerate(ex.sets):
            uses_bodyweight = s.uses_bodyweight or (
                exercise_catalog and exercise_catalog.equipment_type == "bodyweight"
            )
            
            bodyweight_percent = s.bodyweight_percent
            if uses_bodyweight and bodyweight_percent is None and exercise_catalog:
                bodyweight_percent = exercise_catalog.default_bodyweight_percent
            
            calculated_weight = None
            bodyweight_used = None
            
            if uses_bodyweight and bodyweight:
                bodyweight_used = bodyweight
                if bodyweight_percent:
                    calculated_weight = bodyweight * (bodyweight_percent / 100)
                else:
                    calculated_weight = bodyweight
            
            we.sets.append(
                ExerciseSet(
                    weight=s.weight,
                    reps=s.reps,
                    rpe=s.rpe,
                    order=j,
                    uses_bodyweight=uses_bodyweight,
                    bodyweight_percent=bodyweight_percent,
                    bodyweight_used=bodyweight_used,
                    calculated_weight=calculated_weight,
                )
            )
        
        workout.exercises.append(we)

    await db.flush()
    await _update_personal_records(db, user_id, data)
    await db.commit()
    return workout


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


async def exercise_records_summary(db: AsyncSession, user_id: int) -> list[dict]:
    stmt = (
        select(
            ExerciseCatalog.id.label("exercise_id"),
            ExerciseCatalog.name.label("exercise_name"),
            func.max(ExerciseSet.weight).label("max_weight"),
        )
        .select_from(Workout)
        .join(WorkoutExercise, WorkoutExercise.workout_id == Workout.id)
        .join(ExerciseSet, ExerciseSet.workout_exercise_id == WorkoutExercise.id)
        .join(ExerciseCatalog, ExerciseCatalog.id == WorkoutExercise.exercise_id)
        .where(Workout.user_id == user_id, WorkoutExercise.exercise_id.isnot(None))
        .group_by(ExerciseCatalog.id, ExerciseCatalog.name)
        .order_by(func.max(ExerciseSet.weight).desc())
    )
    results = []

    rows = await db.execute(stmt)
    max_weights = {row.exercise_id: row.max_weight for row in rows}

    for exercise_id, max_weight in max_weights.items():
        if max_weight == 0:
            continue

        max_reps_stmt = (
            select(func.max(ExerciseSet.reps))
            .select_from(Workout)
            .join(WorkoutExercise, WorkoutExercise.workout_id == Workout.id)
            .join(ExerciseSet, ExerciseSet.workout_exercise_id == WorkoutExercise.id)
            .where(
                Workout.user_id == user_id,
                WorkoutExercise.exercise_id == exercise_id,
                ExerciseSet.weight == max_weight,
            )
        )
        max_reps = (await db.scalar(max_reps_stmt)) or 0

        exercise = await db.scalar(select(ExerciseCatalog).where(ExerciseCatalog.id == exercise_id))
        if exercise:
            results.append({
                "exercise_id": exercise_id,
                "exercise_name": exercise.name,
                "max_weight": float(max_weight),
                "max_reps_at_max_weight": max_reps,
            })

    return results


CATEGORY_TO_MUSCLE_GROUPS = {
    "Грудь": ["Грудь"],
    "Спина": ["Широчайшие", "Трапеции"],
    "Плечи": ["Плечи передние", "Плечи средние", "Плечи задние"],
    "Руки": ["Бицепс", "Трицепс", "Предплечья"],
    "Ноги": ["Квадрицепсы", "Бицепс бедра", "Икры", "Ягодицы"],
    "Кор": ["Пресс", "Косые"],
    "Кардио": ["Кардио"],
    "Всё тело": ["Поясница"],
}


async def muscle_balance_by_category(db: AsyncSession, user_id: int, goals: list[str]) -> list[dict]:
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
    for category, groups in CATEGORY_TO_MUSCLE_GROUPS.items():
        category_sets = sum(sets_per_group.get(g, 0) for g in groups)
        category_target = sum(targets.get(g, 0) for g in groups if g in targets)
        category_pct = round(category_sets / category_target * 100) if category_target else 0

        category_groups = []
        for group in groups:
            if group not in targets:
                continue
            actual = sets_per_group.get(group, 0)
            target = targets[group]
            pct = round(actual / target * 100) if target else 0
            category_groups.append({
                "muscle_group": group,
                "weekly_sets": actual,
                "recommended_sets": target,
                "percentage": pct,
            })

        result.append({
            "category": category,
            "weekly_sets": category_sets,
            "recommended_sets": category_target,
            "percentage": category_pct,
            "groups": category_groups,
        })

    return result
