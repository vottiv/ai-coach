import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";

const keys = {
  tracked: ["tracked-exercises"] as const,
};

export function useTrackedExercises() {
  return useQuery({
    queryKey: keys.tracked,
    queryFn: () => api.get<number[]>("/tracked-exercises"),
    staleTime: 60000,
  });
}

export function useAddTrackedExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: number) =>
      api.post<{ exercise_id: number }>("/tracked-exercises", { exercise_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tracked }),
  });
}

export function useRemoveTrackedExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: number) => api.del<void>(`/tracked-exercises/${exerciseId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tracked }),
  });
}