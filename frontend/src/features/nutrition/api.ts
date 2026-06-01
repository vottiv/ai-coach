import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

import type {
  DailySummary,
  NutritionCreate,
  NutritionLog,
  RecognizeResult,
} from "./types";

const keys = {
  logs: ["nutrition"] as const,
  summary: (date: string) => ["nutrition-summary", date] as const,
};

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: keys.logs });
  qc.invalidateQueries({ queryKey: ["nutrition-summary"] });
}

export function useNutritionLogs() {
  return useQuery({
    queryKey: keys.logs,
    queryFn: () => api.get<NutritionLog[]>("/nutrition"),
  });
}

export function useDailySummary(date: string) {
  return useQuery({
    queryKey: keys.summary(date),
    queryFn: () => api.get<DailySummary>(`/nutrition/daily-summary?target_date=${date}`),
  });
}

export function useCreateMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NutritionCreate) => api.post<NutritionLog>("/nutrition", body),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del<void>(`/nutrition/${id}`),
    onSuccess: () => invalidate(qc),
  });
}

export function useRecognizeFood() {
  return useMutation({
    mutationFn: async (file: File): Promise<RecognizeResult> => {
      const form = new FormData();
      form.append("photo", file);
      const token = useAuthStore.getState().access;
      const res = await fetch("/api/v1/nutrition/recognize", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      if (!res.ok) throw new Error("recognize failed");
      return res.json();
    },
  });
}
