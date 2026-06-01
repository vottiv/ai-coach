from datetime import date

from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.modules.measurements import service as measurements_service
from app.modules.users.schemas import UserProfile, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserProfile)
async def get_me(user: CurrentUser) -> UserProfile:
    return UserProfile.model_validate(user)


@router.put("/me", response_model=UserProfile)
async def update_me(body: UserUpdate, user: CurrentUser, db: DbSession) -> UserProfile:
    update_data = body.model_dump(exclude_unset=True)

    new_weight = update_data.pop("weight", None)
    if new_weight is not None:
        user.weight = new_weight
        await measurements_service.upsert(
            db, user.id, {"measured_at": date.today(), "weight": new_weight}
        )

    for field, value in update_data.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return UserProfile.model_validate(user)
