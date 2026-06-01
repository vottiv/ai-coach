from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.modules.measurements import service
from app.modules.measurements.schemas import MeasurementIn, MeasurementOut

router = APIRouter(prefix="/measurements", tags=["measurements"])


@router.get("/", response_model=list[MeasurementOut])
async def list_all(user: CurrentUser, db: DbSession, limit: int = 30) -> list[MeasurementOut]:
    rows = await service.list_measurements(db, user.id, limit)
    return [MeasurementOut.model_validate(m) for m in rows]


@router.post("/", response_model=MeasurementOut, status_code=201)
async def create(body: MeasurementIn, user: CurrentUser, db: DbSession) -> MeasurementOut:
    data = body.model_dump()
    m = await service.upsert(db, user.id, data)
    if body.weight is not None:
        user.weight = body.weight
    await db.commit()
    await db.refresh(m)
    return MeasurementOut.model_validate(m)
