from datetime import date as date_type
from typing import Literal

from pydantic import BaseModel, Field

Slot = Literal["morning", "evening"]


class SubjectiveIn(BaseModel):
    date: date_type
    slot: Slot
    # Утренние
    sleep_quality: int | None = Field(default=None, ge=1, le=5)
    energy: int | None = Field(default=None, ge=1, le=5)
    mood: int | None = Field(default=None, ge=1, le=5)
    soreness: int | None = Field(default=None, ge=1, le=5)
    motivation: int | None = Field(default=None, ge=1, le=5)
    # Вечерние
    stress: int | None = Field(default=None, ge=1, le=5)
    fatigue: int | None = Field(default=None, ge=1, le=5)
    satisfaction: int | None = Field(default=None, ge=1, le=5)

    body_weight: float | None = Field(default=None, gt=0, lt=500)
    notes: str | None = Field(default=None, max_length=2048)


class SubjectiveOut(BaseModel):
    id: int
    date: date_type
    slot: Slot
    sleep_quality: int | None = None
    energy: int | None = None
    mood: int | None = None
    soreness: int | None = None
    motivation: int | None = None
    stress: int | None = None
    fatigue: int | None = None
    satisfaction: int | None = None
    body_weight: float | None = None
    notes: str | None = None

    model_config = {"from_attributes": True}


class TodayOut(BaseModel):
    date: date_type
    morning: SubjectiveOut | None = None
    evening: SubjectiveOut | None = None
