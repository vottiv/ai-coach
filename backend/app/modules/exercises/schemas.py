from pydantic import BaseModel, Field


class ExerciseOut(BaseModel):
    id: int
    name: str
    category: str
    muscle_groups: list[str] = []
    is_custom: bool = False

    model_config = {"from_attributes": True}


class ExerciseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    category: str = Field(min_length=1, max_length=32)
    muscle_groups: list[str] = Field(default_factory=list)
    description: str | None = Field(default=None, max_length=1024)
