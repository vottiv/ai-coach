import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { MealForm } from "@/features/nutrition/MealForm";
import { NutritionHistory } from "@/features/nutrition/NutritionHistory";
import { NutritionToday } from "@/features/nutrition/NutritionToday";
import { cn } from "@/lib/utils";

type Tab = "new" | "today" | "history";

const TABS: { key: Tab; label: string }[] = [
  { key: "new", label: "Новый приём" },
  { key: "today", label: "Дневник" },
  { key: "history", label: "История" },
];

export function Nutrition() {
  const [tab, setTab] = useState<Tab>("today");

  return (
    <div>
      <PageHeader title="Питание" subtitle="БЖУ, калории и дневная сводка" />

      <div className="mb-5 flex gap-1 rounded-2xl border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-xl py-2 text-sm font-medium transition-colors",
              tab === t.key ? "bg-nutrition text-white" : "text-muted hover:text-zinc-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "new" && <MealForm onSaved={() => setTab("today")} />}
      {tab === "today" && <NutritionToday />}
      {tab === "history" && <NutritionHistory />}
    </div>
  );
}
