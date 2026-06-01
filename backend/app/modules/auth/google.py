from google.auth.transport import requests as google_requests
from google.oauth2 import id_token


class GoogleAuthError(Exception):
    pass


def verify_credential(credential: str, client_id: str) -> dict:
    """Валидирует Google id_token и возвращает claims (sub, email, name, picture)."""
    if not client_id:
        raise GoogleAuthError("Google client id is not configured")
    try:
        claims = id_token.verify_oauth2_token(
            credential, google_requests.Request(), client_id
        )
    except ValueError as exc:
        raise GoogleAuthError(str(exc)) from exc
    return claims
