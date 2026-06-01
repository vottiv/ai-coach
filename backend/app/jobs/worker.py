"""ARQ-воркер фоновых задач (ТЗ п. 2.1).

Задачи:
- ping          — health-check (этап 0).
- generate_insights — предварительный расчёт инсайтов и рекомендации дня (этап 5).
  Вызывается по расписанию (cron) или вручную; кладёт результат в Redis-кэш.

Запуск: `arq app.jobs.worker.WorkerSettings`.
"""
from __future__ import annotations

import logging

from arq import cron
from arq.connections import RedisSettings
from sqlalchemy import select

from app.core.config import settings
from app.core.db import SessionLocal
from app.models.user import User
from app.modules.insights import service as insight_service

logger = logging.getLogger(__name__)


async def ping(ctx: dict) -> str:
    return "pong"


async def generate_insights(ctx: dict, user_id: int) -> str:
    """Предварительно генерирует рекомендацию дня для пользователя и кладёт в кэш."""
    async with SessionLocal() as db:
        user = await db.get(User, user_id)
        if user is None:
            return f"user {user_id} not found"
        await insight_service.get_recommendation(db, user)
    logger.info("Insights pre-generated for user %s", user_id)
    return "ok"


async def generate_insights_all(ctx: dict) -> str:
    """Предгенерация инсайтов для всех пользователей (cron-задача)."""
    async with SessionLocal() as db:
        user_ids = list(await db.scalars(select(User.id)))
    count = 0
    for uid in user_ids:
        await generate_insights(ctx, uid)
        count += 1
    return f"done {count}"


class WorkerSettings:
    functions = [ping, generate_insights, generate_insights_all]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    cron_jobs = [
        cron(generate_insights_all, hour=3, minute=0),
    ]
