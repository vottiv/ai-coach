from datetime import date as date_type
from typing import Literal

from pydantic import BaseModel, Field

Status = Literal["normal", "high", "low"]


class BiomarkerIn(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    value: float
    unit: str | None = Field(default=None, max_length=32)
    reference_min: float | None = None
    reference_max: float | None = None
    status: Status | None = None


class HealthCreate(BaseModel):
    date: date_type
    source: str | None = Field(default=None, max_length=160)
    biomarkers: list[BiomarkerIn] = Field(min_length=1)


class BiomarkerOut(BaseModel):
    id: int
    name: str
    value: float
    unit: str | None = None
    reference_min: float | None = None
    reference_max: float | None = None
    status: Status

    model_config = {"from_attributes": True}


class HealthAnalysisOut(BaseModel):
    id: int
    date: date_type
    source: str | None = None
    biomarkers: list[BiomarkerOut] = []

    model_config = {"from_attributes": True}


class HealthListItem(BaseModel):
    id: int
    date: date_type
    source: str | None = None
    biomarker_count: int = 0
    abnormal_count: int = 0


class RecognizedBiomarker(BaseModel):
    name: str
    value: float = 0
    unit: str | None = None
    reference_min: float | None = None
    reference_max: float | None = None


class RecognizeOut(BaseModel):
    biomarkers: list[RecognizedBiomarker] = []
    note: str
