from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subjective import SubjectiveLog
from app.modules.subjective.schemas import SubjectiveIn

# Поля, относящиеся к конкретному слоту (чтобы не затирать чужие при upsert).
_SLOT_FIELDS = {
    "morning": ("sleep_quality", "energy", "mood", "soreness", "motivation", "body_weight", "notes"),
    "evening": ("energy", "stress", "mood", "fatigue", "satisfaction", "notes"),
}


async def upsert(db: AsyncSession, user_id: int, data: SubjectiveIn) -> SubjectiveLog:
    """Одна запись на (user, date, slot); повторный POST редактирует её."""
    existing = await db.scalar(
        select(SubjectiveLog).where(
            SubjectiveLog.user_id == user_id,
            SubjectiveLog.date == data.date,
            SubjectiveLog.slot == data.slot,
        )
    )
    fields = _SLOT_FIELDS[data.slot]
    log = existing or SubjectiveLog(user_id=user_id, date=data.date, slot=data.slot)
    for field in fields:
        setattr(log, field, getattr(data, field))
    if existing is None:
        db.add(log)
    await db.flush()
    await db.commit()
    await db.refresh(log)
    return log


async def list_logs(
    db: AsyncSession, user_id: int, *, from_date: date | None, to_date: date | None
) -> list[SubjectiveLog]:
    stmt = select(SubjectiveLog).where(SubjectiveLog.user_id == user_id)
    if from_date:
        stmt = stmt.where(SubjectiveLog.date >= from_date)
    if to_date:
        stmt = stmt.where(SubjectiveLog.date <= to_date)
    stmt = stmt.order_by(SubjectiveLog.date, SubjectiveLog.slot)
    return list(await db.scalars(stmt))


async def get_day(db: AsyncSession, user_id: int, target_date: date) -> dict:
    logs = await db.scalars(
        select(SubjectiveLog).where(
            SubjectiveLog.user_id == user_id, SubjectiveLog.date == target_date
        )
    )
    result: dict = {"date": target_date, "morning": None, "evening": None}
    for log in logs:
        result[log.slot] = log
    return result
