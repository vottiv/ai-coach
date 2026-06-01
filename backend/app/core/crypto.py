"""Application-level шифрование чувствительных полей at rest (ТЗ п. 3, п. 180).

Ключ Fernet детерминированно выводится из `field_encryption_key` (или `jwt_secret`
как запасной вариант для локальной разработки), поэтому в окружении достаточно
задать произвольную строку-секрет.
"""
import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


def _derive_key() -> bytes:
    secret = settings.field_encryption_key or settings.jwt_secret
    digest = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(digest)


_fernet = Fernet(_derive_key())


def encrypt(plaintext: str) -> str:
    return _fernet.encrypt(plaintext.encode()).decode()


def decrypt(token: str) -> str:
    try:
        return _fernet.decrypt(token.encode()).decode()
    except (InvalidToken, ValueError):
        # Данные, сохранённые до включения шифрования, либо повреждённый токен.
        return token
