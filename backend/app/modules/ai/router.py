from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, DbSession
from app.services.ai import ai_service
from app.modules.ai.schemas import (
    AIResponse,
    FoodRecognitionRequest,
    FoodRecognitionResponse,
    MedicalAnalysisRecognitionRequest,
    MedicalAnalysisResponse,
    NutritionInsightsRequest,
    PatternAnalysisRequest,
    PersonalizedPlanRequest,
    WorkoutAnalysisRequest,
)

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/agents")
async def list_agents(
    _: CurrentUser,
) -> list[dict]:
    """Получить список доступных AI агентов."""
    return ai_service.list_agents()


@router.post("/workouts/analyze", response_model=AIResponse)
async def analyze_workout(
    body: WorkoutAnalysisRequest,
    _: CurrentUser,
) -> AIResponse:
    """Анализировать тренировку и предоставить инсайты."""
    content = await ai_service.analyze_workout(body.workout_data, body.user_context)
    return AIResponse(content=content, model="workout_analyzer")


@router.post("/nutrition/insights", response_model=AIResponse)
async def get_nutrition_insights(
    body: NutritionInsightsRequest,
    _: CurrentUser,
) -> AIResponse:
    """Получить инсайты по питанию."""
    content = await ai_service.get_nutrition_insights(body.nutrition_logs, body.user_context)
    return AIResponse(content=content, model="nutrition_analyzer")


@router.post("/nutrition/recognize-food", response_model=FoodRecognitionResponse)
async def recognize_food(
    body: FoodRecognitionRequest,
    _: CurrentUser,
) -> FoodRecognitionResponse:
    """Распознать продукты питания с изображения."""
    result = await ai_service.recognize_food_from_image(body.image_url)
    if "error" in result:
        return FoodRecognitionResponse(products=[], total={})
    return FoodRecognitionResponse(
        products=result.get("products", []),
        total=result.get("total", {}),
    )


@router.post("/health/recognize-analysis", response_model=MedicalAnalysisResponse)
async def recognize_medical_analysis(
    body: MedicalAnalysisRecognitionRequest,
    _: CurrentUser,
) -> MedicalAnalysisResponse:
    """Распознать медицинский анализ с изображения."""
    result = await ai_service.recognize_medical_analysis(body.image_url)
    if "error" in result:
        return MedicalAnalysisResponse(
            analysis_type="unknown",
            parameters=[],
            summary="Failed to recognize analysis",
        )
    return MedicalAnalysisResponse(
        analysis_type=result.get("analysis_type", "unknown"),
        parameters=result.get("parameters", []),
        summary=result.get("summary", ""),
    )


@router.post("/plan/generate", response_model=AIResponse)
async def generate_personalized_plan(
    body: PersonalizedPlanRequest,
    _: CurrentUser,
) -> AIResponse:
    """Сгенерировать персонализированный план тренировок и питания."""
    content = await ai_service.generate_personalized_plan(body.user_context, body.history)
    return AIResponse(content=content, model="planner")


@router.post("/patterns/find", response_model=AIResponse)
async def find_patterns(
    body: PatternAnalysisRequest,
    _: CurrentUser,
) -> AIResponse:
    """Найти закономерности в данных пользователя."""
    content = await ai_service.find_patterns(body.user_context, body.history)
    return AIResponse(content=content, model="pattern_finder")


@router.post("/auto-route", response_model=AIResponse)
async def auto_route(
    body: dict,
    _: CurrentUser,
) -> AIResponse:
    """Автоматически выбрать агент для обработки запроса."""
    content = await ai_service.auto_route(body)
    return AIResponse(content=content)