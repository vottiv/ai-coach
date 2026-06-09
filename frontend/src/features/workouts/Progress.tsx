import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { X, Dumbbell, Plus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InsightsList } from "@/features/ai/InsightsList";
import { cn } from "@/lib/utils";

import { useRecordsSummary, useVolume } from "./api";
import { MuscleBalanceCard } from "./MuscleBalanceCard";
import { ExercisePicker } from "./ExercisePicker";
import { useTrackedExercises, useAddTrackedExercise, useRemoveTrackedExercise } from "./trackedExercisesApi";
import { PersonalRecordCard } from "./PersonalRecordCard";
import { PersonalRecordHistoryDialog } from "./PersonalRecordHistoryDialog";

const PERIODS = [
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "3months", label: "3 месяца" },
  { key: "year", label: "Год" },
];

type Tab = "volume" | "records" | "muscles" | "insights";

const TABS: { key: Tab; label: string }[] = [
  { key: "volume", label: "Объём" },
  { key: "records", label: "Рекорды" },
  { key: "muscles", label: "Мышцы" },
  { key: "insights", label: "Инсайты" },
];

function shortLabel(label: string): string {
  if (/^\d{4}-\d{2}$/.test(label)) {
    const [, m] = label.split("-");
    return ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"][
      Number(m) - 1
    ];
  }
  const d = new Date(label);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function Progress() {
  const [period, setPeriod] = useState("month");
  const [tab, setTab] = useState<Tab>("volume");
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [historyExercise, setHistoryExercise] = useState<{ id: number; name: string } | null>(null);

  const { data: volume } = useVolume(period);
  const { data: trackedExercises = [] } = useTrackedExercises();
  const { data: recordsSummary } = useRecordsSummary(trackedExercises);
  const addTracked = useAddTrackedExercise();
  const removeTracked = useRemoveTrackedExercise();

  const trackedRecords = useMemo(() => {
    if (!recordsSummary || trackedExercises.length === 0) return [];
    return trackedExercises
      .map((exerciseId) => recordsSummary.find((r) => r.exercise_id === exerciseId))
      .filter((r): r is Exclude<typeof r, undefined> => r !== undefined);
  }, [trackedExercises, recordsSummary]);

  const handleAddExercise = async (exercise: { id: number; name: string }) => {
    if (trackedExercises.includes(exercise.id)) {
      setShowExercisePicker(false);
      return;
    }
    await addTracked.mutateAsync(exercise.id);
    setShowExercisePicker(false);
  };

  const handleRemoveExercise = async (exerciseId: number) => {
    await removeTracked.mutateAsync(exerciseId);
  };

  const handleShowHistory = (exerciseId: number, exerciseName: string) => {
    setHistoryExercise({ id: exerciseId, name: exerciseName });
  };

  const chartData = (volume ?? []).map((p) => ({ ...p, name: shortLabel(p.label) }));

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? t.key === "insights"
                  ? "bg-feelings text-white"
                  : "bg-workouts text-white"
                : "text-muted hover:text-zinc-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "volume" && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Объём (тоннаж)</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  period === p.key
                    ? "border-workouts bg-workouts/10 text-workouts"
                    : "border-border text-muted",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted">Нет данных за период.</p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F97316" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="#3f3f46" />
                  <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="#3f3f46" width={48} />
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#a1a1aa" }}
                    formatter={(v: number) => [`${Math.round(v).toLocaleString("ru-RU")} кг`, "Объём"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#F97316"
                    strokeWidth={2}
                    fill="url(#vol)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {tab === "muscles" && <MuscleBalanceCard />}

      {tab === "records" && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Рекорды</h2>
            <Button
              variant="outline"
              onClick={() => setShowExercisePicker(true)}
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              Добавить
            </Button>
          </div>

          {trackedExercises.length === 0 && trackedRecords.length === 0 && (
            <div className="py-8 text-center">
              <Dumbbell className="mx-auto h-10 w-10 text-muted mb-3" />
              <p className="text-sm text-muted">Добавьте упражнения для отслеживания рекордов</p>
            </div>
          )}

          <div className="space-y-2">
            {trackedRecords.map((record) => (
              <PersonalRecordCard
                key={record.exercise_id ?? record.exercise_name}
                record={record}
                onRemove={() => handleRemoveExercise(record.exercise_id!)}
                onClick={() => handleShowHistory(record.exercise_id!, record.exercise_name)}
              />
            ))}
          </div>

          {showExercisePicker && (
            <ExercisePicker onSelect={handleAddExercise} onClose={() => setShowExercisePicker(false)} />
          )}
        </Card>
      )}

      {historyExercise && (
        <PersonalRecordHistoryDialog
          exerciseId={historyExercise.id}
          exerciseName={historyExercise.name}
          open={historyExercise !== null}
          onClose={() => setHistoryExercise(null)}
        />
      )}

      {tab === "insights" && <InsightsList />}
    </div>
  );
}