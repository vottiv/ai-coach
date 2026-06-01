import { useState } from "react";
import { BrainCircuit, CheckCircle2, Info, TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useInsights } from "./api";
import type { InsightCategory, InsightSeverity } from "./types";

const CATEGORY_STYLE: Record<InsightCategory, { dot: string; label: string }> = {
  workouts: { dot: "bg-workouts", label: "Тренировки" },
  nutrition: { dot: "bg-nutrition", label: "Питание" },
  feelings: { dot: "bg-feelings", label: "Ощущения" },
  health: { dot: "bg-health", label: "Анализы" },
  general: { dot: "bg-zinc-400", label: "Общее" },
};

const SEVERITY_STYLE: Record<InsightSeverity, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: "text-blue-400" },
  warning: { icon: TriangleAlert, color: "text-amber-400" },
  success: { icon: CheckCircle2, color: "text-nutrition" },
};

const PERIODS = [
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "3months", label: "3 мес." },
];

export function InsightsList() {
  const [period, setPeriod] = useState("week");
  const { data, isLoading } = useInsights(period);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Инсайты</h2>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                period === p.key
                  ? "border-feelings bg-feelings/10 text-feelings"
                  : "border-border text-muted",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-surface" />
          ))}
        </div>
      )}

      {!isLoading && (!data || data.insights.length === 0) && (
        <EmptyState
          icon={BrainCircuit}
          title="Пока недостаточно данных"
          description="Добавляйте тренировки, питание и самочувствие — и система начнёт находить закономерности."
          accent="text-feelings"
        />
      )}

      {!isLoading && data && data.insights.length > 0 && (
        <div className="space-y-3">
          {data.ai_powered && (
            <p className="text-xs text-muted">
              Инсайты обогащены AI
            </p>
          )}
          {data.insights.map((insight, idx) => {
            const style = CATEGORY_STYLE[insight.category] ?? CATEGORY_STYLE.general;
            const sev = SEVERITY_STYLE[insight.severity] ?? SEVERITY_STYLE.info;
            const SevIcon = sev.icon;
            return (
              <Card key={idx} className="gap-3">
                <div className="flex items-start gap-3">
                  <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", style.dot)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-tight">{insight.title}</p>
                      <SevIcon className={cn("h-3.5 w-3.5 shrink-0", sev.color)} />
                      <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted">
                        {style.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{insight.body}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
