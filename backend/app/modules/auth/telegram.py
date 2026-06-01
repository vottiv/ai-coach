import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl

MAX_AUTH_AGE_SEC = 24 * 60 * 60


class TelegramAuthError(Exception):
    pass


def verify_init_data(init_data: str, bot_token: str) -> dict:
    """Валидирует Telegram InitData (HMAC-SHA256) и возвращает данные пользователя.

    Раскладка проверки соответствует требованиям Telegram Mini Apps.
    """
    if not bot_token:
        raise TelegramAuthError("Telegram bot token is not configured")

    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise TelegramAuthError("hash is missing")

    data_check_string = "\n".join(f"{k}={parsed[k]}" for k in sorted(parsed))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    calc_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(calc_hash, received_hash):
        raise TelegramAuthError("invalid signature")

    auth_date = int(parsed.get("auth_date", "0"))
    if auth_date and (time.time() - auth_date) > MAX_AUTH_AGE_SEC:
        raise TelegramAuthError("init data is expired")

    user_raw = parsed.get("user")
    if not user_raw:
        raise TelegramAuthError("user is missing")
    return json.loads(user_raw)
