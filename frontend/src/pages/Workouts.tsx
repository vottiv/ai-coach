import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { NewWorkoutForm } from "@/features/workouts/NewWorkoutForm";
import { Progress } from "@/features/workouts/Progress";
import { WorkoutHistory } from "@/features/workouts/WorkoutHistory";
import { cn } from "@/lib/utils";

type Tab = "new" | "history" | "progress";

const TABS: { key: Tab; label: string }[] = [
  { key: "new", label: "Новая" },
  { key: "history", label: "История" },
  { key: "progress", label: "Прогресс" },
];

export function Workouts() {
  const [tab, setTab] = useState<Tab>("new");

  return (
    <div>
      <PageHeader title="Тренировки" subtitle="Создание, история и прогресс" />

      <div className="mb-5 flex gap-1 rounded-2xl border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-xl py-2 text-sm font-medium transition-colors",
              tab === t.key ? "bg-workouts text-white" : "text-muted hover:text-zinc-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "new" && <NewWorkoutForm onSaved={() => setTab("history")} />}
      {tab === "history" && <WorkoutHistory />}
      {tab === "progress" && <Progress />}
    </div>
  );
}
