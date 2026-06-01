export type WorkoutType = "strength" | "cardio" | "stretch" | "hiit" | "mixed";

export interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_groups: string[];
  is_custom: boolean;
}

export interface ExerciseMeta {
  categories: string[];
  muscle_groups: string[];
}

export interface SetIn {
  weight: number;
  reps: number;
  rpe?: number | null;
}

export interface WorkoutExerciseIn {
  exercise_id: number | null;
  exercise_name: string;
  sets: SetIn[];
}

export interface WorkoutCreate {
  date: string;
  type: WorkoutType;
  feeling?: number | null;
  notes?: string | null;
  duration?: number | null;
  exercises: WorkoutExerciseIn[];
}

export interface SetOut {
  id: number;
  weight: number;
  reps: number;
  rpe: number | null;
}

export interface WorkoutExerciseOut {
  id: number;
  exercise_id: number | null;
  exercise_name: string;
  order: number;
  sets: SetOut[];
}

export interface WorkoutOut {
  id: number;
  date: string;
  type: WorkoutType;
  feeling: number | null;
  notes: string | null;
  duration: number | null;
  exercises: WorkoutExerciseOut[];
  tonnage: number;
}

export interface WorkoutListItem {
  id: number;
  date: string;
  type: WorkoutType;
  feeling: number | null;
  exercise_count: number;
  tonnage: number;
}

export interface CalendarDay {
  date: string;
  count: number;
}

export interface CalendarOut {
  days: CalendarDay[];
  month_total: number;
  year_total: number;
}

export interface MuscleBalanceItem {
  muscle_group: string;
  weekly_sets: number;
  recommended_sets: number;
  percentage: number;
}

export interface VolumePoint {
  label: string;
  volume: number;
}

export interface PersonalRecord {
  id: number;
  exercise_id: number | null;
  exercise_name: string;
  type: "max_weight" | "max_reps" | "max_volume";
  value: number;
  achieved_at: string;
}

export const WORKOUT_TYPES: { key: WorkoutType; label: string }[] = [
  { key: "strength", label: "Силовая" },
  { key: "cardio", label: "Кардио" },
  { key: "stretch", label: "Растяжка" },
  { key: "hiit", label: "HIIT" },
  { key: "mixed", label: "Комбинированная" },
];

export const WORKOUT_TYPE_LABEL: Record<WorkoutType, string> = {
  strength: "Силовая",
  cardio: "Кардио",
  stretch: "Растяжка",
  hiit: "HIIT",
  mixed: "Комбинированная",
};

export const FEELINGS = ["😣", "😕", "😐", "🙂", "😃"];

export const PR_LABEL: Record<PersonalRecord["type"], string> = {
  max_weight: "Макс. вес",
  max_reps: "Макс. повторы",
  max_volume: "Макс. объём",
};
