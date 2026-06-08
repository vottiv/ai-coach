import { Plus, Trash2, GripVertical, X, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useCreateWorkout } from "./api";
import { ExercisePicker } from "./ExercisePicker";
import {
  EQUIPMENT_TYPES,
  FEELINGS,
  WORKOUT_TYPES,
  type Exercise,
  type WorkoutExerciseIn,
  type WorkoutType,
} from "./types";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const todayIso = () => new Date().toISOString().slice(0, 10);

type DraggableData = {
  type: "exercise" | "superset";
  index: number;
  exerciseIndex?: number;
};

function SortableExerciseCard({
  exercise,
  index,
  inSuperset,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onRemove,
  onToggleBodyweight,
  onSplitSuperset,
}: {
  exercise: WorkoutExerciseIn;
  index: number;
  inSuperset?: boolean;
  onUpdateSet: (ei: number, si: number, field: "weight" | "reps" | "uses_bodyweight" | "bodyweight_percent", value: number | boolean) => void;
  onAddSet: (ei: number) => void;
  onRemoveSet: (ei: number, si: number) => void;
  onRemove: (ei: number) => void;
  onToggleBodyweight: (ei: number, si: number) => void;
  onSplitSuperset?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `exercise-${exercise.superset_id || index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={cn("space-y-3", inSuperset && "border-workouts/50 bg-workouts/5")}>
        <div className="flex items-center gap-2">
          {!inSuperset && (
            <button {...listeners} className="cursor-grab text-muted hover:text-zinc-200">
              <GripVertical className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 flex items-center gap-2">
            {exercise.superset_id && (
              <span className="rounded-full bg-workouts px-2 py-0.5 text-xs text-white font-medium">
                #{exercise.superset_order || 1}
              </span>
            )}
            <p className="font-medium">{exercise.exercise_name}</p>
          </div>
          <div className="flex gap-1">
            {exercise.superset_id && onSplitSuperset && (
              <button
                onClick={onSplitSuperset}
                className="p-1.5 text-muted hover:text-workouts rounded-lg hover:bg-workouts/10"
                title="Разделить"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onRemove(index)}
              className="p-1.5 text-muted hover:text-red-400 rounded-lg hover:bg-red-400/10"
              title="Удалить"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-2 text-xs text-muted">
            <span className="w-6">#</span>
            <span>Вес, кг</span>
            <span>Повторы</span>
            <span>% веса</span>
            <span />
          </div>
          {exercise.sets.map((s, si) => (
            <div key={si} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-2">
              <span className="w-6 text-sm text-muted">{si + 1}</span>
              <input
                type="number"
                inputMode="decimal"
                value={s.weight || ""}
                onChange={(e) => onUpdateSet(index, si, "weight", Number(e.target.value))}
                disabled={s.uses_bodyweight}
                className={cn(
                  "h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-zinc-500",
                  s.uses_bodyweight && "opacity-50",
                )}
              />
              <input
                type="number"
                inputMode="numeric"
                value={s.reps || ""}
                onChange={(e) => onUpdateSet(index, si, "reps", Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-zinc-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.uses_bodyweight}
                  onChange={(e) => onToggleBodyweight(index, si)}
                  className="h-4 w-4 accent-workouts"
                />
                {s.uses_bodyweight && (
                  <input
                    type="number"
                    inputMode="decimal"
                    value={s.bodyweight_percent ?? 100}
                    onChange={(e) => onUpdateSet(index, si, "bodyweight_percent", Number(e.target.value))}
                    className="h-10 w-16 rounded-xl border border-border bg-bg px-2 text-sm outline-none focus:border-zinc-500"
                  />
                )}
              </div>
              <button
                onClick={() => onRemoveSet(index, si)}
                className="p-1 text-muted hover:text-red-400"
                disabled={exercise.sets.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="md" className="w-full" onClick={() => onAddSet(index)}>
          <Plus className="h-4 w-4 mr-2" /> Подход
        </Button>
      </Card>
    </div>
  );
}

export function NewWorkoutForm({ onSaved }: { onSaved: () => void }) {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const [date, setDate] = useState(dateParam || todayIso());
  const [type, setType] = useState<WorkoutType>("strength");
  const [feeling, setFeeling] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<WorkoutExerciseIn[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const create = useCreateWorkout();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const addExercise = (ex: Exercise) => {
    const equipment = EQUIPMENT_TYPES.find((e) => e.key === ex.equipment_type) || EQUIPMENT_TYPES[7];
    const usesBodyweight = equipment.key === "bodyweight";
    const bodyweightPercent = usesBodyweight ? (ex.default_bodyweight_percent ?? equipment.bodyweight_percent) : null;

    setExercises((prev) => [
      ...prev,
      {
        exercise_id: ex.id,
        exercise_name: ex.name,
        sets: [
          {
            weight: 0,
            reps: 0,
            uses_bodyweight: usesBodyweight,
            bodyweight_percent: bodyweightPercent,
          },
        ],
      },
    ]);
    setPickerOpen(false);
  };

  const updateSet = (
    ei: number,
    si: number,
    field: "weight" | "reps" | "uses_bodyweight" | "bodyweight_percent",
    value: number | boolean,
  ) =>
    setExercises((prev) =>
      prev.map((e, i) =>
        i !== ei
          ? e
          : { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, [field]: value } : s)) },
      ),
    );

  const toggleBodyweight = (ei: number, si: number) => {
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== ei) return e;
        const currentSet = e.sets[si];
        const newValue = !currentSet.uses_bodyweight;
        return {
          ...e,
          sets: e.sets.map((s, j) =>
            j === si
              ? {
                  ...s,
                  uses_bodyweight: newValue,
                  bodyweight_percent: newValue ? 100 : null,
                }
              : s,
          ),
        };
      }),
    );
  };

  const addSet = (ei: number) =>
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== ei) return e;
        const last = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [
            ...e.sets,
            last
              ? { ...last }
              : { weight: 0, reps: 0, uses_bodyweight: false, bodyweight_percent: null },
          ],
        };
      }),
    );

  const removeSet = (ei: number, si: number) =>
    setExercises((prev) =>
      prev.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.filter((_, j) => j !== si) })),
    );

  const removeExercise = (ei: number) => {
    setExercises((prev) => {
      const removed = prev[ei];
      let newExercises = prev.filter((_, i) => i !== ei);
      
      if (removed.superset_id) {
        const remainingInSuperset = newExercises.filter((e) => e.superset_id === removed.superset_id);
        if (remainingInSuperset.length === 0) {
          return newExercises;
        }
        return newExercises.map((e) => {
          if (e.superset_id !== removed.superset_id) return e;
          const idx = remainingInSuperset.indexOf(e);
          return { ...e, superset_order: idx + 1 };
        });
      }
      
      return newExercises;
    });
  };

  const splitSuperset = (supersetId: string) => {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.superset_id !== supersetId) return e;
        return { ...e, superset_id: null, superset_order: null };
      }),
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    const activeIndex = exercises.findIndex(
      (e) => `exercise-${e.superset_id || exercises.indexOf(e)}` === activeIdStr
    );
    const overIndex = exercises.findIndex(
      (e) => `exercise-${e.superset_id || exercises.indexOf(e)}` === overIdStr
    );

    if (activeIndex === -1 || overIndex === -1) return;

    const activeExercise = exercises[activeIndex];
    const overExercise = exercises[overIndex];

    if (activeExercise.superset_id && overExercise.superset_id) {
      if (activeExercise.superset_id !== overExercise.superset_id) {
        setExercises((prev) => {
          const newExercises = [...prev];
          const overSupersetId = overExercise.superset_id;
          
          return newExercises.map((e, i) => {
            if (i === activeIndex) {
              const maxOrder = Math.max(
                ...newExercises
                  .filter((ex) => ex.superset_id === overSupersetId)
                  .map((ex) => ex.superset_order || 0)
              );
              return {
                ...e,
                superset_id: overSupersetId,
                superset_order: maxOrder + 1,
              };
            }
            if (e.superset_id === activeExercise.superset_id && i !== activeIndex) {
              const remainingInActive = newExercises.filter(
                (ex) => ex.superset_id === activeExercise.superset_id && ex !== newExercises[i]
              );
              if (remainingInActive.length === 0) {
                return { ...e, superset_id: null, superset_order: null };
              }
              const idx = remainingInActive.indexOf(e);
              return { ...e, superset_order: idx + 1 };
            }
            return e;
          });
        });
      }
    } else if (!activeExercise.superset_id && !overExercise.superset_id) {
      if (activeIndex !== overIndex) {
        const newSupersetId = crypto.randomUUID().slice(0, 8);
        setExercises((prev) => {
          const newExercises = [...prev];
          const indices = [activeIndex, overIndex].sort((a, b) => a - b);
          
          return newExercises.map((e, i) => {
            if (i === indices[0]) {
              return { ...e, superset_id: newSupersetId, superset_order: 1 };
            }
            if (i === indices[1]) {
              return { ...e, superset_id: newSupersetId, superset_order: 2 };
            }
            return e;
          });
        });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    const activeIndex = exercises.findIndex(
      (e) => `exercise-${e.superset_id || exercises.indexOf(e)}` === activeIdStr
    );
    const overIndex = exercises.findIndex(
      (e) => `exercise-${e.superset_id || exercises.indexOf(e)}` === overIdStr
    );

    if (activeIndex === -1 || overIndex === -1) return;

    const activeExercise = exercises[activeIndex];
    const overExercise = exercises[overIndex];

    if (activeExercise.superset_id === overExercise.superset_id && !activeExercise.superset_id) {
      setExercises((prev) => arrayMove(prev, activeIndex, overIndex));
    }
  };

  const save = async () => {
    await create.mutateAsync({
      date,
      type,
      feeling,
      notes: notes.trim() || null,
      exercises: exercises.map((e, i) => ({ ...e, order: i })),
    });
    onSaved();
  };

  const activeExercise = activeId
    ? exercises.find(
        (e) => `exercise-${e.superset_id || exercises.indexOf(e)}` === activeId
      )
    : null;

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="mb-1 block text-xs text-muted">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker()}
              className="h-11 w-48 rounded-2xl border border-border bg-bg px-4 text-sm outline-none focus:border-zinc-500"
            />
          </div>
          <div className="flex-1">
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
        </div>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={exercises.map((e, i) => `exercise-${e.superset_id || i}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {exercises.map((ex, index) => (
              <SortableExerciseCard
                key={ex.superset_id || index}
                exercise={ex}
                index={index}
                inSuperset={!!ex.superset_id}
                onUpdateSet={updateSet}
                onAddSet={addSet}
                onRemoveSet={removeSet}
                onRemove={removeExercise}
                onToggleBodyweight={toggleBodyweight}
                onSplitSuperset={
                  ex.superset_id ? () => splitSuperset(ex.superset_id!) : undefined
                }
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeExercise && (
            <Card className="space-y-3 opacity-80 rotate-2">
              <div className="flex items-center justify-between p-3">
                <p className="font-medium">{activeExercise.exercise_name}</p>
              </div>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      <Button variant="outline" className="w-full" onClick={() => setPickerOpen(true)}>
        <Plus className="h-4 w-4 mr-2" /> Добавить упражнение
      </Button>

      <Card className="space-y-4">
        <div>
          <label className="mb-2 block text-xs text-muted">Самочувствие</label>
          <div className="flex gap-2">
            {FEELINGS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setFeeling(feeling === i + 1 ? null : i + 1)}
                className={cn(
                  "flex h-11 flex-1 items-center justify-center rounded-2xl border text-xl",
                  feeling === i + 1 ? "border-workouts bg-workouts/10" : "border-border",
                )}
              >
                {emoji}
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

      <Button
        className="w-full"
        size="lg"
        onClick={save}
        disabled={exercises.length === 0 || create.isPending}
      >
        {create.isPending ? "Сохранение…" : "Сохранить тренировку"}
      </Button>

      {pickerOpen && (
        <ExercisePicker onSelect={addExercise} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
