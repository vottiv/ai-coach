import jwt
from fastapi import APIRouter, HTTPException, status

from app.core.deps import CurrentUser, DbSession
from app.core.security import REFRESH, create_access_token, decode_token
from app.modules.auth import service
from app.modules.auth.schemas import (
    AccessToken,
    LoginIn,
    RefreshIn,
    RegisterIn,
    TelegramAuthIn,
    TokenPair,
    UserOut,
)
from app.modules.auth.telegram import TelegramAuthError, verify_init_data

router = APIRouter(prefix="/auth", tags=["auth"])


def _pair(user) -> TokenPair:
    access, refresh = service.issue_tokens(user)
    return TokenPair(access=access, refresh=refresh, user=UserOut.model_validate(user))


@router.post("/telegram", response_model=TokenPair)
async def auth_telegram(body: TelegramAuthIn, db: DbSession) -> TokenPair:
    try:
        tg = verify_init_data(body.init_data, "")
    except TelegramAuthError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(exc)) from exc

    user = await service.login_or_create_oauth(
        db,
        provider="telegram",
        provider_id=str(tg["id"]),
        name=" ".join(filter(None, [tg.get("first_name"), tg.get("last_name")])) or "Пользователь",
        username=tg.get("username"),
        avatar_url=tg.get("photo_url"),
        meta=tg,
    )
    await db.commit()
    return _pair(user)


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterIn, db: DbSession) -> TokenPair:
    try:
        user = await service.register_email(
            db, email=body.email, password=body.password, name=body.name
        )
    except service.AuthError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    await db.commit()
    return _pair(user)


@router.post("/login", response_model=TokenPair)
async def login(body: LoginIn, db: DbSession) -> TokenPair:
    try:
        user = await service.login_email(db, email=body.email, password=body.password)
    except service.AuthError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(exc)) from exc
    return _pair(user)


@router.post("/refresh", response_model=AccessToken)
async def refresh(body: RefreshIn) -> AccessToken:
    try:
        user_id = decode_token(body.refresh, REFRESH)
    except jwt.PyJWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token") from exc
    return AccessToken(access=create_access_token(user_id))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(_: CurrentUser) -> None:
    # Stateless JWT: фактический инвалидейт — на клиенте (удаление токенов).
    return None
