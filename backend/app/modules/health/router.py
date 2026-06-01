from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.core.deps import CurrentUser, DbSession
from app.modules.health import service
from app.modules.health.schemas import (
    HealthAnalysisOut,
    HealthCreate,
    HealthListItem,
    RecognizeOut,
)

router = APIRouter(prefix="/health", tags=["health"])

_ALLOWED_TYPES = ("image/", "application/pdf")


@router.get("", response_model=list[HealthListItem])
async def list_health(user: CurrentUser, db: DbSession) -> list[HealthListItem]:
    analyses = await service.list_analyses(db, user.id)
    return [
        HealthListItem(
            id=a.id,
            date=a.date,
            source=a.source,
            biomarker_count=len(a.biomarkers),
            abnormal_count=sum(1 for b in a.biomarkers if b.status != "normal"),
        )
        for a in analyses
    ]


@router.post("", response_model=HealthAnalysisOut, status_code=status.HTTP_201_CREATED)
async def create_health(body: HealthCreate, user: CurrentUser, db: DbSession) -> HealthAnalysisOut:
    analysis = await service.create_analysis(db, user.id, body)
    return HealthAnalysisOut.model_validate(analysis)


@router.post("/recognize", response_model=RecognizeOut)
async def recognize(user: CurrentUser, file: UploadFile = File(...)) -> RecognizeOut:
    content_type = file.content_type or ""
    if not content_type.startswith(_ALLOWED_TYPES):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Ожидается изображение или PDF")
    await file.read()
    note = (
        "Распознавание анализов подключается позже. Введите биомаркеры вручную."
        if not settings.openai_api_key
        else "Распознавание временно недоступно. Введите биомаркеры вручную."
    )
    return RecognizeOut(biomarkers=[], note=note)


@router.get("/{analysis_id}", response_model=HealthAnalysisOut)
async def get_health(analysis_id: int, user: CurrentUser, db: DbSession) -> HealthAnalysisOut:
    analysis = await service.get_analysis(db, user.id, analysis_id)
    if analysis is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Analysis not found")
    return HealthAnalysisOut.model_validate(analysis)


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_health(analysis_id: int, user: CurrentUser, db: DbSession) -> None:
    ok = await service.delete_analysis(db, user.id, analysis_id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Analysis not found")
    return None
