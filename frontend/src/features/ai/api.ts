import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

import type { InsightsOut, MuscleHintOut, RecommendationOut } from "./types";

export const aiKeys = {
  recommendation: ["ai-recommendation"] as const,
  insights: (period: string) => ["ai-insights", period] as const,
  muscleHints: ["ai-muscle-hints"] as const,
};

export function useRecommendation() {
  return useQuery({
    queryKey: aiKeys.recommendation,
    queryFn: () => api.get<RecommendationOut>("/ai/recommendations"),
    staleTime: 1000 * 60 * 60,
    retry: false,
  });
}

export function useInsights(period: string = "week") {
  return useQuery({
    queryKey: aiKeys.insights(period),
    queryFn: () => api.get<InsightsOut>(`/ai/insights?period=${period}`),
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}

export function useMuscleHints() {
  return useQuery({
    queryKey: aiKeys.muscleHints,
    queryFn: () => api.get<MuscleHintOut>("/ai/muscle-hints"),
    staleTime: 1000 * 60 * 30,
    retry: false,
  });
}
