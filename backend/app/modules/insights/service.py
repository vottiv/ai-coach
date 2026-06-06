"""AI-аналитика: рекомендация дня и кросс-модульные инсайты (ТЗ п. 8.5, этап 5).

Пайплайн: собрать контекст → найти паттерны детерминированно → (опц.) обогатить
через LLM. Рекомендация дня кэшируется до конца суток (ТЗ: «кэшируется на день»).
Инсайты видны только владельцу (scoped по user_id на уровне зависимостей).
"""
from __future__ import annotations

from datetime import datetime, time, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_get_json, cache_set_json
from app.models.user import User
from app.services import ai, insights as engine


def _seconds_until_midnight() -> int:
    now = datetime.now(timezone.utc)
    midnight = datetime.combine(now.date(), time.max, tzinfo=timezone.utc)
    return max(int((midnight - now).total_seconds()), 60)


async def get_recommendation(db: AsyncSession, user: User) -> dict:
    cache_key = f"ai:rec:{user.id}:{datetime.now(timezone.utc).date().isoformat()}"
    cached = await cache_get_json(cache_key)
    if cached is not None:
        return cached

    ctx = await engine.build_context(db, user, period_days=7)
    base = [engine.daily_recommendation(ctx)]
    refined = await ai.refine_insights(ctx, base)
    ai_powered = refined is not None
    recommendation = (refined or base)[0]

    result = {
        "recommendation": recommendation,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "ai_powered": ai_powered,
    }
    await cache_set_json(cache_key, result, _seconds_until_midnight())
    return result


async def get_insights(db: AsyncSession, user: User, period: str) -> dict:
    period_days = engine.period_to_days(period)
    cache_key = f"ai:insights:{user.id}:{period}"
    cached = await cache_get_json(cache_key)
    if cached is not None:
        return cached

    ctx = await engine.build_context(db, user, period_days=period_days)
    base = engine.detect_patterns(ctx)
    refined = await ai.refine_insights(ctx, base)
    ai_powered = refined is not None
    result = {
        "period": period,
        "insights": refined if refined is not None else base,
        "ai_powered": ai_powered,
    }
    await cache_set_json(cache_key, result, 600)
    return result


async def get_body_assessment(db: AsyncSession, user: User) -> dict:
    cache_key = f"ai:body:{user.id}:{_latest_measurement_date(db, user)}"
    cached = await cache_get_json(cache_key)
    if cached is not None:
        return cached

    from app.modules.measurements import service as m_svc
    rows = await m_svc.list_measurements(db, user.id, 2)
    if not rows:
        return {"assessment": "Недостаточно данных для оценки.", "ai_powered": False}

    latest = rows[0]
    assessment = await ai.get_body_assessment(latest, user)
    ai_powered = assessment is not None
    result = {
        "assessment": assessment or _fallback_body_assessment(latest, user),
        "ai_powered": ai_powered,
    }
    await cache_set_json(cache_key, result, 3600)
    return result


async def _latest_measurement_date(db: AsyncSession, user: User) -> str:
    from app.modules.measurements import service as m_svc
    rows = await m_svc.list_measurements(db, user.id, 1)
    if rows:
        return str(rows[0].measured_at)
    return "none"


def _fallback_body_assessment(measurement, user: User) -> str:
    parts = []
    if measurement.weight:
        parts.append(f"Ваш текущий вес: {measurement.weight} кг.")
    if measurement.chest and measurement.waist:
        ratio = measurement.chest / measurement.waist
        if ratio > 1.4:
            parts.append("Соотношение грудь/талия в хорошем диапазоне.")
        else:
            parts.append("Есть потенциал для улучшения соотношения грудь/талия.")
    if not parts:
        parts.append("Добавьте больше замеров для более подробной оценки.")
    return " ".join(parts)


async def get_muscle_hints(db: AsyncSession, user: User) -> dict:
    """AI-подсказки по дисбалансу мышц (ТЗ п. 8.5, этап 5)."""
    ctx = await engine.build_context(db, user, period_days=7)
    muscle_balance = ctx.get("muscle_balance", [])
    goals = user.goals or []

    hints = await ai.get_muscle_hints(muscle_balance, goals)
    return {
        "hints": hints or [],
        "ai_powered": hints is not None,
    }