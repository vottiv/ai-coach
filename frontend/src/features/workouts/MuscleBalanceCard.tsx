import { Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useMuscleHints } from "@/features/ai/api";
import { cn } from "@/lib/utils";

import { useMuscleBalance } from "./api";

function barColor(pct: number): string {
  if (pct < 60) return "bg-red-500";
  if (pct > 130) return "bg-amber-500";
  return "bg-nutrition";
}

export function MuscleBalanceCard({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useMuscleBalance();
  const { data: hints } = useMuscleHints();

  const items = (data ?? [])
    .slice()
    .sort((a, b) => a.percentage - b.percentage);
  const shown = compact ? items.slice(0, 5) : items;
  const hasNeglected = items.some((i) => i.percentage < 60 && i.recommended_sets > 0);

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Баланс мышц</h2>
          <span className="text-xs text-muted">за 7 дней</span>
        </div>

        {isLoading && <p className="text-sm text-muted">Загрузка…</p>}
        {!isLoading && items.every((i) => i.weekly_sets === 0) && (
          <p className="text-sm text-muted">
            Нет нагрузки за неделю. Добавьте тренировку, чтобы увидеть баланс.
          </p>
        )}

        <div className="space-y-2">
          {shown.map((i) => (
            <div key={i.muscle_group}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{i.muscle_group}</span>
                <span className="text-muted">
                  {i.weekly_sets}/{i.recommended_sets}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
                <div
                  className={cn("h-full rounded-full", barColor(i.percentage))}
                  style={{ width: `${Math.min(i.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {hasNeglected && hints && hints.hints.length > 0 && (
        <Card className="space-y-3 border-workouts/20 bg-workouts/5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-workouts" />
            <h3 className="text-sm font-medium">AI-подсказки по балансу</h3>
            {hints.ai_powered && (
              <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-muted">AI</span>
            )}
          </div>
          <div className="space-y-2">
            {hints.hints.map((h, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-surface p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-workouts">{h.muscle_group}</span>
                  <span className="text-[10px] text-muted">{h.sets}×{h.reps}</span>
                </div>
                <p className="mt-0.5 text-sm font-medium">{h.exercise}</p>
                {h.reason && <p className="mt-0.5 text-xs text-muted">{h.reason}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
