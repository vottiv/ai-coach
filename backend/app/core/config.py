from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Конфигурация приложения. Значения берутся только из окружения (.env не в репозитории)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AI Coach API"
    environment: str = "local"
    debug: bool = True

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost"

    # БД
    database_url: str = "postgresql+asyncpg://aicoach:aicoach@db:5432/aicoach"

    # Redis (кэш + брокер ARQ)
    redis_url: str = "redis://redis:6379/0"

    # JWT
    jwt_secret: str = "change-me-in-prod"
    jwt_algorithm: str = "HS256"
    access_token_ttl_min: int = 30
    refresh_token_ttl_days: int = 30

    # Провайдеры входа
    telegram_bot_token: str = ""
    google_client_id: str = ""

    # Шифрование чувствительных полей (этапы 4+)
    field_encryption_key: str = ""

    # AI / S3 (используются на следующих этапах)
    openai_api_key: str = ""
    s3_endpoint: str = "http://minio:9000"
    s3_bucket: str = "ai-coach"
    s3_access_key: str = ""
    s3_secret_key: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
