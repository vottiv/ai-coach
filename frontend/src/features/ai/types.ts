export type InsightCategory =
  | "workouts"
  | "nutrition"
  | "feelings"
  | "health"
  | "general";

export type InsightSeverity = "info" | "warning" | "success";

export interface Insight {
  title: string;
  body: string;
  category: InsightCategory;
  severity: InsightSeverity;
}

export interface RecommendationOut {
  recommendation: Insight;
  generated_at: string;
  ai_powered: boolean;
}

export interface InsightsOut {
  period: string;
  insights: Insight[];
  ai_powered: boolean;
}

export interface MuscleHint {
  muscle_group: string;
  exercise: string;
  sets: number;
  reps: string;
  reason: string;
}

export interface MuscleHintOut {
  hints: MuscleHint[];
  ai_powered: boolean;
}
