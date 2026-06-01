import { useNutritionLogs } from "./api";
import { DailySummaryCard } from "./DailySummaryCard";
import { MealCard } from "./MealCard";

const todayIso = () => new Date().toISOString().slice(0, 10);

export function NutritionToday() {
  const today = todayIso();
  const { data: logs, isLoading } = useNutritionLogs();
  const todayMeals = logs?.filter((l) => l.date === today) ?? [];

  return (
    <div className="space-y-4">
      <DailySummaryCard date={today} />

      <h2 className="px-1 text-sm font-medium text-muted">Приёмы за сегодня</h2>
      {isLoading && <p className="text-sm text-muted">Загрузка…</p>}
      {!isLoading && todayMeals.length === 0 && (
        <p className="text-sm text-muted">
          Пока нет записей. Добавьте приём пищи на вкладке «Новый приём».
        </p>
      )}
      <div className="space-y-2">
        {todayMeals.map((log) => (
          <MealCard key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
}
