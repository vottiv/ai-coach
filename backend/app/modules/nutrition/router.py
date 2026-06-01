from datetime import date

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.core.deps import CurrentUser, DbSession
from app.modules.nutrition import service
from app.modules.nutrition.schemas import (
    DailySummaryOut,
    NutritionCreate,
    NutritionLogOut,
    RecognizeOut,
    Totals,
)

router = APIRouter(prefix="/nutrition", tags=["nutrition"])


def _to_out(log) -> NutritionLogOut:
    out = NutritionLogOut.model_validate(log)
    out.totals = Totals(**service.log_totals(log))
    return out


@router.get("", response_model=list[NutritionLogOut])
async def list_nutrition(
    user: CurrentUser,
    db: DbSession,
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[NutritionLogOut]:
    logs = await service.list_logs(db, user.id, from_date=from_date, to_date=to_date)
    return [_to_out(log) for log in logs]


@router.post("", response_model=NutritionLogOut, status_code=status.HTTP_201_CREATED)
async def create_nutrition(body: NutritionCreate, user: CurrentUser, db: DbSession) -> NutritionLogOut:
    log = await service.create_meal(db, user.id, body)
    return _to_out(log)


@router.get("/daily-summary", response_model=DailySummaryOut)
async def daily_summary(
    user: CurrentUser,
    db: DbSession,
    target_date: date | None = None,
) -> DailySummaryOut:
    summary = await service.daily_summary(db, user, target_date or date.today())
    return DailySummaryOut(**summary)


@router.post("/recognize", response_model=RecognizeOut)
async def recognize(user: CurrentUser, photo: UploadFile = File(...)) -> RecognizeOut:
    # Базовая валидация изображения; само распознавание подключается на AI-этапе (ТЗ п. 8.5).
    if not (photo.content_type or "").startswith("image/"):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Ожидается изображение")
    await photo.read()
    if not settings.openai_api_key:
        return RecognizeOut(
            foods=[],
            note="Распознавание по фото подключается позже. Введите блюда вручную.",
        )
    # Заглушка: интеграция с vision-моделью добавляется на AI-этапе.
    return RecognizeOut(foods=[], note="Распознавание временно недоступно. Введите блюда вручную.")


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_nutrition(log_id: int, user: CurrentUser, db: DbSession) -> None:
    ok = await service.delete_meal(db, user.id, log_id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Meal not found")
    return None
