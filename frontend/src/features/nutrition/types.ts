export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodIn {
  name: string;
  weight: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface FoodOut extends FoodIn {
  id: number;
  calories: number;
}

export interface Totals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface NutritionLog {
  id: number;
  date: string;
  meal_type: MealType;
  photo_url: string | null;
  foods: FoodOut[];
  totals: Totals;
}

export interface NutritionCreate {
  date: string;
  meal_type: MealType;
  photo_url?: string | null;
  foods: FoodIn[];
}

export interface DailySummary {
  date: string;
  totals: Totals;
  targets: { calories: number; protein: number; fat: number; carbs: number } | null;
}

export interface RecognizeResult {
  foods: { name: string; weight: number; protein: number; fat: number; carbs: number }[];
  note: string;
}

export const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "Завтрак" },
  { key: "lunch", label: "Обед" },
  { key: "dinner", label: "Ужин" },
  { key: "snack", label: "Перекус" },
];

export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snack: "Перекус",
};

/** Авто-калории: Б×4 + Ж×9 + У×4 (ТЗ п. 6.4.1). */
export function foodCalories(protein: number, fat: number, carbs: number): number {
  return Math.round((protein * 4 + fat * 9 + carbs * 4) * 10) / 10;
}
