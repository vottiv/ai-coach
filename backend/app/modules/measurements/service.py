from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.body_measurement import BodyMeasurement


async def upsert(
    db: AsyncSession, user_id: int, data: dict
) -> BodyMeasurement:
    existing = await db.scalar(
        select(BodyMeasurement).where(
            BodyMeasurement.user_id == user_id,
            BodyMeasurement.measured_at == data["measured_at"],
        )
    )
    if existing is not None:
        for k, v in data.items():
            if v is not None:
                setattr(existing, k, v)
        await db.flush()
        return existing

    m = BodyMeasurement(user_id=user_id, **data)
    db.add(m)
    await db.flush()
    return m


async def list_measurements(
    db: AsyncSession, user_id: int, limit: int = 30
) -> list[BodyMeasurement]:
    rows = await db.scalars(
        select(BodyMeasurement)
        .where(BodyMeasurement.user_id == user_id)
        .order_by(BodyMeasurement.measured_at.desc())
        .limit(limit)
    )
    return list(rows)


async def get_latest_weight(db: AsyncSession, user_id: int) -> float | None:
    m = await db.scalar(
        select(BodyMeasurement)
        .where(BodyMeasurement.user_id == user_id, BodyMeasurement.weight.isnot(None))
        .order_by(BodyMeasurement.measured_at.desc())
        .limit(1)
    )
    return m.weight if m else None


async def weight_history(
    db: AsyncSession, user_id: int, days: int = 90
) -> list[BodyMeasurement]:
    start = date.today().toordinal() - days
    rows = await db.scalars(
        select(BodyMeasurement)
        .where(
            BodyMeasurement.user_id == user_id,
            BodyMeasurement.weight.isnot(None),
            BodyMeasurement.measured_at >= date.fromordinal(start),
        )
        .order_by(BodyMeasurement.measured_at)
    )
    return list(rows)
