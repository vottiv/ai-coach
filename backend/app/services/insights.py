"""Кросс-модульный движок поиска закономерностей (ТЗ п. 8.5, этап 5).

Ядро ценности этапа 5 — детерминированный поиск корреляций и паттернов между
модулями (тренировки ↔ питание ↔ ощущения ↔ анализы) по общей оси `user_id` + `date`
(ТЗ п. 10.2). Работает без AI; LLM-слой (app/services/ai.py) лишь обогащает текст.

Разделение ответственности:
- `build_context` — асинхронно собирает данные из всех включённых модулей.
- `detect_patterns` / `daily_recommendation` — чистые функции над контекстом
  (легко покрываются unit-тестами, ТЗ п. 14.7).
"""
from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.health import Biomarker, HealthAnalysis
from app.models.nutrition import FoodEntry, NutritionLog
from app.models.subjective import SubjectiveLog
from app.models.user import User
from app.modules.workouts import service as workouts_service
from app.services.targets import nutrition_targets

# Категории инсайтов соответствуют ключам модулей фронта (ТЗ п. 4.2) + "general".
Category = str

PERIOD_DAYS = {"week": 7, "month": 30, "3months": 90}


def period_to_days(period: str) -> int:
    return PERIOD_DAYS.get(period, 7)


# --- Чистая статистика -----------------------------------------------------


def _mean(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None


def pearson(xs: list[float], ys: list[float]) -> float | None:
    """Коэффициент корреляции Пирсона; None при недостатке данных/нулевой дисперсии."""
    n = len(xs)
    if n < 3 or n != len(ys):
        return None
    mx = sum(xs) / n
    my = sum(ys) / n
    cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys, strict=True))
    var_x = sum((x - mx) ** 2 for x in xs)
    var_y = sum((y - my) ** 2 for y in ys)
    if var_x == 0 or var_y == 0:
        return None
    return cov / (var_x * var_y) ** 0.5


def _paired(days: list[dict], key_a: str, key_b: str) -> tuple[list[float], list[float]]:
    xs: list[float] = []
    ys: list[float] = []
    for d in days:
        a, b = d.get(key_a), d.get(key_b)
        if a is not None and b is not None:
            xs.append(float(a))
            ys.append(float(b))
    return xs, ys


# --- Сбор контекста (async, БД) -------------------------------------------


async def build_context(db: AsyncSession, user: User, period_days: int) -> dict[str, Any]:
    """Собирает данные только по включённым модулям пользователя (ТЗ п. 8.5)."""
    today = date.today()
    start = today - timedelta(days=period_days - 1)
    enabled: list[str] = user.enabled_modules or []

    def on(module: str) -> bool:
        return not enabled or module in enabled

    days: dict[date, dict[str, Any]] = defaultdict(
        lambda: {
            "tonnage": None,
            "workout": False,
            "feeling": None,
            "calories": None,
            "protein": None,
            "carbs": None,
            "fat_nutrient": None,
            "sleep_quality": None,
            "energy": None,
            "mood": None,
            "stress": None,
            "fatigue": None,
            "body_weight": None,
            "soreness": None,
            "motivation": None,
        }
    )

    muscle_balance: list[dict] = []
    if on("workouts"):
        workouts = await workouts_service.list_workouts(
            db, user.id, from_date=start, to_date=today
        )
        for w in workouts:
            cell = days[w.date]
            cell["workout"] = True
            cell["tonnage"] = (cell["tonnage"] or 0) + workouts_service.tonnage(w)
            if w.feeling is not None:
                cell["feeling"] = w.feeling
        muscle_balance = await workouts_service.muscle_balance(db, user.id, user.goals or [])

    if on("nutrition"):
        rows = await db.execute(
            select(
                NutritionLog.date,
                func.coalesce(func.sum(FoodEntry.calories), 0),
                func.coalesce(func.sum(FoodEntry.protein), 0),
                func.coalesce(func.sum(FoodEntry.carbs), 0),
                func.coalesce(func.sum(FoodEntry.fat), 0),
            )
            .select_from(NutritionLog)
            .join(FoodEntry, FoodEntry.nutrition_log_id == NutritionLog.id)
            .where(NutritionLog.user_id == user.id, NutritionLog.date >= start)
            .group_by(NutritionLog.date)
        )
        for d, cal, protein, carbs, fat_n in rows.all():
            days[d]["calories"] = round(float(cal), 1)
            days[d]["protein"] = round(float(protein), 1)
            days[d]["carbs"] = round(float(carbs), 1)
            days[d]["fat_nutrient"] = round(float(fat_n), 1)

    if on("feelings"):
        logs = await db.scalars(
            select(SubjectiveLog).where(
                SubjectiveLog.user_id == user.id, SubjectiveLog.date >= start
            )
        )
        for log in logs:
            cell = days[log.date]
            if log.slot == "morning":
                cell["sleep_quality"] = log.sleep_quality
                cell["energy"] = log.energy
                if log.body_weight is not None:
                    cell["body_weight"] = log.body_weight
                if log.soreness is not None:
                    cell["soreness"] = log.soreness
                if log.motivation is not None:
                    cell["motivation"] = log.motivation
            if log.mood is not None:
                cell["mood"] = log.mood
            if log.stress is not None:
                cell["stress"] = log.stress
            if log.fatigue is not None:
                cell["fatigue"] = log.fatigue

    abnormal: list[dict] = []
    if on("health"):
        latest = await db.scalar(
            select(HealthAnalysis)
            .where(HealthAnalysis.user_id == user.id)
            .order_by(HealthAnalysis.date.desc(), HealthAnalysis.id.desc())
        )
        if latest is not None:
            biomarkers = await db.scalars(
                select(Biomarker).where(Biomarker.analysis_id == latest.id)
            )
            abnormal = [
                {"name": b.name, "status": b.status, "value": b.value}
                for b in biomarkers
                if b.status != "normal"
            ]

    targets = nutrition_targets(
        gender=user.gender,
        weight=user.weight,
        height=user.height,
        age=user.age,
        goals=user.goals or [],
        biweekly_workouts=sum(1 for c in days.values() if c["workout"]),
    )

    day_list = [{"date": d.isoformat(), **days[d]} for d in sorted(days)]
    return {
        "period_days": period_days,
        "goals": user.goals or [],
        "modules": enabled,
        "targets": targets,
        "days": day_list,
        "muscle_balance": muscle_balance,
        "abnormal_biomarkers": abnormal,
        "workout_count": sum(1 for c in days.values() if c["workout"]),
    }


# --- Детекторы паттернов (чистые функции) ---------------------------------


def _imbalance_insight(ctx: dict) -> dict | None:
    neglected = sorted(
        (m for m in ctx.get("muscle_balance", []) if m["recommended_sets"] > 0 and m["percentage"] < 50),
        key=lambda m: m["percentage"],
    )
    if not neglected or ctx.get("workout_count", 0) == 0:
        return None
    names = ", ".join(m["muscle_group"].lower() for m in neglected[:3])
    return {
        "title": "Дисбаланс мышечных групп",
        "body": (
            f"За неделю недогружены: {names}. Добавьте 1–2 упражнения на эти группы, "
            "чтобы выровнять объём и снизить риск перекоса."
        ),
        "category": "workouts",
        "severity": "warning",
    }


def _sleep_workout_insight(ctx: dict) -> dict | None:
    days = ctx["days"]
    low = [d["tonnage"] for d in days if d.get("sleep_quality") and d["sleep_quality"] <= 2 and d.get("tonnage")]
    high = [d["tonnage"] for d in days if d.get("sleep_quality") and d["sleep_quality"] >= 4 and d.get("tonnage")]
    avg_low, avg_high = _mean(low), _mean(high)
    if avg_low is not None and avg_high is not None and avg_high > avg_low * 1.15:
        drop = round((1 - avg_low / avg_high) * 100)
        return {
            "title": "Сон влияет на тренировки",
            "body": (
                f"В дни после плохого сна тоннаж ниже примерно на {drop}%. "
                "Приоритет сну перед тяжёлыми сессиями повышает рабочие веса."
            ),
            "category": "feelings",
            "severity": "warning",
        }
    return None


def _sleep_energy_insight(ctx: dict) -> dict | None:
    xs, ys = _paired(ctx["days"], "sleep_quality", "energy")
    r = pearson(xs, ys)
    if r is not None and r >= 0.5:
        return {
            "title": "Сон определяет энергию дня",
            "body": (
                "Чем выше качество сна, тем больше энергии в течение дня "
                f"(корреляция {r:.2f}). Стабильный режим сна — простой рычаг самочувствия."
            ),
            "category": "feelings",
            "severity": "info",
        }
    return None


def _stress_skip_insight(ctx: dict) -> dict | None:
    days = ctx["days"]
    low_stress = [d for d in days if d.get("stress") and d["stress"] <= 2]
    high_stress = [d for d in days if d.get("stress") and d["stress"] >= 4]
    if len(low_stress) < 2 or not high_stress:
        return None
    skip_low = sum(1 for d in low_stress if not d["workout"]) / len(low_stress)
    skip_high = sum(1 for d in high_stress if not d["workout"]) / len(high_stress)
    if skip_low > skip_high + 0.3:
        return {
            "title": "Низкое спокойствие мешает тренировкам",
            "body": (
                f"В дни низкого спокойствия вы пропускаете тренировки чаще "
                f"({round(skip_low * 100)}% против {round(skip_high * 100)}%). "
                "В такие дни помогает лёгкая нагрузка вместо полного пропуска."
            ),
            "category": "feelings",
            "severity": "warning",
        }
    return None


def _protein_insight(ctx: dict) -> dict | None:
    targets = ctx.get("targets")
    if not targets:
        return None
    proteins = [d["protein"] for d in ctx["days"] if d.get("protein")]
    avg = _mean(proteins)
    target = targets.get("protein")
    if avg is not None and target and avg < target * 0.8:
        return {
            "title": "Не хватает белка",
            "body": (
                f"В среднем вы получаете {round(avg)} г белка при цели {target} г. "
                "Дефицит белка тормозит восстановление и набор мышц."
            ),
            "category": "nutrition",
            "severity": "warning",
        }
    return None


def _calorie_insight(ctx: dict) -> dict | None:
    targets = ctx.get("targets")
    if not targets:
        return None
    cals = [d["calories"] for d in ctx["days"] if d.get("calories")]
    avg = _mean(cals)
    target = targets.get("calories")
    goals = ctx.get("goals", [])
    if avg is None or not target:
        return None
    ratio = avg / target
    if "mass" in goals and ratio < 0.9:
        return {
            "title": "Калорий мало для набора",
            "body": (
                f"Средний приём {round(avg)} ккал ниже цели {target} ккал. "
                "Для роста массы важен профицит — добавьте калорийности."
            ),
            "category": "nutrition",
            "severity": "warning",
        }
    if "weight_loss" in goals and ratio > 1.1:
        return {
            "title": "Калорий больше цели",
            "body": (
                f"Средний приём {round(avg)} ккал выше цели {target} ккал. "
                "Для снижения веса нужен дефицит — пересмотрите порции."
            ),
            "category": "nutrition",
            "severity": "warning",
        }
    return None


def _nutrition_mood_insight(ctx: dict) -> dict | None:
    xs, ys = _paired(ctx["days"], "calories", "mood")
    r = pearson(xs, ys)
    if r is not None and abs(r) >= 0.5:
        if r < 0:
            body = (
                "В дни с более высоким потреблением настроение и самочувствие ниже "
                f"(корреляция {r:.2f}). Возможна реакция на тяжёлую/обильную еду."
            )
        else:
            body = (
                "Дни с полноценным питанием совпадают с лучшим настроением "
                f"(корреляция {r:.2f})."
            )
        return {"title": "Питание и самочувствие связаны", "body": body, "category": "nutrition", "severity": "info"}
    return None


def _body_weight_insight(ctx: dict) -> dict | None:
    points = [(d["date"], d["body_weight"]) for d in ctx["days"] if d.get("body_weight")]
    if len(points) < 3:
        return None
    first = points[0][1]
    last = points[-1][1]
    delta = round(last - first, 1)
    if abs(delta) < 0.5:
        return None
    goals = ctx.get("goals", [])
    direction = "снизился" if delta < 0 else "вырос"
    aligned = (delta < 0 and "weight_loss" in goals) or (delta > 0 and "mass" in goals)
    tail = "Динамика совпадает с целью." if aligned else "Сверьте динамику с вашей целью."
    return {
        "title": "Динамика веса",
        "body": f"Вес {direction} на {abs(delta)} кг за период. {tail}",
        "category": "nutrition",
        "severity": "success" if aligned else "warning",
    }


def _volume_trend_insight(ctx: dict) -> dict | None:
    tonnage_days = [d["tonnage"] for d in ctx["days"] if d.get("tonnage")]
    if len(tonnage_days) < 4:
        return None
    mid = len(tonnage_days) // 2
    first_half = _mean(tonnage_days[:mid])
    second_half = _mean(tonnage_days[mid:])
    if first_half is None or second_half is None or first_half == 0:
        return None
    if second_half < first_half * 0.7:
        drop = round((1 - second_half / first_half) * 100)
        return {
            "title": "Тоннаж снижается",
            "body": (
                f"Объём тренировок упал на {drop}% во второй половине периода. "
                "Возможная причина — накопление усталости или недостаточное восстановление."
            ),
            "category": "workouts",
            "severity": "warning",
        }
    if second_half > first_half * 1.3:
        growth = round((second_half / first_half - 1) * 100)
        return {
            "title": "Рост тренировочного объёма",
            "body": (
                f"Объём вырос на {growth}% — прогресс налицо. "
                "Следите за восстановлением, чтобы не перетренироваться."
            ),
            "category": "workouts",
            "severity": "success",
        }
    return None


def _fatigue_accumulation_insight(ctx: dict) -> dict | None:
    days = ctx["days"]
    if len(days) < 5:
        return None
    low_freshness = sum(1 for d in days if d.get("fatigue") and d["fatigue"] <= 2)
    ratio = low_freshness / len(days)
    if ratio < 0.4:
        return None
    return {
        "title": "Накопление усталости",
        "body": (
            f"Низкая бодрость отмечена {low_freshness} из {len(days)} дней. "
            "Рекомендуется разгрузочная неделя или снижение интенсивности."
        ),
        "category": "feelings",
        "severity": "warning",
    }


def _consistency_insight(ctx: dict) -> dict | None:
    days = ctx["days"]
    workout_days = [d for d in days if d.get("workout")]
    total = len(days)
    if total < 7 or not workout_days:
        return None
    longest_gap = 0
    current_gap = 0
    for d in days:
        if d.get("workout"):
            longest_gap = max(longest_gap, current_gap)
            current_gap = 0
        else:
            current_gap += 1
    longest_gap = max(longest_gap, current_gap)
    if longest_gap < 4:
        return None
    return {
        "title": "Долгий перерыв в тренировках",
        "body": (
            f"Максимальный пропуск — {longest_gap} дней подряд за {total}-дневный период. "
            "Регулярность важнее интенсивности. Попробуйте планировать тренировки заранее."
        ),
        "category": "workouts",
        "severity": "info",
    }


def _soreness_overload_insight(ctx: dict) -> dict | None:
    days = ctx["days"]
    low_comfort = [d for d in days if d.get("soreness") and d["soreness"] <= 2]
    if len(low_comfort) < 3:
        return None
    return {
        "title": "Низкий комфорт тела",
        "body": (
            f"Низкий комфорт тела отмечен {len(low_comfort)} дней за период. "
            "Возможно, стоит снизить объём или добавить дни отдыха между тяжёлыми тренировками."
        ),
        "category": "feelings",
        "severity": "warning",
    }


def _biomarker_insight(ctx: dict) -> dict | None:
    abnormal = ctx.get("abnormal_biomarkers", [])
    if not abnormal:
        return None
    names = ", ".join(b["name"] for b in abnormal[:3])
    return {
        "title": "Отклонения в анализах",
        "body": (
            f"Вне референса: {names}. Обратите внимание на эти показатели "
            "и при необходимости проконсультируйтесь со специалистом."
        ),
        "category": "health",
        "severity": "warning",
    }


_DETECTORS = (
    _biomarker_insight,
    _imbalance_insight,
    _sleep_workout_insight,
    _protein_insight,
    _calorie_insight,
    _stress_skip_insight,
    _nutrition_mood_insight,
    _sleep_energy_insight,
    _body_weight_insight,
    _volume_trend_insight,
    _fatigue_accumulation_insight,
    _consistency_insight,
    _soreness_overload_insight,
)


def detect_patterns(ctx: dict, limit: int = 5) -> list[dict]:
    """Прогоняет детекторы и возвращает 0..limit инсайтов (ТЗ: 2–5)."""
    insights: list[dict] = []
    for detector in _DETECTORS:
        result = detector(ctx)
        if result is not None:
            result.setdefault("severity", "info")
            insights.append(result)
        if len(insights) >= limit:
            break
    return insights


def daily_recommendation(ctx: dict) -> dict:
    """Короткая рекомендация дня — самый приоритетный инсайт либо мотивация."""
    insights = detect_patterns(ctx, limit=1)
    if insights:
        return insights[0]
    if ctx.get("workout_count", 0) == 0 and (not ctx["modules"] or "workouts" in ctx["modules"]):
        return {
            "title": "Пора размяться",
            "body": "За период не было тренировок. Даже короткая сессия запустит прогресс.",
            "category": "workouts",
            "severity": "info",
        }
    return {
        "title": "Так держать",
        "body": "Данные в норме, явных перекосов нет. Продолжайте в том же ритме.",
        "category": "general",
        "severity": "success",
    }
