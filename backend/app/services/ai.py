"""Тонкая обёртка над OpenAI для обогащения инсайтов (ТЗ п. 2.1, п. 8.5).

LLM здесь — необязательный слой поверх детерминированного движка
(`app/services/insights.py`). Если ключа нет или вызов упал — молча отдаём `None`,
и система продолжает работать на правилах/корреляциях. Инсайты приватны и
не покидают периметр пользователя (ТЗ п. 3.5).
"""
from __future__ import annotations

import json
import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_API_URL = "https://api.openai.com/v1/chat/completions"
_MODEL = "gpt-4o-mini"
_TIMEOUT = 20.0

_SYSTEM = (
    "Ты — персональный тренер и нутрициолог. На вход получаешь контекст пользователя "
    "(цели, модули, данные за период) и уже найденные детерминированные закономерности. "
    "Твоя задача — переформулировать паттерны в краткие, доброжелательные и конкретные "
    "рекомендации на русском языке. Не выдумывай факты сверх данных. "
    "Если данных мало — дай общую рекомендацию по здоровью. "
    "Ответ строго в JSON: {\"insights\": [{\"title\": str, \"body\": str, \"category\": str, \"severity\": str}]}. "
    "category — одно из: workouts, nutrition, feelings, health, general. "
    "severity — одно из: info, warning, success. "
    "title ≤ 6 слов, body ≤ 2 предложений. Верни от 2 до 5 инсайтов."
)

_MUSCLE_HINT_SYSTEM = (
    "Ты — опытный тренер. На вход получаешь данные о балансе мышечных групп пользователя "
    "(название, подходы факт/цель, процент) и его цели. Дай 2–4 конкретных рекомендации "
    "по тренировкам отстающих групп: назови упражнения, число подходов и повторений. "
    "Ответ строго в JSON: {\"hints\": [{\"muscle_group\": str, \"exercise\": str, "
    "\"sets\": int, \"reps\": str, \"reason\": str}]}. "
    "reason ≤ 1 предложение."
)

_BODY_ASSESSMENT_SYSTEM = (
    "Ты — опытный тренер и нутрициолог. На вход получаешь последние замеры тела пользователя, "
    "его пол и возраст. Дай краткую оценку текущего состояния тела: пропорции, баланс, "
    "потенциальные зоны для улучшения. Учитывай пол и возраст. "
    "Будь доброжелательным и конкретным. 3-5 предложений на русском языке. "
    "Ответ строго в JSON: {\"assessment\": str}."
)


def is_enabled() -> bool:
    return bool(settings.openai_api_key)


async def refine_insights(context: dict, base_insights: list[dict]) -> list[dict] | None:
    """Переформулирует/дополняет инсайты через LLM. None — если AI недоступен/ошибка."""
    if not is_enabled():
        return None

    goals_summary = ", ".join(context.get("goals", [])) or "не указаны"
    modules_summary = ", ".join(context.get("modules", [])) or "все"

    user_context = {
        "цели_пользователя": goals_summary,
        "активные_модули": modules_summary,
        "период_дней": context.get("period_days", 7),
        "тренировок_за_период": context.get("workout_count", 0),
    }

    payload = {
        "model": _MODEL,
        "temperature": 0.4,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": _SYSTEM},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "user_context": user_context,
                        "context": context,
                        "detected_patterns": base_insights,
                    },
                    ensure_ascii=False,
                ),
            },
        ],
    }
    headers = {"Authorization": f"Bearer {settings.openai_api_key}"}

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(_API_URL, json=payload, headers=headers)
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        insights = parsed.get("insights", [])
        cleaned = [
            {
                "title": str(i["title"])[:80],
                "body": str(i["body"])[:400],
                "category": i.get("category", "general"),
                "severity": i.get("severity", "info"),
            }
            for i in insights
            if i.get("title") and i.get("body")
        ]
        return cleaned[:5] or None
    except (httpx.HTTPError, KeyError, ValueError, TypeError) as exc:
        logger.warning("OpenAI insight refinement failed: %s", exc)
        return None


async def get_muscle_hints(
    muscle_balance: list[dict], goals: list[str]
) -> list[dict] | None:
    """AI-подсказки по дисбалансу мышц (ТЗ п. 8.5). None — если AI недоступен."""
    if not is_enabled():
        return None

    neglected = [m for m in muscle_balance if m.get("recommended_sets", 0) > 0 and m.get("percentage", 0) < 60]
    if not neglected:
        return None

    payload = {
        "model": _MODEL,
        "temperature": 0.5,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": _MUSCLE_HINT_SYSTEM},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "goals": goals or [],
                        "neglected_groups": neglected,
                        "all_groups": muscle_balance,
                    },
                    ensure_ascii=False,
                ),
            },
        ],
    }
    headers = {"Authorization": f"Bearer {settings.openai_api_key}"}

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(_API_URL, json=payload, headers=headers)
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        hints = parsed.get("hints", [])
        cleaned = [
            {
                "muscle_group": str(h.get("muscle_group", ""))[:50],
                "exercise": str(h.get("exercise", ""))[:100],
                "sets": int(h.get("sets", 3)),
                "reps": str(h.get("reps", "8-12"))[:20],
                "reason": str(h.get("reason", ""))[:200],
            }
            for h in hints
            if h.get("muscle_group") and h.get("exercise")
        ]
        return cleaned[:4] or None
    except (httpx.HTTPError, KeyError, ValueError, TypeError) as exc:
        logger.warning("OpenAI muscle hint failed: %s", exc)
        return None


async def get_body_assessment(measurement, user) -> str | None:
    if not is_enabled():
        return None

    gender_ru = "мужской" if user.gender == "male" else "женский" if user.gender else "не указан"
    age = user.age or "не указан"

    measurements_data = {}
    field_map = {
        "weight": "Вес (кг)", "bicep_left": "Бицепс левый (см)", "bicep_right": "Бицепс правый (см)",
        "shoulders": "Плечи (см)", "chest": "Грудь (см)", "waist": "Талия (см)",
        "glutes": "Ягодицы (см)", "hips_left": "Бедро левое (см)", "hips_right": "Бедро правое (см)",
        "calves_left": "Икры левые (см)", "calves_right": "Икры правые (см)",
    }
    for attr, label in field_map.items():
        val = getattr(measurement, attr, None)
        if val is not None:
            measurements_data[label] = val

    payload = {
        "model": _MODEL,
        "temperature": 0.5,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": _BODY_ASSESSMENT_SYSTEM},
            {
                "role": "user",
                "content": json.dumps(
                    {"пол": gender_ru, "возраст": age, "замеры": measurements_data},
                    ensure_ascii=False,
                ),
            },
        ],
    }
    headers = {"Authorization": f"Bearer {settings.openai_api_key}"}

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(_API_URL, json=payload, headers=headers)
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return str(parsed.get("assessment", ""))[:1000] or None
    except (httpx.HTTPError, KeyError, ValueError, TypeError) as exc:
        logger.warning("OpenAI body assessment failed: %s", exc)
        return None
