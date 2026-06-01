import hashlib
import hmac
import json
import time
from urllib.parse import urlencode

import pytest

from app.modules.auth.telegram import TelegramAuthError, verify_init_data

BOT_TOKEN = "123456:TEST-TOKEN"


def _build_init_data(token: str) -> str:
    fields = {
        "auth_date": str(int(time.time())),
        "user": json.dumps({"id": 999, "first_name": "Иван", "username": "ivan"}),
    }
    data_check_string = "\n".join(f"{k}={fields[k]}" for k in sorted(fields))
    secret = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    fields["hash"] = hmac.new(secret, data_check_string.encode(), hashlib.sha256).hexdigest()
    return urlencode(fields)


def test_valid_init_data_returns_user() -> None:
    user = verify_init_data(_build_init_data(BOT_TOKEN), BOT_TOKEN)
    assert user["id"] == 999
    assert user["username"] == "ivan"


def test_invalid_signature_rejected() -> None:
    with pytest.raises(TelegramAuthError):
        verify_init_data(_build_init_data("other-token"), BOT_TOKEN)
