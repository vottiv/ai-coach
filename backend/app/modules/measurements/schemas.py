from datetime import date

from pydantic import BaseModel, Field


class MeasurementIn(BaseModel):
    measured_at: date
    weight: float | None = Field(default=None, gt=0, lt=500)
    bicep: float | None = Field(default=None, gt=0, lt=200)
    shoulders: float | None = Field(default=None, gt=0, lt=300)
    chest: float | None = Field(default=None, gt=0, lt=300)
    waist: float | None = Field(default=None, gt=0, lt=300)
    glutes: float | None = Field(default=None, gt=0, lt=300)
    hips: float | None = Field(default=None, gt=0, lt=300)
    calves: float | None = Field(default=None, gt=0, lt=100)
    notes: str | None = None


class MeasurementOut(BaseModel):
    id: int
    measured_at: date
    weight: float | None = None
    bicep: float | None = None
    shoulders: float | None = None
    chest: float | None = None
    waist: float | None = None
    glutes: float | None = None
    hips: float | None = None
    calves: float | None = None
    notes: str | None = None

    model_config = {"from_attributes": True}


class WeightPoint(BaseModel):
    date: str
    weight: float
