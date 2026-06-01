"""Лёгкий помощник кэширования в Redis (ТЗ п. 8.5: рекомендация дня кэшируется).

Все операции graceful: если Redis недоступен (например, в тестах), функции
тихо деградируют — приложение продолжает работать без кэша.
"""
from __future__ import annotations

import json
import logging
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: aioredis.Redis | None = None


def _get_client() -> aioredis.Redis | None:
    global _client
    if _client is None:
        try:
            _client = aioredis.from_url(settings.redis_url, decode_responses=True)
        except Exception as exc:  # noqa: BLE001 — кэш не критичен
            logger.warning("Redis init failed: %s", exc)
            return None
    return _client


async def cache_get_json(key: str) -> Any | None:
    client = _get_client()
    if client is None:
        return None
    try:
        raw = await client.get(key)
        return json.loads(raw) if raw else None
    except Exception as exc:  # noqa: BLE001
        logger.warning("Redis get failed (%s): %s", key, exc)
        return None


async def cache_set_json(key: str, value: Any, ttl_seconds: int) -> None:
    client = _get_client()
    if client is None:
        return
    try:
        await client.set(key, json.dumps(value, ensure_ascii=False), ex=ttl_seconds)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Redis set failed (%s): %s", key, exc)
