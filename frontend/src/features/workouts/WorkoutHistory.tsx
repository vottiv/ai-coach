import { ChevronLeft, ChevronRight, Edit, Trash2, X } from "lucide-react";
import { useState, useMemo, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useDeleteWorkout, useWorkout, useWorkouts } from "./api";
import { Calendar } from "./Calendar";
import { EditWorkoutForm } from "./EditWorkoutForm";
import { FEELINGS, WORKOUT_TYPE_LABEL } from "./types";
import { cn } from "@/lib/utils";

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

const EXERCISE_MUSCLE_GROUPS: Record<string, string[]> = {
  "Жим штанги лёжа": ["Грудь", "Плечи", "Руки"],
  "Жим гантелей лёжа": ["Грудь", "Плечи", "Руки"],
  "Разводка гантелей": ["Грудь", "Плечи"],
  "Отжимания": ["Грудь", "Руки", "Плечи", "Кор"],
  "Кроссовер": ["Грудь"],
  "Подтягивания": ["Спина", "Руки"],
  "Тяга верхнего блока": ["Спина", "Руки"],
  "Тяга штанги в наклоне": ["Спина", "Руки"],
  "Тяга гантели в наклоне": ["Спина", "Руки"],
  "Гиперэкстензия": ["Спина", "Ноги"],
  "Жим гантелей сидя": ["Плечи", "Руки"],
  "Махи в стороны": ["Плечи"],
  "Махи в наклоне": ["Плечи"],
  "Жим Арнольда": ["Плечи", "Руки"],
  "Сгибание со штангой": ["Руки"],
  "Сгибание с гантелями": ["Руки"],
  "Молотки": ["Руки"],
  "Разгибание на блоке": ["Руки"],
  "Жим узким хватом": ["Руки", "Грудь"],
  "Французский жим": ["Руки"],
  "Приседания": ["Ноги", "Спина"],
  "Жим ногами": ["Ноги"],
  "Выпады": ["Ноги"],
  "Сгибание ног": ["Ноги"],
  "Румынская тяга": ["Ноги", "Спина"],
  "Подъём на носки": ["Ноги"],
  "Скручивания": ["Кор"],
  "Подъём ног в висе": ["Кор", "Руки"],
  "Планка": ["Кор", "Спина"],
  "Русские скручивания": ["Кор"],
  "Бег": ["Кардио"],
  "Велосипед": ["Кардио", "Ноги"],
  "Скакалка": ["Кардио", "Ноги"],
  "Берпи": ["Кардио", "Грудь", "Ноги", "Плечи", "Кор"],
};

function getDominantMuscleGroup(workout: any): string {
  if (!workout.exercises || workout.exercises.length === 0) return "—";
  
  const groupLoad: Record<string, number> = {};
  
  for (const exercise of workout.exercises) {
    const muscles = EXERCISE_MUSCLE_GROUPS[exercise.exercise_name] || [];
    const volume = exercise.sets.reduce((sum: number, set: any) => 
      sum + (set.weight * set.reps), 0);
    
    for (const muscle of muscles) {
      groupLoad[muscle] = (groupLoad[muscle] || 0) + volume;
    }
  }
  
  const sortedGroups = Object.entries(groupLoad)
    .sort((a, b) => b[1] - a[1]);
  
  return sortedGroups.length > 0 ? sortedGroups[0][0] : "—";
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
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

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

  const handleShowAllForMonth = () => {
    setSelectedDay(null);
    setPage(0);
  };

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
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (month === 1) {
              handleMonthChange(year - 1, 12);
            } else {
              handleMonthChange(year, month - 1);
            }
          }}
          className="rounded-xl p-1.5 hover:bg-surface"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          className="flex-1 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-surface text-center"
        >
          {selectedDay
            ? new Date(selectedDay).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
            : `${MONTH_NAMES[month - 1]} ${year}`}
        </button>
        <button
          onClick={() => {
            if (month === 12) {
              handleMonthChange(year + 1, 1);
            } else {
              handleMonthChange(year, month + 1);
            }
          }}
          className="rounded-xl p-1.5 hover:bg-surface"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {showMonthPicker && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setYear(year - 1); }}
              className="rounded-xl p-1.5 hover:bg-surface"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold">{year}</span>
            <button
              onClick={() => { setYear(year + 1); }}
              className="rounded-xl p-1.5 hover:bg-surface"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTH_NAMES.map((name, i) => {
              const m = i + 1;
              const isActive = m === month;
              return (
                <button
                  key={m}
                  onClick={() => {
                    handleMonthChange(year, m);
                    setShowMonthPicker(false);
                  }}
                  className={cn(
                    "rounded-xl py-2 text-xs font-medium transition-colors",
                    isActive ? "bg-workouts text-white" : "border border-border hover:bg-surface",
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => {
              handleMonthChange(now.getFullYear(), now.getMonth() + 1);
              setShowMonthPicker(false);
            }}
            className="w-full rounded-xl border border-border py-2 text-xs text-muted hover:bg-surface"
          >
            Текущий месяц
          </button>
        </Card>
      )}

      <Calendar
        year={year}
        month={month}
        selected={selectedDay}
        onChangeMonth={handleMonthChange}
        onSelectDay={handleDaySelect}
      />

      <div className="flex items-center justify-between">
        {selectedDay ? (
          <button onClick={handleShowAllForMonth} className="text-sm text-workouts hover:text-workouts/80">
            Показать все за месяц
          </button>
        ) : (
          <span className="text-sm text-muted">
            {MONTH_NAMES[month - 1]} {year}
          </span>
        )}
      </div>

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
                <th className="p-3 text-right">Тоннаж</th>
                <th className="p-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {workouts.map((w) => (
                <tr
                  key={w.id}
                  className="border-b border-border/50 hover:bg-surface/50 transition-colors"
                >
                  <td className="p-3">
                    <button
                      onClick={() => setOpenId(w.id)}
                      className="font-medium hover:text-workouts transition-colors"
                    >
                      {formatDate(w.date)}
                    </button>
                  </td>
                  <td className="p-3">{WORKOUT_TYPE_LABEL[w.type]}</td>
                  <td className="p-3">{getDominantMuscleGroup(w)}</td>
                  <td className="p-3 text-right">
                    {Math.round(w.tonnage).toLocaleString("ru-RU")} кг
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      {w.feeling && <span className="text-lg">{FEELINGS[w.feeling - 1]}</span>}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditId(w.id);
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
                          setDeleteId(w.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
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
      {editId !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-bg p-5 sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Редактирование тренировки</h3>
              <button onClick={() => setEditId(null)} className="rounded-xl p-1.5 hover:bg-surface">
                <X className="h-5 w-5" />
              </button>
            </div>
            <EditWorkoutForm id={editId} onClose={() => setEditId(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

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