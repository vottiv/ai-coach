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
  MuscleBalanceItem,
  PersonalRecord,
  VolumePoint,
  WorkoutCreate,
  WorkoutListItem,
  WorkoutOut,
} from "./types";

const keys = {
  exercises: (category?: string, search?: string) =>
    ["exercises", category ?? "all", search ?? ""] as const,
  meta: ["exercise-meta"] as const,
  workouts: ["workouts"] as const,
  workout: (id: number) => ["workout", id] as const,
  calendar: (year: number, month: number) => ["calendar", year, month] as const,
  balance: ["muscle-balance"] as const,
  records: ["records"] as const,
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
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      category: string;
      muscle_groups: string[];
    }) => api.post<Exercise>("/exercises", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

function invalidateWorkoutData(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: keys.workouts });
  qc.invalidateQueries({ queryKey: ["calendar"] });
  qc.invalidateQueries({ queryKey: keys.balance });
  qc.invalidateQueries({ queryKey: keys.records });
  qc.invalidateQueries({ queryKey: ["volume"] });
}

export function useWorkouts() {
  return useQuery({
    queryKey: keys.workouts,
    queryFn: () => api.get<WorkoutListItem[]>("/workouts"),
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

export function useCalendar(year: number, month: number) {
  return useQuery({
    queryKey: keys.calendar(year, month),
    queryFn: () => api.get<CalendarOut>(`/workouts/calendar?year=${year}&month=${month}`),
  });
}

export function useMuscleBalance() {
  return useQuery({
    queryKey: keys.balance,
    queryFn: () => api.get<MuscleBalanceItem[]>("/workouts/muscle-balance"),
  });
}

export function useRecords() {
  return useQuery({
    queryKey: keys.records,
    queryFn: () => api.get<PersonalRecord[]>("/workouts/records"),
  });
}

export function useVolume(period: string) {
  return useQuery({
    queryKey: keys.volume(period),
    queryFn: () => api.get<VolumePoint[]>(`/workouts/progress/volume?period=${period}`),
  });
}
