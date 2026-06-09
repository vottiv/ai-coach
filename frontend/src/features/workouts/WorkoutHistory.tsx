import { ChevronLeft, ChevronRight, Edit, Trash2, X } from "lucide-react";
import { useState, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
 
 import { Button } from "@/components/ui/button";
 import { Card } from "@/components/ui/card";
 import { IntensityBadge } from "@/components/IntensityBadge";
 
 import { useDeleteWorkout, useWorkout, useWorkouts } from "./api";
 import { Calendar } from "./Calendar";
 import { FEELINGS, WORKOUT_TYPE_LABEL } from "./types";

const MUSCLE_GROUPS: Record<string, string> = {
  "Грудь": "Грудь",
  "Плечи передние": "Плечи",
  "Плечи средние": "Плечи", 
  "Плечи задние": "Плечи",
  "Трицепс": "Руки",
  "Широчайшие": "Спина",
  "Бицепс": "Руки",
  "Предплечья": "Руки",
  "Трапеции": "Спина",
  "Поясница": "Спина",
  "Ягодицы": "Ноги",
  "Бицепс бедра": "Ноги",
  "Квадрицепсы": "Ноги",
  "Икры": "Ноги",
  "Пресс": "Кор",
  "Косые": "Кор",
  "Кардио": "Кардио",
};

function groupMuscleGroups(muscleGroups: string[]): string {
  const grouped: Record<string, number> = {};
  
  for (const group of muscleGroups) {
    const category = MUSCLE_GROUPS[group] || group;
    grouped[category] = (grouped[category] || 0) + 1;
  }
  
  return Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat)
    .slice(0, 3)
    .join(", ");
}

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getMonthRange(year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from_date: `${year}-${pad(month)}-01`,
    to_date: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
}

export function WorkoutHistory() {
  const now = new Date();
  const navigate = useNavigate();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  const dateRange = useMemo(() => {
    if (selectedDay) {
      return { from_date: selectedDay, to_date: selectedDay };
    }
    return getMonthRange(year, month);
  }, [selectedDay, year, month]);

  const { data: paginatedData, isLoading } = useWorkouts(page * 10, 10, dateRange.from_date, dateRange.to_date);
  const workouts = paginatedData?.items ?? [];
  const total = paginatedData?.total ?? 0;
  const totalPages = Math.ceil(total / 10);

  const handleMonthChange = useCallback((y: number, m: number) => {
    setYear(y);
    setMonth(m);
    setSelectedDay(null);
    setPage(0);
  }, []);

  const handleDaySelect = useCallback((date: string | null) => {
    setSelectedDay(date);
    setPage(0);
  }, []);

  const del = useDeleteWorkout();
  const handleDelete = async (id: number) => {
    await del.mutateAsync(id);
    setDeleteId(null);
    setOpenId(null);
    if (workouts.length === 1 && page > 0) {
      setPage(page - 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        {selectedDay && (
          <button
            onClick={() => navigate(`/workouts?tab=new&date=${selectedDay}`)}
            className="rounded-xl border border-workouts px-3 py-1.5 text-sm text-workouts hover:bg-workouts/10"
          >
            ➕ Добавить
          </button>
        )}
      </div>

      <Calendar
        year={year}
        month={month}
        selected={selectedDay}
        onChangeMonth={handleMonthChange}
        onSelectDay={handleDaySelect}
      />

      {isLoading && <p className="text-sm text-muted">Загрузка…</p>}
      {!isLoading && workouts.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted">
            {selectedDay ? "В этот день тренировок нет." : "В этом месяце тренировок нет."}
          </p>
        </Card>
      )}

       {workouts.length > 0 && (
         <Card className="overflow-hidden">
           <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr className="border-b border-border">
                  <th className="p-3 text-left">Дата</th>
                  <th className="p-3 text-left">Тип</th>
                  <th className="p-3 text-left">Группа</th>
                  <th className="p-3 text-left">Объем</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
             <tbody>
                {workouts.map((w) => (
                  <WorkoutRow
                    key={w.id}
                    workout={w}
                    onOpen={() => setOpenId(w.id)}
                    onEdit={() => navigate(`/workouts/${w.id}/edit`)}
                    onDelete={() => setDeleteId(w.id)}
                  />
                ))}
             </tbody>
           </table>
         </Card>
       )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="max-w-md p-6">
            <p className="text-sm font-medium mb-4">Удалить тренировку?</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-red-500 text-red-400"
                onClick={() => handleDelete(deleteId)}
                disabled={del.isPending}
              >
                Удалить
              </Button>
              <Button variant="ghost" onClick={() => setDeleteId(null)}>
                Отмена
              </Button>
            </div>
          </Card>
        </div>
      )}

      {openId !== null && <WorkoutDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

const WorkoutRow = memo(({ workout, onOpen, onEdit, onDelete }: { 
  workout: any; 
  onOpen: () => void; 
  onEdit: () => void; 
  onDelete: () => void;
}) => (
  <tr className="border-b border-border/50 hover:bg-surface/50 transition-colors">
    <td className="p-3">
      <button
        onClick={onOpen}
        className="font-medium hover:text-workouts transition-colors"
      >
        {formatDate(workout.date)}
      </button>
    </td>
    <td className="p-3">{WORKOUT_TYPE_LABEL[workout.type as keyof typeof WORKOUT_TYPE_LABEL] || workout.type}</td>
     <td className="p-3">{groupMuscleGroups(workout.muscle_groups || [])}</td>
     <td className="p-3">
       <IntensityBadge intensity={workout.intensity || "very_light"} />
     </td>
     <td className="p-3">
       <div className="flex items-center justify-end gap-1">
         {workout.feeling && <span className="text-lg">{FEELINGS[workout.feeling - 1]}</span>}
         <Button
           variant="ghost"
           size="icon"
           className="h-7 w-7"
           onClick={(e) => {
             e.stopPropagation();
             onEdit();
           }}
         >
           <Edit className="h-3 w-3" />
         </Button>
         <Button
           variant="ghost"
           size="icon"
           className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
           onClick={(e) => {
             e.stopPropagation();
             onDelete();
           }}
         >
           <Trash2 className="h-3 w-3" />
         </Button>
       </div>
     </td>
  </tr>
));

function WorkoutDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: workout, isLoading } = useWorkout(id);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-bg p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {workout ? WORKOUT_TYPE_LABEL[workout.type] : "Тренировка"}
          </h3>
          <button onClick={onClose} className="rounded-xl p-1.5 hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading && <p className="text-sm text-muted">Загрузка…</p>}

        {workout && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>{formatDate(workout.date)}</span>
              <span>{Math.round(workout.tonnage).toLocaleString("ru-RU")} кг</span>
              {workout.feeling && <span className="text-xl">{FEELINGS[workout.feeling - 1]}</span>}
            </div>

            {workout.exercises.map((ex) => (
              <Card key={ex.id} className="space-y-2 p-4">
                <p className="text-sm font-medium">{ex.exercise_name}</p>
                <div className="space-y-1">
                  {ex.sets.map((s, i) => (
                    <div key={s.id} className="flex justify-between text-xs text-muted">
                      <span>Подход {i + 1}</span>
                      <span>
                        {s.weight} кг × {s.reps}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {workout.notes && (
              <Card className="p-4">
                <p className="text-xs text-muted">Заметки</p>
                <p className="mt-1 text-sm">{workout.notes}</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}