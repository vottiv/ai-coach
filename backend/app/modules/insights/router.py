from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.modules.insights import service
from app.modules.insights.schemas import BodyAssessmentOut, InsightsOut, MuscleHintOut, RecommendationOut

# ТЗ п. 11.9: приватные AI-эндпоинты (видны только владельцу токена).
router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/recommendations", response_model=RecommendationOut)
async def recommendations(user: CurrentUser, db: DbSession) -> RecommendationOut:
    data = await service.get_recommendation(db, user)
    return RecommendationOut(**data)


@router.get("/insights", response_model=InsightsOut)
async def insights(user: CurrentUser, db: DbSession, period: str = "week") -> InsightsOut:
    data = await service.get_insights(db, user, period)
    return InsightsOut(**data)


@router.get("/muscle-hints", response_model=MuscleHintOut)
async def muscle_hints(user: CurrentUser, db: DbSession) -> MuscleHintOut:
    data = await service.get_muscle_hints(db, user)
    return MuscleHintOut(**data)


@router.get("/body-assessment", response_model=BodyAssessmentOut)
async def body_assessment(user: CurrentUser, db: DbSession) -> BodyAssessmentOut:
    data = await service.get_body_assessment(db, user)
    return BodyAssessmentOut(**data)
