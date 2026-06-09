import { Check, Plus, Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useCreateExercise, useExerciseMeta, useExercises } from "./api";
import { EQUIPMENT_TYPES, type Exercise } from "./types";

interface Props {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({ onSelect, onClose }: Props) {
  const [category, setCategory] = useState<string>("Все");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const { data: meta } = useExerciseMeta();
  const { data: exercises, isLoading } = useExercises(category, search.trim() || undefined);

  const categories = ["Все", ...(meta?.categories ?? [])];

  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const handleConfirm = () => {
    if (selectedExercise) {
      onSelect(selectedExercise);
      setSelectedExercise(null);
    }
  };

  const handleCancel = () => {
    setSelectedExercise(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <button onClick={handleCancel} className="rounded-2xl p-2 hover:bg-surface">
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Выбор упражнения</h2>
          <p className="text-xs text-muted">Выберите упражнение для отслеживания</p>
        </div>
        <Button size="icon" variant="outline" onClick={() => setCreating((v) => !v)}>
          <Plus className="h-5 w-5" />
        </Button>
      </header>

      {creating && (
        <CustomExerciseForm
          categories={meta?.categories ?? []}
          muscleGroups={meta?.muscle_groups ?? []}
          onCreated={(ex) => {
            setCreating(false);
            onSelect(ex);
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      <div className="border-b border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск упражнения"
            className="h-11 w-full rounded-2xl border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-zinc-500"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                category === c
                  ? "border-workouts bg-workouts/10 text-workouts"
                  : "border-border text-muted hover:text-zinc-200",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && <p className="text-sm text-muted">Загрузка…</p>}
        {!isLoading && exercises?.length === 0 && (
          <p className="text-sm text-muted">Ничего не найдено. Создайте своё упражнение.</p>
        )}
        <ul className="space-y-2">
          {exercises?.map((ex) => (
            <li key={ex.id}>
              <button
                onClick={() => handleExerciseClick(ex)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left",
                  selectedExercise?.id === ex.id && "border-workouts bg-workouts/10"
                )}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {ex.name}
                    {ex.is_custom && (
                      <span className="ml-2 text-xs text-workouts">своё</span>
                    )}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    <span>{ex.muscle_groups.join(" · ")}</span>
                    {ex.equipment_type === "bodyweight" && (
                      <span className="rounded-full bg-workouts/10 px-1.5 py-0.5 text-workouts">
                        вес тела
                      </span>
                    )}
                  </div>
                </div>
                {selectedExercise?.id === ex.id ? (
                  <Check className="h-4 w-4 text-workouts" />
                ) : (
                  <Check className="h-4 w-4 text-muted opacity-0" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      {selectedExercise && (
        <div className="border-t border-border p-4">
          <Button 
            onClick={handleConfirm}
            disabled={!selectedExercise}
            className="w-full"
          >
            Добавить {selectedExercise.name}
          </Button>
        </div>
      )}
    </div>
  );
}

function CustomExerciseForm({
  categories,
  muscleGroups,
  onCreated,
  onCancel,
}: {
  categories: string[];
  muscleGroups: string[];
  onCreated: (ex: Exercise) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Всё тело");
  const [groups, setGroups] = useState<string[]>([]);
  const [equipmentType, setEquipmentType] = useState("other");
  const [bodyweightPercent, setBodyweightPercent] = useState<number | null>(null);
  const create = useCreateExercise();

  const toggle = (g: string) =>
    setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const handleEquipmentChange = (value: string) => {
    setEquipmentType(value);
    const equipment = EQUIPMENT_TYPES.find((e) => e.key === value);
    setBodyweightPercent(equipment?.bodyweight_percent ?? null);
  };

  const submit = async () => {
    if (!name.trim()) return;
    const ex = await create.mutateAsync({
      name: name.trim(),
      category,
      muscle_groups: groups,
      equipment_type: equipmentType,
      default_bodyweight_percent: bodyweightPercent,
    });
    onCreated(ex);
  };

  return (
    <div className="space-y-3 border-b border-border bg-surface p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название упражнения"
        className="h-11 w-full rounded-2xl border border-border bg-bg px-4 text-sm outline-none focus:border-zinc-500"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="h-11 w-full rounded-2xl border border-border bg-bg px-3 text-sm outline-none focus:border-zinc-500"
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <div>
        <p className="mb-2 text-xs text-muted">Тип оборудования</p>
        <select
          value={equipmentType}
          onChange={(e) => handleEquipmentChange(e.target.value)}
          className="h-11 w-full rounded-2xl border border-border bg-bg px-3 text-sm outline-none focus:border-zinc-500"
        >
          {EQUIPMENT_TYPES.map((e) => (
            <option key={e.key} value={e.key}>
              {e.label}
            </option>
          ))}
        </select>
      </div>
      {equipmentType === "bodyweight" && (
        <div>
          <label className="mb-1 block text-xs text-muted">Процент веса тела</label>
          <input
            type="number"
            value={bodyweightPercent ?? 100}
            onChange={(e) => setBodyweightPercent(Number(e.target.value))}
            min="0"
            max="200"
            className="h-11 w-full rounded-2xl border border-border bg-bg px-4 text-sm outline-none focus:border-zinc-500"
          />
          <p className="mt-1 text-xs text-muted">
            {bodyweightPercent}% вашего веса будет учитываться как нагрузка
          </p>
        </div>
      )}
      <div>
        <p className="mb-2 text-xs text-muted">Мышечные группы (можно несколько)</p>
        <div className="flex flex-wrap gap-2">
          {muscleGroups.map((g) => (
            <button
              key={g}
              onClick={() => toggle(g)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                groups.includes(g)
                  ? "border-workouts bg-workouts/10 text-workouts"
                  : "border-border text-muted",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={submit} disabled={!name.trim() || create.isPending} className="flex-1">
          Создать
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  );
}
