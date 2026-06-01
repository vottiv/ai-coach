import { Check, Plus, Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useCreateExercise, useExerciseMeta, useExercises } from "./api";
import type { Exercise } from "./types";

interface Props {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({ onSelect, onClose }: Props) {
  const [category, setCategory] = useState<string>("Все");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: meta } = useExerciseMeta();
  const { data: exercises, isLoading } = useExercises(category, search.trim() || undefined);

  const categories = ["Все", ...(meta?.categories ?? [])];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <button onClick={onClose} className="rounded-2xl p-2 hover:bg-surface">
          <X className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-lg font-semibold">Выбор упражнения</h2>
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
                onClick={() => onSelect(ex)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left hover:border-zinc-600"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {ex.name}
                    {ex.is_custom && (
                      <span className="ml-2 text-xs text-workouts">своё</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{ex.muscle_groups.join(" · ")}</p>
                </div>
                <Check className="h-4 w-4 text-muted" />
              </button>
            </li>
          ))}
        </ul>
      </div>
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
  const create = useCreateExercise();

  const toggle = (g: string) =>
    setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const submit = async () => {
    if (!name.trim()) return;
    const ex = await create.mutateAsync({
      name: name.trim(),
      category,
      muscle_groups: groups,
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
