from fastapi import APIRouter, HTTPException, status

from app.core.deps import CurrentUser, DbSession
from app.modules.measurements import service
from app.modules.measurements.schemas import MeasurementIn, MeasurementOut, MeasurementUpdate

router = APIRouter(prefix="/measurements", tags=["measurements"])


async def _own(db: DbSession, user: CurrentUser, measurement_id: int):
    m = await service.get_by_id(db, measurement_id, user.id)
    if m is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Замер не найден")
    return m


@router.get("", response_model=list[MeasurementOut])
async def list_all(user: CurrentUser, db: DbSession, limit: int = 90) -> list[MeasurementOut]:
    rows = await service.list_measurements(db, user.id, limit)
    return [MeasurementOut.model_validate(m) for m in rows]


@router.post("", response_model=MeasurementOut, status_code=201)
async def create(body: MeasurementIn, user: CurrentUser, db: DbSession) -> MeasurementOut:
    data = body.model_dump()
    m = await service.upsert(db, user.id, data)
    if body.weight is not None:
        user.weight = body.weight
    await db.commit()
    await db.refresh(m)
    return MeasurementOut.model_validate(m)


@router.delete("/{measurement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_measurement(measurement_id: int, user: CurrentUser, db: DbSession) -> None:
    m = await _own(db, user, measurement_id)
    await service.delete_measurement(db, m)
    await db.commit()


@router.put("/{measurement_id}", response_model=MeasurementOut)
async def update_measurement(
    measurement_id: int, body: MeasurementUpdate, user: CurrentUser, db: DbSession
) -> MeasurementOut:
    m = await _own(db, user, measurement_id)
    data = body.model_dump(exclude_unset=True)
    m = await service.update(db, m, data)
    if body.weight is not None:
        user.weight = body.weight
    await db.commit()
    await db.refresh(m)
    return MeasurementOut.model_validate(m)
