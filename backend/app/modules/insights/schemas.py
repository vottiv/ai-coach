from typing import Literal

from pydantic import BaseModel

Category = Literal["workouts", "nutrition", "feelings", "health", "general"]
Severity = Literal["info", "warning", "success"]


class Insight(BaseModel):
    title: str
    body: str
    category: Category = "general"
    severity: Severity = "info"


class RecommendationOut(BaseModel):
    recommendation: Insight
    generated_at: str
    ai_powered: bool = False


class InsightsOut(BaseModel):
    period: str
    insights: list[Insight] = []
    ai_powered: bool = False


class MuscleHint(BaseModel):
    muscle_group: str
    exercise: str
    sets: int = 3
    reps: str = "8-12"
    reason: str = ""


class MuscleHintOut(BaseModel):
    hints: list[MuscleHint] = []
    ai_powered: bool = False
