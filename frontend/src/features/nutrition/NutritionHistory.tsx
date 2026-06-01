import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Card } from "@/components/ui/card";

import { useNutritionLogs } from "./api";
import { MealCard } from "./MealCard";
import type { NutritionLog, Totals } from "./types";

function sumTotals(logs: NutritionLog[]): Totals {
  return logs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.totals.calories,
      protein: acc.protein + l.totals.protein,
      fat: acc.fat + l.totals.fat,
      carbs: acc.carbs + l.totals.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

export function NutritionHistory() {
  const { data: logs, isLoading } = useNutritionLogs();
  const [open, setOpen] = useState<string | null>(null);

  const byDay = new Map<string, NutritionLog[]>();
  for (const log of logs ?? []) {
    const arr = byDay.get(log.date) ?? [];
    arr.push(log);
    byDay.set(log.date, arr);
  }
  const days = [...byDay.entries()];

  if (isLoading) return <p className="text-sm text-muted">Загрузка…</p>;
  if (days.length === 0)
    return <p className="text-sm text-muted">История пуста. Сохранённые приёмы появятся здесь.</p>;

  return (
    <div className="space-y-2">
      {days.map(([date, dayLogs]) => {
        const totals = sumTotals(dayLogs);
        const isOpen = open === date;
        return (
          <div key={date}>
            <button onClick={() => setOpen(isOpen ? null : date)} className="w-full text-left">
              <Card className="flex items-center gap-3 hover:border-zinc-600">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">{formatDate(date)}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {Math.round(totals.calories)} ккал · Б{Math.round(totals.protein)} Ж
                    {Math.round(totals.fat)} У{Math.round(totals.carbs)}
                  </p>
                </div>
                <span className="text-xs text-muted">{dayLogs.length} приём.</span>
              </Card>
            </button>
            {isOpen && (
              <div className="mt-2 space-y-2 pl-4">
                {dayLogs.map((log) => (
                  <MealCard key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
