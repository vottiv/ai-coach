import { Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useDeleteWorkout, useWorkout, useWorkouts } from "./api";
import { Calendar } from "./Calendar";
import { FEELINGS, WORKOUT_TYPE_LABEL } from "./types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function WorkoutHistory() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  const { data: workouts, isLoading } = useWorkouts();
  const filtered = selectedDay
    ? workouts?.filter((w) => w.date === selectedDay)
    : workouts;

  return (
    <div className="space-y-4">
      <Calendar
        year={year}
        month={month}
        selected={selectedDay}
        onChangeMonth={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
        onSelectDay={setSelectedDay}
      />

      {selectedDay && (
        <button onClick={() => setSelectedDay(null)} className="text-xs text-workouts">
          Показать все тренировки
        </button>
      )}

      {isLoading && <p className="text-sm text-muted">Загрузка…</p>}
      {!isLoading && (filtered?.length ?? 0) === 0 && (
        <p className="text-sm text-muted">
          {selectedDay ? "В этот день тренировок нет." : "Пока нет сохранённых тренировок."}
        </p>
      )}

      <div className="space-y-2">
        {filtered?.map((w) => (
          <button key={w.id} onClick={() => setOpenId(w.id)} className="w-full text-left">
            <Card className="flex items-center gap-3 hover:border-zinc-600">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {WORKOUT_TYPE_LABEL[w.type]} · {formatDate(w.date)}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {w.exercise_count} упр. · {Math.round(w.tonnage).toLocaleString("ru-RU")} кг
                </p>
              </div>
              {w.feeling && <span className="text-xl">{FEELINGS[w.feeling - 1]}</span>}
            </Card>
          </button>
        ))}
      </div>

      {openId !== null && <WorkoutDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function WorkoutDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: workout, isLoading } = useWorkout(id);
  const del = useDeleteWorkout();
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    await del.mutateAsync(id);
    onClose();
  };

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
              <Card key={ex.id} className="space-y-2">
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
              <Card>
                <p className="text-xs text-muted">Заметки</p>
                <p className="mt-1 text-sm">{workout.notes}</p>
              </Card>
            )}

            {confirm ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-red-500 text-red-400"
                  onClick={handleDelete}
                  disabled={del.isPending}
                >
                  Подтвердить удаление
                </Button>
                <Button variant="ghost" onClick={() => setConfirm(false)}>
                  Отмена
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full text-red-400"
                onClick={() => setConfirm(true)}
              >
                <Trash2 className="h-4 w-4" /> Удалить тренировку
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
