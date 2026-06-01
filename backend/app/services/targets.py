"""Справочник мышечных групп и расчёт целевых подходов (ТЗ п. 7.3, п. 9.4).

Целевые подходы на группу в неделю зависят от целей пользователя и частоты
тренировок (число тренировок за последние 2 недели).
"""

# 17 мышечных групп (ТЗ п. 7.3); «Кардио» не участвует в балансе силовых.
MUSCLE_GROUPS: list[str] = [
    "Грудь",
    "Широчайшие",
    "Трапеции",
    "Плечи передние",
    "Плечи средние",
    "Плечи задние",
    "Бицепс",
    "Трицепс",
    "Предплечья",
    "Пресс",
    "Косые",
    "Поясница",
    "Ягодицы",
    "Квадрицепсы",
    "Бицепс бедра",
    "Икры",
    "Кардио",
]

_LARGE = {"Грудь", "Широчайшие", "Квадрицепсы", "Ягодицы"}
_MEDIUM = {
    "Трапеции",
    "Плечи передние",
    "Плечи средние",
    "Плечи задние",
    "Бицепс",
    "Трицепс",
    "Бицепс бедра",
}
_SMALL = {"Предплечья", "Пресс", "Косые", "Поясница", "Икры"}

# (min, max) подходов в неделю по размеру группы и тиру цели
_RANGES = {
    "mass": {"large": (12, 16), "medium": (8, 12), "small": (6, 8)},
    "maintenance": {"large": (8, 12), "medium": (6, 10), "small": (4, 6)},
    "other": {"large": (6, 10), "medium": (4, 8), "small": (2, 4)},
}


def _tier(goals: list[str]) -> str:
    if "mass" in goals:
        return "mass"
    if "weight_loss" in goals or "health" in goals:
        return "maintenance"
    return "other"


def _size(group: str) -> str | None:
    if group in _LARGE:
        return "large"
    if group in _MEDIUM:
        return "medium"
    if group in _SMALL:
        return "small"
    return None  # Кардио — без целевого числа подходов


def _pick(lo: int, hi: int, biweekly_workouts: int) -> int:
    """2 трен./нед → минимум; 4+ → максимум; иначе середина диапазона."""
    if biweekly_workouts <= 4:  # ~2/нед
        return lo
    if biweekly_workouts >= 8:  # ~4+/нед
        return hi
    return round((lo + hi) / 2)


def recommended_weekly_sets(goals: list[str], biweekly_workouts: int) -> dict[str, int]:
    tier = _tier(goals or [])
    result: dict[str, int] = {}
    for group in MUSCLE_GROUPS:
        size = _size(group)
        if size is None:
            continue
        lo, hi = _RANGES[tier][size]
        result[group] = _pick(lo, hi, biweekly_workouts)
    return result


# --- Питание: целевые калории и макронутриенты (ТЗ п. 9.1–9.3) -----------


def _activity_coefficient(biweekly_workouts: int) -> float:
    """Коэффициент активности TDEE по числу тренировок за 2 недели."""
    if biweekly_workouts <= 2:
        return 1.2
    if biweekly_workouts <= 6:
        return 1.375
    if biweekly_workouts <= 10:
        return 1.55
    return 1.725


def nutrition_targets(
    *,
    gender: str | None,
    weight: float | None,
    height: float | None,
    age: int | None,
    goals: list[str],
    biweekly_workouts: int,
) -> dict[str, int] | None:
    """Возвращает {calories, protein, fat, carbs} или None, если нет параметров.

    BMR (Миффлин-Сан Жеор) → TDEE × коэффициент активности → коррекция по цели.
    """
    if not weight or not height or not age:
        return None

    sex_const = -161 if gender == "female" else 5
    bmr = 10 * weight + 6.25 * height - 5 * age + sex_const
    tdee = bmr * _activity_coefficient(biweekly_workouts)

    goals = goals or []
    if "mass" in goals:
        tdee += 300
    elif "weight_loss" in goals:
        tdee -= 500

    if "mass" in goals:
        protein_per_kg = 2.0
    elif "weight_loss" in goals:
        protein_per_kg = 2.2
    else:
        protein_per_kg = 1.6

    protein = protein_per_kg * weight
    fat = 1.0 * weight
    carbs = max((tdee - protein * 4 - fat * 9) / 4, 0)

    return {
        "calories": round(tdee),
        "protein": round(protein),
        "fat": round(fat),
        "carbs": round(carbs),
    }
