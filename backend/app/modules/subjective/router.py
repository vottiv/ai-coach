from datetime import date

from fastapi import APIRouter, status

from app.core.deps import CurrentUser, DbSession
from app.modules.subjective import service
from app.modules.subjective.schemas import SubjectiveIn, SubjectiveOut, TodayOut

router = APIRouter(prefix="/subjective", tags=["subjective"])


@router.get("", response_model=list[SubjectiveOut])
async def list_subjective(
    user: CurrentUser,
    db: DbSession,
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[SubjectiveOut]:
    logs = await service.list_logs(db, user.id, from_date=from_date, to_date=to_date)
    return [SubjectiveOut.model_validate(log) for log in logs]


@router.get("/today", response_model=TodayOut)
async def today(user: CurrentUser, db: DbSession, target_date: date | None = None) -> TodayOut:
    day = await service.get_day(db, user.id, target_date or date.today())
    return TodayOut(
        date=day["date"],
        morning=SubjectiveOut.model_validate(day["morning"]) if day["morning"] else None,
        evening=SubjectiveOut.model_validate(day["evening"]) if day["evening"] else None,
    )


@router.post("", response_model=SubjectiveOut, status_code=status.HTTP_201_CREATED)
async def save_subjective(body: SubjectiveIn, user: CurrentUser, db: DbSession) -> SubjectiveOut:
    log = await service.upsert(db, user.id, body)
    return SubjectiveOut.model_validate(log)
