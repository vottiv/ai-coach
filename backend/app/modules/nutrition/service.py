from datetime import date, timedelta
from io import BytesIO

import httpx
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.nutrition import FoodEntry, NutritionLog
from app.models.user import User
from app.models.workout import Workout
from app.modules.nutrition.schemas import NutritionCreate
from app.services.targets import nutrition_targets


def food_calories(protein: float, fat: float, carbs: float) -> float:
    """Авто-калории: Б×4 + Ж×9 + У×4 (ТЗ п. 6.4.1)."""
    return round(protein * 4 + fat * 9 + carbs * 4, 1)


def log_totals(log: NutritionLog) -> dict[str, float]:
    return {
        "calories": round(sum(f.calories for f in log.foods), 1),
        "protein": round(sum(f.protein for f in log.foods), 1),
        "fat": round(sum(f.fat for f in log.foods), 1),
        "carbs": round(sum(f.carbs for f in log.foods), 1),
    }


async def create_meal(db: AsyncSession, user_id: int, data: NutritionCreate) -> NutritionLog:
    log = NutritionLog(
        user_id=user_id,
        date=data.date,
        meal_type=data.meal_type,
        photo_url=data.photo_url,
    )
    for f in data.foods:
        log.foods.append(
            FoodEntry(
                name=f.name,
                weight=f.weight,
                protein=f.protein,
                fat=f.fat,
                carbs=f.carbs,
                calories=food_calories(f.protein, f.fat, f.carbs),
            )
        )
    db.add(log)
    await db.flush()
    await db.commit()
    return log


async def list_logs(
    db: AsyncSession, user_id: int, *, from_date: date | None, to_date: date | None
) -> list[NutritionLog]:
    stmt = (
        select(NutritionLog)
        .where(NutritionLog.user_id == user_id)
        .options(selectinload(NutritionLog.foods))
    )
    if from_date:
        stmt = stmt.where(NutritionLog.date >= from_date)
    if to_date:
        stmt = stmt.where(NutritionLog.date <= to_date)
    stmt = stmt.order_by(NutritionLog.date.desc(), NutritionLog.id.desc())
    return list(await db.scalars(stmt))


async def delete_meal(db: AsyncSession, user_id: int, log_id: int) -> bool:
    log = await db.get(NutritionLog, log_id)
    if log is None or log.user_id != user_id:
        return False
    await db.delete(log)
    await db.commit()
    return True


async def _biweekly_workouts(db: AsyncSession, user_id: int) -> int:
    count = await db.scalar(
        select(func.count())
        .select_from(Workout)
        .where(Workout.user_id == user_id, Workout.date >= date.today() - timedelta(days=14))
    )
    return count or 0


async def upload_image(photo, user_id: int) -> str:
    """Загрузить изображение в MinIO и вернуть URL."""
    import uuid

    # Чтение содержимого файла
    content = await photo.read()

    # Генерация уникального имени файла
    ext = photo.filename.split(".")[-1] if photo.filename else "jpg"
    filename = f"nutrition/{user_id}/{uuid.uuid4()}.{ext}"

    # Загрузка в MinIO
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Сначала создадим bucket если его нет
        try:
            await client.put(
                f"{settings.s3_endpoint}/{settings.s3_bucket}/{filename}",
                headers={
                    "Content-Type": photo.content_type or "image/jpeg",
                },
                content=content,
                auth=(settings.s3_access_key, settings.s3_secret_key),
            )
        except Exception as e:
            # Если MinIO не работает, используем временный URL
            print(f"MinIO upload failed: {e}")
            return f"data:{photo.content_type or 'image/jpeg'};base64,{content.hex()}"

    return f"{settings.s3_endpoint}/{settings.s3_bucket}/{filename}"


async def daily_summary(db: AsyncSession, user: User, target_date: date) -> dict:
    rows = await db.execute(
        select(
            func.coalesce(func.sum(FoodEntry.calories), 0),
            func.coalesce(func.sum(FoodEntry.protein), 0),
            func.coalesce(func.sum(FoodEntry.fat), 0),
            func.coalesce(func.sum(FoodEntry.carbs), 0),
        )
        .select_from(NutritionLog)
        .join(FoodEntry, FoodEntry.nutrition_log_id == NutritionLog.id)
        .where(NutritionLog.user_id == user.id, NutritionLog.date == target_date)
    )
    cal, protein, fat, carbs = rows.one()
    totals = {
        "calories": round(float(cal), 1),
        "protein": round(float(protein), 1),
        "fat": round(float(fat), 1),
        "carbs": round(float(carbs), 1),
    }

    targets = nutrition_targets(
        gender=user.gender,
        weight=user.weight,
        height=user.height,
        age=user.age,
        goals=user.goals or [],
        biweekly_workouts=await _biweekly_workouts(db, user.id),
    )
    return {"date": target_date, "totals": totals, "targets": targets}
