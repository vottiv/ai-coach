import jwt
import pytest

from app.core.security import (
    ACCESS,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip() -> None:
    h = hash_password("super-secret-123")
    assert h != "super-secret-123"
    assert verify_password("super-secret-123", h)
    assert not verify_password("wrong", h)


def test_access_token_roundtrip() -> None:
    token = create_access_token(42)
    assert decode_token(token, ACCESS) == 42


def test_token_type_is_enforced() -> None:
    refresh = create_refresh_token(7)
    with pytest.raises(jwt.InvalidTokenError):
        decode_token(refresh, ACCESS)
