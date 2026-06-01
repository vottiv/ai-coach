import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import type { BodyMeasurement, MeasurementIn } from "./types";

export const measurementKeys = {
  all: ["measurements"] as const,
};

export function useMeasurements() {
  return useQuery({
    queryKey: measurementKeys.all,
    queryFn: () => api.get<BodyMeasurement[]>("/measurements?limit=30"),
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
