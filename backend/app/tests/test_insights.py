"""Тесты детерминированного движка паттернов (ТЗ п. 14.7).

Все тесты — unit, без БД и внешних вызовов.
"""
from app.services.insights import (
    daily_recommendation,
    detect_patterns,
    pearson,
    period_to_days,
)


# --- pearson ------------------------------------------------------------------


def test_pearson_perfect_positive() -> None:
    r = pearson([1.0, 2.0, 3.0, 4.0], [2.0, 4.0, 6.0, 8.0])
    assert r is not None
    assert abs(r - 1.0) < 1e-9


def test_pearson_perfect_negative() -> None:
    r = pearson([1.0, 2.0, 3.0], [6.0, 4.0, 2.0])
    assert r is not None
    assert abs(r + 1.0) < 1e-9


def test_pearson_no_variance() -> None:
    assert pearson([3.0, 3.0, 3.0], [1.0, 2.0, 3.0]) is None


def test_pearson_too_few_points() -> None:
    assert pearson([1.0, 2.0], [3.0, 4.0]) is None


# --- period_to_days -----------------------------------------------------------


def test_period_to_days_known() -> None:
    assert period_to_days("week") == 7
    assert period_to_days("month") == 30
    assert period_to_days("3months") == 90


def test_period_to_days_unknown_default() -> None:
    assert period_to_days("year") == 7  # fallback


# --- detect_patterns ----------------------------------------------------------


def _make_ctx(
    *,
    days: list[dict] | None = None,
    muscle_balance: list[dict] | None = None,
    abnormal_biomarkers: list[dict] | None = None,
    targets: dict | None = None,
    goals: list[str] | None = None,
    workout_count: int = 0,
    modules: list[str] | None = None,
) -> dict:
    return {
        "period_days": 7,
        "goals": goals or [],
        "modules": modules if modules is not None else [],
        "targets": targets,
        "days": days or [],
        "muscle_balance": muscle_balance or [],
        "abnormal_biomarkers": abnormal_biomarkers or [],
        "workout_count": workout_count,
    }


def test_no_data_returns_empty_insights() -> None:
    ctx = _make_ctx()
    assert detect_patterns(ctx) == []


def test_biomarker_insight_detected() -> None:
    ctx = _make_ctx(
        abnormal_biomarkers=[{"name": "Гемоглобин", "status": "low", "value": 110.0}]
    )
    insights = detect_patterns(ctx)
    assert len(insights) >= 1
    assert insights[0]["category"] == "health"
    assert "Гемоглобин" in insights[0]["body"]


def test_multiple_biomarkers_truncated_to_three() -> None:
    ctx = _make_ctx(
        abnormal_biomarkers=[
            {"name": f"Маркер{i}", "status": "high", "value": 1.0} for i in range(5)
        ]
    )
    insights = detect_patterns(ctx)
    # тело не должно содержать marker3/marker4
    body = insights[0]["body"]
    assert "Маркер3" not in body
    assert "Маркер4" not in body


def test_muscle_imbalance_detected() -> None:
    ctx = _make_ctx(
        muscle_balance=[
            {"muscle_group": "Бицепс", "weekly_sets": 2, "recommended_sets": 8, "percentage": 25},
            {"muscle_group": "Грудь", "weekly_sets": 10, "recommended_sets": 12, "percentage": 83},
        ],
        workout_count=3,
    )
    insights = detect_patterns(ctx)
    titles = [i["title"] for i in insights]
    assert "Дисбаланс мышечных групп" in titles
    assert any("бицепс" in i["body"].lower() for i in insights if i["category"] == "workouts")


def test_imbalance_ignored_when_no_workouts() -> None:
    ctx = _make_ctx(
        muscle_balance=[
            {"muscle_group": "Бицепс", "weekly_sets": 0, "recommended_sets": 8, "percentage": 0},
        ],
        workout_count=0,
    )
    insights = detect_patterns(ctx)
    assert not any(i["title"] == "Дисбаланс мышечных групп" for i in insights)


def test_protein_insight_detected() -> None:
    ctx = _make_ctx(
        days=[
            {"protein": 50.0, "calories": 1800.0, "workout": False, "tonnage": None,
             "feeling": None, "sleep_quality": None, "energy": None, "mood": None,
             "stress": None, "fatigue": None, "body_weight": None},
        ] * 5,
        targets={"calories": 2500, "protein": 160, "fat": 80, "carbs": 250},
        workout_count=2,
    )
    insights = detect_patterns(ctx)
    assert any(i["category"] == "nutrition" and "белк" in i["body"].lower() for i in insights)


def test_calorie_deficit_mass_goal() -> None:
    ctx = _make_ctx(
        days=[
            {"protein": 150.0, "calories": 1800.0, "workout": True, "tonnage": 5000.0,
             "feeling": None, "sleep_quality": None, "energy": None, "mood": None,
             "stress": None, "fatigue": None, "body_weight": None},
        ] * 5,
        targets={"calories": 3000, "protein": 150, "fat": 80, "carbs": 300},
        goals=["mass"],
        workout_count=5,
    )
    insights = detect_patterns(ctx)
    assert any("набор" in i["title"].lower() or "калор" in i["body"].lower() for i in insights)


def test_sleep_workout_insight() -> None:
    base = {
        "workout": True, "protein": None, "calories": None, "feeling": None,
        "stress": None, "fatigue": None, "mood": None, "energy": None, "body_weight": None,
    }
    days = [dict(base, sleep_quality=1, tonnage=2000.0)] * 4 + \
           [dict(base, sleep_quality=5, tonnage=5000.0)] * 4
    ctx = _make_ctx(days=days, workout_count=8)
    insights = detect_patterns(ctx)
    assert any(i["category"] == "feelings" and "сон" in i["title"].lower() for i in insights)


def test_sleep_energy_correlation() -> None:
    base = {
        "workout": False, "tonnage": None, "protein": None, "calories": None,
        "feeling": None, "mood": None, "stress": None, "fatigue": None, "body_weight": None,
    }
    days = [dict(base, sleep_quality=i, energy=i) for i in range(1, 6)] * 3
    ctx = _make_ctx(days=days)
    insights = detect_patterns(ctx)
    assert any("сон" in i["title"].lower() and "энерги" in i["body"].lower() for i in insights)


def test_stress_skip_insight() -> None:
    base = {
        "tonnage": None, "protein": None, "calories": None, "feeling": None,
        "sleep_quality": None, "energy": None, "mood": None, "fatigue": None, "body_weight": None,
    }
    days = [dict(base, stress=5, workout=False)] * 5 + \
           [dict(base, stress=1, workout=True)] * 5
    ctx = _make_ctx(days=days)
    insights = detect_patterns(ctx)
    assert any("стресс" in i["title"].lower() for i in insights)


def test_limit_respected() -> None:
    ctx = _make_ctx(
        abnormal_biomarkers=[{"name": "X", "status": "high", "value": 1.0}],
        muscle_balance=[
            {"muscle_group": "Бицепс", "weekly_sets": 0, "recommended_sets": 8, "percentage": 0},
        ],
        workout_count=3,
        targets={"calories": 2500, "protein": 160, "fat": 80, "carbs": 250},
        days=[
            {"protein": 40.0, "calories": 1200.0, "workout": False, "tonnage": None,
             "feeling": None, "sleep_quality": None, "energy": None, "mood": None,
             "stress": None, "fatigue": None, "body_weight": None},
        ] * 7,
    )
    assert len(detect_patterns(ctx, limit=2)) <= 2


# --- daily_recommendation -----------------------------------------------------


def test_recommendation_fallback_to_rest() -> None:
    ctx = _make_ctx(modules=["workouts"], workout_count=0)
    rec = daily_recommendation(ctx)
    assert rec["category"] == "workouts"
    assert "тренировок" in rec["body"].lower() or "размяться" in rec["title"].lower()


def test_recommendation_ok_when_all_good() -> None:
    # Задаём workout_count > 0, чтобы fallback «нет тренировок» не срабатывал.
    ctx = _make_ctx(workout_count=5)
    rec = daily_recommendation(ctx)
    assert rec["category"] == "general"


def test_recommendation_uses_top_insight_when_available() -> None:
    ctx = _make_ctx(
        abnormal_biomarkers=[{"name": "Гемоглобин", "status": "low", "value": 110.0}]
    )
    rec = daily_recommendation(ctx)
    assert rec["category"] == "health"


# --- severity field ----------------------------------------------------------


def test_insights_have_severity() -> None:
    ctx = _make_ctx(
        abnormal_biomarkers=[{"name": "Гемоглобин", "status": "low", "value": 110.0}]
    )
    insights = detect_patterns(ctx)
    assert len(insights) >= 1
    for i in insights:
        assert "severity" in i
        assert i["severity"] in ("info", "warning", "success")


# --- volume_trend -------------------------------------------------------------


def test_volume_trend_drop() -> None:
    base = {
        "workout": True, "protein": None, "calories": None, "feeling": None,
        "sleep_quality": None, "energy": None, "mood": None, "stress": None,
        "fatigue": None, "body_weight": None, "soreness": None, "motivation": None,
        "carbs": None, "fat_nutrient": None,
    }
    days = [dict(base, tonnage=10000.0)] * 3 + [dict(base, tonnage=3000.0)] * 3
    ctx = _make_ctx(days=days, workout_count=6)
    insights = detect_patterns(ctx)
    assert any("тоннаж" in i["title"].lower() or "снижает" in i["title"].lower() for i in insights)


def test_volume_trend_growth() -> None:
    base = {
        "workout": True, "protein": None, "calories": None, "feeling": None,
        "sleep_quality": None, "energy": None, "mood": None, "stress": None,
        "fatigue": None, "body_weight": None, "soreness": None, "motivation": None,
        "carbs": None, "fat_nutrient": None,
    }
    days = [dict(base, tonnage=3000.0)] * 3 + [dict(base, tonnage=10000.0)] * 3
    ctx = _make_ctx(days=days, workout_count=6)
    insights = detect_patterns(ctx)
    assert any("рост" in i["title"].lower() or "объём" in i["title"].lower() for i in insights)


def test_volume_trend_no_data() -> None:
    ctx = _make_ctx(days=[], workout_count=0)
    insights = detect_patterns(ctx)
    assert not any("тоннаж" in i.get("title", "").lower() for i in insights)


# --- fatigue_accumulation -----------------------------------------------------


def test_fatigue_accumulation_detected() -> None:
    base = {
        "workout": False, "tonnage": None, "protein": None, "calories": None,
        "feeling": None, "sleep_quality": None, "energy": None, "mood": None,
        "stress": None, "body_weight": None, "soreness": None, "motivation": None,
        "carbs": None, "fat_nutrient": None,
    }
    days = [dict(base, fatigue=5)] * 5 + [dict(base, fatigue=2)] * 3
    ctx = _make_ctx(days=days)
    insights = detect_patterns(ctx)
    assert any("усталост" in i["title"].lower() or "усталост" in i["body"].lower() for i in insights)


def test_fatigue_no_accumulation() -> None:
    base = {
        "workout": False, "tonnage": None, "protein": None, "calories": None,
        "feeling": None, "sleep_quality": None, "energy": None, "mood": None,
        "stress": None, "body_weight": None, "soreness": None, "motivation": None,
        "carbs": None, "fat_nutrient": None,
    }
    days = [dict(base, fatigue=2)] * 7
    ctx = _make_ctx(days=days)
    insights = detect_patterns(ctx)
    assert not any("усталост" in i.get("title", "").lower() for i in insights)


# --- consistency --------------------------------------------------------------


def test_consistency_long_gap() -> None:
    base = {
        "tonnage": None, "protein": None, "calories": None, "feeling": None,
        "sleep_quality": None, "energy": None, "mood": None, "stress": None,
        "fatigue": None, "body_weight": None, "soreness": None, "motivation": None,
        "carbs": None, "fat_nutrient": None,
    }
    days = (
        [dict(base, workout=True)] * 2
        + [dict(base, workout=False)] * 5
        + [dict(base, workout=True)] * 2
    )
    ctx = _make_ctx(days=days, workout_count=4)
    insights = detect_patterns(ctx)
    assert any("перерыв" in i["title"].lower() for i in insights)


# --- soreness_overload --------------------------------------------------------


def test_soreness_overload_detected() -> None:
    base = {
        "workout": False, "tonnage": None, "protein": None, "calories": None,
        "feeling": None, "sleep_quality": None, "energy": None, "mood": None,
        "stress": None, "fatigue": None, "body_weight": None, "motivation": None,
        "carbs": None, "fat_nutrient": None,
    }
    days = [dict(base, soreness=5)] * 4 + [dict(base, soreness=2)] * 3
    ctx = _make_ctx(days=days)
    insights = detect_patterns(ctx)
    assert any("болезнен" in i["title"].lower() for i in insights)
