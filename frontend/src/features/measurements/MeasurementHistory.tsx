import { TrendingUp } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";

import { useMeasurements } from "./api";

const LABELS: Record<string, string> = {
  weight: "Вес",
  bicep: "Бицепс",
  shoulders: "Плечи",
  chest: "Грудь",
  waist: "Талия",
  glutes: "Ягодицы",
  hips: "Бёдра",
  calves: "Икры",
};

export function MeasurementHistory() {
  const { data, isLoading } = useMeasurements();

  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-2xl border border-border bg-surface" />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Нет замеров"
        description="Добавьте первый замер, чтобы отслеживать изменения."
        accent="text-workouts"
      />
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-medium">История замеров</h2>
      {data.map((m) => {
        const fields = Object.entries(LABELS)
          .map(([key, label]) => {
            const val = m[key as keyof typeof m];
            return val != null ? `${label}: ${val}` : null;
          })
          .filter(Boolean);
        if (fields.length === 0) return null;
        return (
          <Card key={m.id} className="gap-2">
            <p className="text-xs text-muted">
              {new Date(m.measured_at).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {fields.map((f, i) => (
                <span key={i}>{f}</span>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
