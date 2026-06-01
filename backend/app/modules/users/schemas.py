from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

Module = Literal["workouts", "nutrition", "health", "feelings"]
Goal = Literal["mass", "weight_loss", "endurance", "flexibility", "health"]


class UserProfile(BaseModel):
    id: int
    name: str
    username: str | None = None
    avatar_url: str | None = None
    gender: str | None = None
    birthdate: date | None = None
    goals: list[str] = []
    enabled_modules: list[str] = []
    weight: float | None = None
    height: float | None = None
    age: int | None = None
    activity_level: str | None = None
    locale: str = "ru"
    units: str = "metric"
    onboarded: bool = False

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    gender: Literal["male", "female"] | None = None
    birthdate: date | None = None
    goals: list[Goal] | None = None
    enabled_modules: list[Module] | None = None
    weight: float | None = Field(default=None, gt=0, lt=500)
    height: float | None = Field(default=None, gt=0, lt=300)
    age: int | None = Field(default=None, gt=0, lt=150)
    activity_level: Literal["sedentary", "light", "moderate", "high"] | None = None
    units: Literal["metric", "imperial"] | None = None
    onboarded: bool | None = None
