export type WorkoutType = "strength" | "cardio" | "stretch" | "hiit" | "mixed";

export interface Exercise {
  id: number;
  name: string;
  category: string;
  equipment_type: string;
  default_bodyweight_percent: number | null;
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
  superset_id?: string | null;
  superset_order?: number | null;
  equipment_type?: string | null;
  bodyweight_percent?: number | null;
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
  superset_id: string | null;
  superset_order: number | null;
  equipment_type: string;
  bodyweight_percent: number | null;
  bodyweight_used: number | null;
}

export interface WorkoutOut {
  id: number;
  date: string;
  type: string;
  feeling: number | null;
  notes: string | null;
  duration: number | null;
  exercises: WorkoutExerciseOut[];
  tonnage: number;
  intensity: string;
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

export interface PaginatedWorkouts {
  items: WorkoutListItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface ExerciseRecordSummary {
  exercise_id: number;
  exercise_name: string;
  max_weight: number;
  max_reps_at_max_weight: number;
}

export interface MuscleGroupBalance {
  category: string;
  weekly_sets: number;
  recommended_sets: number;
  percentage: number;
  groups: MuscleBalanceItem[];
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

export const FEELINGS = ["1", "2", "3", "4", "5"];

export const PR_LABEL: Record<PersonalRecord["type"], string> = {
  max_weight: "Макс. вес",
  max_reps: "Макс. повторы",
  max_volume: "Макс. объём",
};

export const EQUIPMENT_TYPES: { key: string; label: string; bodyweight_percent: number | null }[] = [
  { key: "bodyweight", label: "Собственный вес", bodyweight_percent: 100 },
  { key: "dumbbell", label: "Гантели", bodyweight_percent: null },
  { key: "barbell", label: "Штанга", bodyweight_percent: null },
  { key: "machine", label: "Тренажер", bodyweight_percent: null },
  { key: "cable", label: "Блок", bodyweight_percent: null },
  { key: "band", label: "Резинки", bodyweight_percent: null },
  { key: "kettlebell", label: "Гиря", bodyweight_percent: null },
  { key: "other", label: "Другое", bodyweight_percent: null },
];
