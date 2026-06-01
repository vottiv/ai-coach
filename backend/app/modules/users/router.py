from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.modules.users.schemas import UserProfile, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserProfile)
async def get_me(user: CurrentUser) -> UserProfile:
    return UserProfile.model_validate(user)


@router.put("/me", response_model=UserProfile)
async def update_me(body: UserUpdate, user: CurrentUser, db: DbSession) -> UserProfile:
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return UserProfile.model_validate(user)
