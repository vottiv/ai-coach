from datetime import date as date_type
from typing import Literal

from pydantic import BaseModel, Field

MealType = Literal["breakfast", "lunch", "dinner", "snack"]


class FoodIn(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    weight: float = Field(default=0, ge=0, le=10000)
    protein: float = Field(default=0, ge=0, le=2000)
    fat: float = Field(default=0, ge=0, le=2000)
    carbs: float = Field(default=0, ge=0, le=2000)


class NutritionCreate(BaseModel):
    date: date_type
    meal_type: MealType
    photo_url: str | None = Field(default=None, max_length=512)
    foods: list[FoodIn] = Field(min_length=1)


class FoodOut(BaseModel):
    id: int
    name: str
    weight: float
    protein: float
    fat: float
    carbs: float
    calories: float

    model_config = {"from_attributes": True}


class Totals(BaseModel):
    calories: float = 0
    protein: float = 0
    fat: float = 0
    carbs: float = 0


class NutritionLogOut(BaseModel):
    id: int
    date: date_type
    meal_type: MealType
    photo_url: str | None = None
    foods: list[FoodOut] = []
    totals: Totals = Totals()

    model_config = {"from_attributes": True}


class DailySummaryOut(BaseModel):
    date: date_type
    totals: Totals
    targets: dict[str, int] | None = None


class RecognizedFood(BaseModel):
    name: str
    weight: float = 0
    protein: float = 0
    fat: float = 0
    carbs: float = 0


class RecognizeOut(BaseModel):
    foods: list[RecognizedFood] = []
    note: str
