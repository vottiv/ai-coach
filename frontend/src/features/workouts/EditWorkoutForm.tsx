import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useUpdateWorkout, useWorkout } from "./api";
import { ExercisePicker } from "./ExercisePicker";
import {
  FEELINGS,
  WORKOUT_TYPES,
  type Exercise,
  type WorkoutExerciseIn,
  type WorkoutType,
} from "./types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EditWorkoutFormProps {
  id: number;
  onClose: () => void;
}

export function EditWorkoutForm({ id, onClose }: EditWorkoutFormProps) {
  const { data: workout, isLoading } = useWorkout(id);
  const [date, setDate] = useState("");
  const [type, setType] = useState<WorkoutType>("strength");
  const [feeling, setFeeling] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<WorkoutExerciseIn[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { mutateAsync: update, isPending } = useUpdateWorkout();

  useEffect(() => {
    if (workout) {
      setDate(workout.date);
      setType(workout.type);
      setFeeling(workout.feeling);
      setNotes(workout.notes ?? "");
      setExercises(
        workout.exercises.map((ex) => ({
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercise_name,
          sets: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
        }))
      );
    }
  }, [workout]);

  const addExercise = (ex: Exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        exercise_id: ex.id,
        exercise_name: ex.name,
        sets: [{ weight: 0, reps: 0 }],
      },
    ]);
    setPickerOpen(false);
  };

  const updateSet = (ei: number, si: number, field: "weight" | "reps", value: number) =>
    setExercises((prev) =>
      prev.map((e, i) =>
        i !== ei
          ? e
          : { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, [field]: value } : s)) },
      ),
    );

  const addSet = (ei: number) =>
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== ei) return e;
        const last = e.sets[e.sets.length - 1];
        return { ...e, sets: [...e.sets, last ? { ...last } : { weight: 0, reps: 0 }] };
      }),
    );

  const removeSet = (ei: number, si: number) =>
    setExercises((prev) =>
      prev.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.filter((_, j) => j !== si) })),
    );

  const removeExercise = (ei: number) =>
    setExercises((prev) => prev.filter((_, i) => i !== ei));

  const save = async () => {
    await update({ id, body: { date, type, feeling, notes: notes.trim() || null, exercises } });
    onClose();
  };

  if (isLoading) return <p className="text-sm text-muted">Загрузка…</p>;

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Дата</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker()}
            className="h-11 w-full rounded-2xl border border-border bg-bg px-4 text-sm outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Тип тренировки</label>
          <div className="flex flex-wrap gap-2">
            {WORKOUT_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs",
                  type === t.key
                    ? "border-workouts bg-workouts/10 text-workouts"
                    : "border-border text-muted",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {exercises.map((ex, ei) => (
        <Card key={ei} className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">{ex.exercise_name}</p>
            <button onClick={() => removeExercise(ei)} className="text-muted hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 text-xs text-muted">
              <span className="w-6">#</span>
              <span>Вес, кг</span>
              <span>Повторы</span>
              <span />
            </div>
            {ex.sets.map((s, si) => (
              <div key={si} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
                <span className="w-6 text-sm text-muted">{si + 1}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={s.weight || ""}
                  onChange={(e) => updateSet(ei, si, "weight", Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-zinc-500"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={s.reps || ""}
                  onChange={(e) => updateSet(ei, si, "reps", Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-zinc-500"
                />
                <button
                  onClick={() => removeSet(ei, si)}
                  className="p-1 text-muted hover:text-red-400"
                  disabled={ex.sets.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="md" className="w-full" onClick={() => addSet(ei)}>
            <Plus className="h-4 w-4" /> Подход
          </Button>
        </Card>
      ))}

      <Button variant="outline" className="w-full" onClick={() => setPickerOpen(true)}>
        <Plus className="h-4 w-4" /> Добавить упражнение
      </Button>

      <Card className="space-y-4">
        <div>
          <label className="mb-2 block text-xs text-muted">Самочувствие</label>
          <div className="flex gap-2">
            {FEELINGS.map((number, i) => (
              <button
                key={i}
                onClick={() => setFeeling(feeling === i + 1 ? null : i + 1)}
                className={cn(
                  "flex h-11 flex-1 items-center justify-center rounded-2xl border text-xl font-medium",
                  feeling === i + 1 ? "border-workouts bg-workouts/10" : "border-border",
                )}
              >
                {number}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Заметки</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Как прошла тренировка"
            className="w-full rounded-2xl border border-border bg-bg p-3 text-sm outline-none focus:border-zinc-500"
          />
        </div>
      </Card>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          size="lg"
          onClick={save}
          disabled={exercises.length === 0 || isPending}
        >
          {isPending ? "Сохранение…" : "Сохранить"}
        </Button>
        <Button variant="outline" size="lg" onClick={onClose}>
          Отмена
        </Button>
      </div>

      {pickerOpen && (
        <ExercisePicker onSelect={addExercise} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}