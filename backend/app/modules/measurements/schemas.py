from datetime import date

from pydantic import BaseModel, Field


class MeasurementIn(BaseModel):
    measured_at: date
    weight: float | None = Field(default=None, gt=0, lt=500)
    bicep_left: float | None = Field(default=None, gt=0, lt=200)
    bicep_right: float | None = Field(default=None, gt=0, lt=200)
    shoulders: float | None = Field(default=None, gt=0, lt=300)
    chest: float | None = Field(default=None, gt=0, lt=300)
    waist: float | None = Field(default=None, gt=0, lt=300)
    glutes: float | None = Field(default=None, gt=0, lt=300)
    hips_left: float | None = Field(default=None, gt=0, lt=300)
    hips_right: float | None = Field(default=None, gt=0, lt=300)
    calves_left: float | None = Field(default=None, gt=0, lt=100)
    calves_right: float | None = Field(default=None, gt=0, lt=100)
    notes: str | None = None


class MeasurementUpdate(BaseModel):
    measured_at: date | None = None
    weight: float | None = Field(default=None, gt=0, lt=500)
    bicep_left: float | None = Field(default=None, gt=0, lt=200)
    bicep_right: float | None = Field(default=None, gt=0, lt=200)
    shoulders: float | None = Field(default=None, gt=0, lt=300)
    chest: float | None = Field(default=None, gt=0, lt=300)
    waist: float | None = Field(default=None, gt=0, lt=300)
    glutes: float | None = Field(default=None, gt=0, lt=300)
    hips_left: float | None = Field(default=None, gt=0, lt=300)
    hips_right: float | None = Field(default=None, gt=0, lt=300)
    calves_left: float | None = Field(default=None, gt=0, lt=100)
    calves_right: float | None = Field(default=None, gt=0, lt=100)
    notes: str | None = None


class MeasurementOut(BaseModel):
    id: int
    measured_at: date
    weight: float | None = None
    bicep_left: float | None = None
    bicep_right: float | None = None
    shoulders: float | None = None
    chest: float | None = None
    waist: float | None = None
    glutes: float | None = None
    hips_left: float | None = None
    hips_right: float | None = None
    calves_left: float | None = None
    calves_right: float | None = None
    notes: str | None = None

    model_config = {"from_attributes": True}
