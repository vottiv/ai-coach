from pydantic import BaseModel


class WorkoutAnalysisRequest(BaseModel):
    workout_data: dict
    user_context: dict


class NutritionInsightsRequest(BaseModel):
    nutrition_logs: list[dict]
    user_context: dict


class FoodRecognitionRequest(BaseModel):
    image_url: str


class MedicalAnalysisRecognitionRequest(BaseModel):
    image_url: str


class PersonalizedPlanRequest(BaseModel):
    user_context: dict
    history: dict


class PatternAnalysisRequest(BaseModel):
    user_context: dict
    history: dict


class AIResponse(BaseModel):
    content: str
    model: str | None = None


class FoodRecognitionResponse(BaseModel):
    products: list[dict]
    total: dict


class MedicalAnalysisResponse(BaseModel):
    analysis_type: str
    parameters: list[dict]
    summary: str