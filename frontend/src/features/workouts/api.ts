import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";

import type {
  CalendarOut,
  Exercise,
  ExerciseMeta,
  ExerciseRecordSummary,
  MuscleBalanceItem,
  MuscleGroupBalance,
  PaginatedWorkouts,
  PersonalRecord,
  VolumePoint,
  WorkoutCreate,
  WorkoutOut,
} from "./types";

const keys = {
  exercises: (category?: string, search?: string) =>
    ["exercises", category ?? "all", search ?? ""] as const,
  meta: ["exercise-meta"] as const,
  workouts: (skip: number, limit: number, from_date?: string, to_date?: string) =>
    ["workouts", skip, limit, from_date, to_date] as const,
  workout: (id: number) => ["workout", id] as const,
  calendar: (year: number, month: number) => ["calendar", year, month] as const,
  balance: ["muscle-balance"] as const,
  balanceCategories: ["muscle-balance-categories"] as const,
  records: ["records"] as const,
  recordsSummary: (exerciseIds?: number[]) => ["records-summary", exerciseIds] as const,
  recordsHistory: (exerciseKey: string) => ["records-history", exerciseKey] as const,
  volume: (period: string) => ["volume", period] as const,
};

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export function useExerciseMeta() {
  return useQuery({
    queryKey: keys.meta,
    queryFn: () => api.get<ExerciseMeta>("/exercises/meta"),
    staleTime: Infinity,
  });
}

export function useExercises(category?: string, search?: string) {
  return useQuery({
    queryKey: keys.exercises(category, search),
    queryFn: () => api.get<Exercise[]>(`/exercises${qs({ category, search })}`),
    staleTime: 300000,
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      category: string;
      muscle_groups: string[];
      equipment_type?: string;
      default_bodyweight_percent?: number | null;
    }) => api.post<Exercise>("/exercises", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

function invalidateWorkoutData(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["workouts"] });
  qc.invalidateQueries({ queryKey: ["calendar"] });
}

export function useWorkouts(skip: number = 0, limit: number = 10, from_date?: string, to_date?: string) {
  return useQuery({
    queryKey: keys.workouts(skip, limit, from_date, to_date),
    queryFn: () => api.get<PaginatedWorkouts>(`/workouts${qs({ skip, limit, from_date, to_date })}`),
    staleTime: 30000,
  });
}

export function useWorkout(id: number | null) {
  return useQuery({
    queryKey: keys.workout(id ?? 0),
    queryFn: () => api.get<WorkoutOut>(`/workouts/${id}`),
    enabled: id !== null,
  });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: WorkoutCreate) => api.post<WorkoutOut>("/workouts", body),
    onSuccess: () => invalidateWorkoutData(qc),
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del<void>(`/workouts/${id}`),
    onSuccess: () => invalidateWorkoutData(qc),
  });
}

export function useUpdateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: WorkoutCreate }) => 
      api.put<WorkoutOut>(`/workouts/${id}`, body),
    onSuccess: () => invalidateWorkoutData(qc),
  });
}

export function useCalendar(year: number, month: number) {
  return useQuery({
    queryKey: keys.calendar(year, month),
    queryFn: () => api.get<CalendarOut>(`/workouts/calendar?year=${year}&month=${month}`),
    staleTime: 60000,
  });
}

export function useMuscleBalance() {
  return useQuery({
    queryKey: keys.balance,
    queryFn: () => api.get<MuscleBalanceItem[]>("/workouts/muscle-balance"),
    staleTime: 120000,
  });
}

export function useMuscleBalanceCategories() {
  return useQuery({
    queryKey: keys.balanceCategories,
    queryFn: () => api.get<MuscleGroupBalance[]>("/workouts/muscle-balance/categories"),
    staleTime: Infinity,
  });
}

export function useRecords() {
  return useQuery({
    queryKey: keys.records,
    queryFn: () => api.get<PersonalRecord[]>("/workouts/records"),
    staleTime: 60000,
  });
}

export function useRecordsSummary(exerciseIds?: number[]) {
  return useQuery({
    queryKey: keys.recordsSummary(exerciseIds),
    queryFn: () => {
      const params = exerciseIds ? { exercise_ids: exerciseIds.join(",") } : undefined;
      return api.get<PersonalRecordSummary[]>("/workouts/records/summary", params);
    },
    staleTime: 60000,
  });
}

export function usePrHistory(exerciseKey: string) {
  return useQuery({
    queryKey: keys.recordsHistory(exerciseKey),
    queryFn: () => api.get<PersonalRecordHistory[]>(`/workouts/records/${exerciseKey}/history`),
    enabled: !!exerciseKey,
    staleTime: 120000,
  });
}

export function useVolume(period: string) {
  return useQuery({
    queryKey: keys.volume(period),
    queryFn: () => api.get<VolumePoint[]>(`/workouts/progress/volume?period=${period}`),
    staleTime: 60000,
  });
}
