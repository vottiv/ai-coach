from datetime import date

from pydantic import BaseModel, EmailStr, Field


class UserOut(BaseModel):
    id: int
    name: str
    username: str | None = None
    avatar_url: str | None = None
    gender: str | None = None
    birthdate: date | None = None
    onboarded: bool
    enabled_modules: list[str] = []
    goals: list[str] = []

    model_config = {"from_attributes": True}


class TokenPair(BaseModel):
    access: str
    refresh: str
    user: UserOut


class AccessToken(BaseModel):
    access: str


class TelegramAuthIn(BaseModel):
    init_data: str


class GoogleAuthIn(BaseModel):
    credential: str


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=120)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RefreshIn(BaseModel):
    refresh: str
