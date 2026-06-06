import { Dumbbell, HeartPulse, Plus, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { InsightsList } from "@/features/ai/InsightsList";
import { RecommendationCard } from "@/features/ai/RecommendationCard";
import { FeelingsHintCard } from "@/features/feelings/FeelingsHintCard";
import { DailySummaryCard } from "@/features/nutrition/DailySummaryCard";
import { useWorkouts } from "@/features/workouts/api";
import { MuscleBalanceCard } from "@/features/workouts/MuscleBalanceCard";
import { WORKOUT_TYPE_LABEL } from "@/features/workouts/types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

const QUICK = [
  { to: "/workouts", label: "Начать тренировку", icon: Dumbbell, accent: "text-workouts", module: "workouts" },
  { to: "/nutrition", label: "Добавить питание", icon: Utensils, accent: "text-nutrition", module: "nutrition" },
  { to: "/feelings", label: "Внести настрой", icon: HeartPulse, accent: "text-feelings", module: "feelings" },
];

export function Home() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const enabled = user?.enabled_modules ?? [];
  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const quick = QUICK.filter((q) => enabled.length === 0 || enabled.includes(q.module));
  const workoutsEnabled = enabled.length === 0 || enabled.includes("workouts");
  const nutritionEnabled = enabled.length === 0 || enabled.includes("nutrition");
  const feelingsEnabled = enabled.length === 0 || enabled.includes("feelings");

  const { data: workoutsData } = useWorkouts();
  const lastWorkout = workoutsData?.items?.[0];

  return (
    <div className="space-y-5">
      <PageHeader title={`Привет, ${user?.name ?? ""}`} subtitle={today} />

      {/* ТЗ п. 6.1 — AI-рекомендация дня (этап 5) */}
      <RecommendationCard />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {quick.map(({ to, label, icon: Icon, accent }) => (
          <button key={to} onClick={() => navigate(to)} className="text-left">
            <Card className="flex items-center gap-3 transition-colors hover:border-zinc-600">
              <span className={cn("rounded-2xl bg-bg p-2.5", accent)}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex-1 text-sm font-medium">{label}</span>
              <Plus className="h-4 w-4 text-muted" />
            </Card>
          </button>
        ))}
      </div>

      {workoutsEnabled && lastWorkout && (
        <button onClick={() => navigate("/workouts")} className="block w-full text-left">
          <Card className="flex items-center gap-3 hover:border-zinc-600">
            <span className="rounded-2xl bg-bg p-2.5 text-workouts">
              <Dumbbell className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">Последняя тренировка</p>
              <p className="mt-0.5 text-xs text-muted">
                {WORKOUT_TYPE_LABEL[lastWorkout.type]} ·{" "}
                {new Date(lastWorkout.date).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                })}{" "}
                · {Math.round(lastWorkout.tonnage).toLocaleString("ru-RU")} кг
              </p>
            </div>
          </Card>
        </button>
      )}

      {feelingsEnabled && <FeelingsHintCard />}

      {nutritionEnabled && <DailySummaryCard />}

      {workoutsEnabled && <MuscleBalanceCard compact />}

      {/* ТЗ п. 6.3 — вкладка «Инсайты» (этап 5): кросс-модульные закономерности */}
      <InsightsList />
    </div>
  );
}
