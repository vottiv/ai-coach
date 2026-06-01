import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useDailySummary } from "./api";

const todayIso = () => new Date().toISOString().slice(0, 10);

function Macro({ label, value, target, color }: { label: string; value: number; target?: number; color: string }) {
  const pct = target ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span>
          {Math.round(value)}
          {target ? ` / ${target}` : ""} г
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DailySummaryCard({ date = todayIso() }: { date?: string }) {
  const { data, isLoading } = useDailySummary(date);
  const totals = data?.totals;
  const targets = data?.targets;

  const calPct = targets?.calories ? Math.min((totals!.calories / targets.calories) * 100, 100) : 0;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Сегодня: питание</h2>
        <span className="text-xs text-muted">
          {targets ? "факт / цель" : "факт"}
        </span>
      </div>

      {isLoading && <p className="text-sm text-muted">Загрузка…</p>}

      {!isLoading && (
        <>
          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm text-muted">Калории</span>
              <span className="text-sm font-semibold">
                {Math.round(totals?.calories ?? 0)}
                {targets ? ` / ${targets.calories}` : ""} ккал
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg">
              <div
                className="h-full rounded-full bg-nutrition"
                style={{ width: `${calPct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Macro label="Белки" value={totals?.protein ?? 0} target={targets?.protein} color="bg-workouts" />
            <Macro label="Жиры" value={totals?.fat ?? 0} target={targets?.fat} color="bg-feelings" />
            <Macro label="Углеводы" value={totals?.carbs ?? 0} target={targets?.carbs} color="bg-health" />
          </div>

          {!targets && (
            <p className="text-xs text-muted">
              Укажите пол, вес, рост и возраст в профиле, чтобы увидеть целевые калории и БЖУ.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
