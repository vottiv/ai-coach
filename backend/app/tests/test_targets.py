from app.services.targets import nutrition_targets, recommended_weekly_sets


def test_nutrition_targets_mass_male():
    t = nutrition_targets(
        gender="male",
        weight=80,
        height=180,
        age=30,
        goals=["mass"],
        biweekly_workouts=8,  # ~4/нед → коэффициент 1.55
    )
    assert t is not None
    # BMR = 10*80 + 6.25*180 - 5*30 + 5 = 1780; TDEE = 1780*1.55 + 300 = 3059
    assert t["calories"] == 3059
    assert t["protein"] == 160  # 2.0 г/кг
    assert t["fat"] == 80  # 1.0 г/кг


def test_nutrition_targets_weight_loss_female():
    t = nutrition_targets(
        gender="female",
        weight=60,
        height=165,
        age=28,
        goals=["weight_loss"],
        biweekly_workouts=2,  # коэффициент 1.2
    )
    assert t is not None
    # BMR = 10*60 + 6.25*165 - 5*28 - 161 = 1330.25; TDEE = *1.2 - 500 = 1096.3
    assert t["calories"] == 1096
    assert t["protein"] == 132  # 2.2 г/кг


def test_nutrition_targets_missing_params():
    assert nutrition_targets(
        gender="male", weight=None, height=180, age=30, goals=[], biweekly_workouts=0
    ) is None


def test_recommended_weekly_sets_mass_high_frequency():
    sets = recommended_weekly_sets(["mass"], biweekly_workouts=10)
    assert sets["Грудь"] == 16  # крупная группа, максимум диапазона
    assert "Кардио" not in sets
