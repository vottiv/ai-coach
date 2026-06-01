import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import type { SubjectiveIn, SubjectiveLog, TodayOut } from "./types";

const keys = {
  today: (date: string) => ["subjective-today", date] as const,
  range: (from: string, to: string) => ["subjective-range", from, to] as const,
};

export function useToday(date: string) {
  return useQuery({
    queryKey: keys.today(date),
    queryFn: () => api.get<TodayOut>(`/subjective/today?target_date=${date}`),
  });
}

export function useSubjectiveRange(from: string, to: string) {
  return useQuery({
    queryKey: keys.range(from, to),
    queryFn: () => api.get<SubjectiveLog[]>(`/subjective?from_date=${from}&to_date=${to}`),
  });
}

export function useSaveSubjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SubjectiveIn) => api.post<SubjectiveLog>("/subjective", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjective-today"] });
      qc.invalidateQueries({ queryKey: ["subjective-range"] });
    },
  });
}
