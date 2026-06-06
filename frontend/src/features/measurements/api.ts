import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import type { BodyMeasurement, MeasurementIn } from "./types";

export const measurementKeys = {
  all: ["measurements"] as const,
  bodyAssessment: ["body-assessment"] as const,
};

export function useMeasurements() {
  return useQuery({
    queryKey: measurementKeys.all,
    queryFn: () => api.get<BodyMeasurement[]>("/measurements?limit=90"),
  });
}

export function useCreateMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: MeasurementIn) => api.post<BodyMeasurement>("/measurements", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: measurementKeys.all });
    },
  });
}

export function useUpdateMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<MeasurementIn> }) =>
      api.put<BodyMeasurement>(`/measurements/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: measurementKeys.all });
    },
  });
}

export function useDeleteMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/measurements/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: measurementKeys.all });
    },
  });
}

interface BodyAssessmentOut {
  assessment: string;
  ai_powered: boolean;
}

export function useBodyAssessment() {
  return useQuery({
    queryKey: measurementKeys.bodyAssessment,
    queryFn: () => api.get<BodyAssessmentOut>("/ai/body-assessment"),
    staleTime: 1000 * 60 * 60,
    retry: false,
  });
}
