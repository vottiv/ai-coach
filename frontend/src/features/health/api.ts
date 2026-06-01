import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

import type {
  HealthAnalysis,
  HealthCreate,
  HealthListItem,
  RecognizeResult,
} from "./types";

const keys = {
  list: ["health"] as const,
  item: (id: number) => ["health", id] as const,
};

export function useHealthList() {
  return useQuery({
    queryKey: keys.list,
    queryFn: () => api.get<HealthListItem[]>("/health"),
  });
}

export function useAnalysis(id: number | null) {
  return useQuery({
    queryKey: keys.item(id ?? 0),
    queryFn: () => api.get<HealthAnalysis>(`/health/${id}`),
    enabled: id !== null,
  });
}

export function useCreateHealth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: HealthCreate) => api.post<HealthAnalysis>("/health", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list }),
  });
}

export function useDeleteHealth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del<void>(`/health/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list }),
  });
}

export function useRecognizeHealth() {
  return useMutation({
    mutationFn: async (file: File): Promise<RecognizeResult> => {
      const form = new FormData();
      form.append("file", file);
      const token = useAuthStore.getState().access;
      const res = await fetch("/api/v1/health/recognize", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      if (!res.ok) throw new Error("recognize failed");
      return res.json();
    },
  });
}
