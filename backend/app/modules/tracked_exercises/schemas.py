from pydantic import BaseModel, Field


class TrackedExerciseCreate(BaseModel):
    exercise_id: int = Field(..., gt=0)


class TrackedExerciseOut(BaseModel):
    id: int
    exercise_id: int
    created_at: str

    model_config = {"from_attributes": True}