import { api } from "@/lib/api";

export interface AIResponse {
  content: string;
  model?: string;
}

export interface FoodRecognitionResponse {
  products: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  }>;
  total: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

export interface MedicalAnalysisResponse {
  analysis_type: string;
  parameters: Array<{
    name: string;
    value: string;
    unit: string;
    reference: string;
    status: "normal" | "high" | "low";
  }>;
  summary: string;
}

export async function analyzeWorkout(workoutData: any, userContext: any) {
  const res = await api.post<AIResponse>("/ai/workouts/analyze", {
    workout_data: workoutData,
    user_context: userContext,
  });
  return res;
}

export async function getNutritionInsights(nutritionLogs: any[], userContext: any) {
  const res = await api.post<AIResponse>("/ai/nutrition/insights", {
    nutrition_logs: nutritionLogs,
    user_context: userContext,
  });
  return res;
}

export async function recognizeFood(imageUrl: string) {
  const res = await api.post<FoodRecognitionResponse>("/ai/nutrition/recognize-food", {
    image_url: imageUrl,
  });
  return res;
}

export async function recognizeMedicalAnalysis(imageUrl: string) {
  const res = await api.post<MedicalAnalysisResponse>("/ai/health/recognize-analysis", {
    image_url: imageUrl,
  });
  return res;
}

export async function generatePersonalizedPlan(userContext: any, history: any) {
  const res = await api.post<AIResponse>("/ai/plan/generate", {
    user_context: userContext,
    history: history,
  });
  return res;
}

export async function findPatterns(userContext: any, history: any) {
  const res = await api.post<AIResponse>("/ai/patterns/find", {
    user_context: userContext,
    history: history,
  });
  return res;
}