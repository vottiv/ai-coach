from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.auth_identity import AuthIdentity
from app.models.user import User


class AuthError(Exception):
    pass


async def _identity(db: AsyncSession, provider: str, provider_id: str) -> AuthIdentity | None:
    stmt = (
        select(AuthIdentity)
        .where(AuthIdentity.provider == provider, AuthIdentity.provider_id == provider_id)
        .options(selectinload(AuthIdentity.user))
    )
    return await db.scalar(stmt)


async def _email_identity(db: AsyncSession, email: str) -> AuthIdentity | None:
    stmt = (
        select(AuthIdentity)
        .where(AuthIdentity.provider == "email", AuthIdentity.email == email.lower())
        .options(selectinload(AuthIdentity.user))
    )
    return await db.scalar(stmt)


def issue_tokens(user: User) -> tuple[str, str]:
    return create_access_token(user.id), create_refresh_token(user.id)


async def login_or_create_oauth(
    db: AsyncSession,
    *,
    provider: str,
    provider_id: str,
    name: str,
    username: str | None = None,
    avatar_url: str | None = None,
    email: str | None = None,
    meta: dict | None = None,
) -> User:
    """Единая точка входа для telegram/google: находит профиль по identity или создаёт новый."""
    identity = await _identity(db, provider, provider_id)
    if identity is not None:
        return identity.user

    user = User(name=name, username=username, avatar_url=avatar_url)
    user.identities.append(
        AuthIdentity(
            provider=provider,
            provider_id=provider_id,
            email=email.lower() if email else None,
            meta=meta or {},
        )
    )
    db.add(user)
    await db.flush()
    return user


async def register_email(db: AsyncSession, *, email: str, password: str, name: str) -> User:
    if await _email_identity(db, email):
        raise AuthError("email already registered")
    user = User(name=name)
    user.identities.append(
        AuthIdentity(
            provider="email",
            provider_id=email.lower(),
            email=email.lower(),
            password_hash=hash_password(password),
        )
    )
    db.add(user)
    await db.flush()
    return user


async def login_email(db: AsyncSession, *, email: str, password: str) -> User:
    identity = await _email_identity(db, email)
    if identity is None or not identity.password_hash:
        raise AuthError("invalid credentials")
    if not verify_password(password, identity.password_hash):
        raise AuthError("invalid credentials")
    return identity.user
