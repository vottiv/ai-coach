from datetime import date as date_type
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

WorkoutType = Literal["strength", "cardio", "stretch", "hiit", "mixed"]
Period = Literal["week", "month", "3months", "year"]


class SetIn(BaseModel):
    weight: float = Field(ge=0, le=2000)
    reps: int = Field(ge=0, le=1000)
    rpe: float | None = Field(default=None, ge=1, le=10)


class WorkoutExerciseIn(BaseModel):
    exercise_id: int | None = None
    exercise_name: str = Field(min_length=1, max_length=160)
    sets: list[SetIn] = Field(default_factory=list)
    superset_id: str | None = None
    superset_order: int | None = None
    equipment_type: str | None = None
    bodyweight_percent: float | None = Field(default=None, ge=0, le=200)


class WorkoutCreate(BaseModel):
    date: date_type
    type: WorkoutType
    feeling: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = Field(default=None, max_length=2048)
    duration: int | None = Field(default=None, ge=0, le=1000)
    exercises: list[WorkoutExerciseIn] = Field(default_factory=list)


class SetOut(BaseModel):
    id: int
    weight: float
    reps: int
    rpe: float | None = None

    model_config = {"from_attributes": True}


class WorkoutExerciseOut(BaseModel):
    id: int
    exercise_id: int | None = None
    exercise_name: str
    order: int
    sets: list[SetOut] = []
    superset_id: str | None = None
    superset_order: int | None = None
    equipment_type: str = "other"
    bodyweight_percent: float | None = None
    bodyweight_used: float | None = None

    model_config = {"from_attributes": True}


class WorkoutOut(BaseModel):
    id: int
    date: date_type
    type: str
    feeling: int | None = None
    notes: str | None = None
    duration: int | None = None
    exercises: list[WorkoutExerciseOut] = []
    tonnage: float = 0
    intensity: str = "very_light"

    model_config = {"from_attributes": True}


class WorkoutListItem(BaseModel):
    id: int
    date: date_type
    type: str
    feeling: int | None = None
    exercise_count: int = 0
    tonnage: float = 0
    intensity: str = "very_light"
    muscle_groups: list[str] = []


class CalendarDay(BaseModel):
    date: date_type
    count: int


class CalendarOut(BaseModel):
    days: list[CalendarDay]
    month_total: int
    year_total: int


class MuscleBalanceItem(BaseModel):
    muscle_group: str
    weekly_sets: int
    recommended_sets: int
    percentage: int


class VolumePoint(BaseModel):
    label: str
    volume: float


class PersonalRecordOut(BaseModel):
    id: int
    exercise_id: int | None = None
    exercise_name: str
    type: str
    value: float
    achieved_at: datetime
    set_id: int | None
    workout_id: int | None
    reps_at_max_weight: int

    model_config = {"from_attributes": True}


class PersonalRecordSummary(BaseModel):
    exercise_id: int | None
    exercise_name: str
    max_weight: float
    max_reps_at_max_weight: int
    achieved_at: str
    workout_id: int | None
    previous_value: float | None
    previous_achieved_at: str | None
    previous_reps: int | None


class ExerciseRecordSummary(BaseModel):
    exercise_id: int
    exercise_name: str
    max_weight: float
    max_reps_at_max_weight: int


class PaginatedWorkouts(BaseModel):
    items: list[WorkoutListItem]
    total: int
    skip: int
    limit: int


class MuscleGroupBalance(BaseModel):
    category: str
    weekly_sets: int
    recommended_sets: int
    percentage: int
    groups: list[MuscleBalanceItem] = []