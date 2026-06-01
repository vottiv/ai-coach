import { Camera, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useCreateMeal, useRecognizeFood } from "./api";
import { MEAL_TYPES, foodCalories, type FoodIn, type MealType } from "./types";

const todayIso = () => new Date().toISOString().slice(0, 10);
const emptyFood = (): FoodIn => ({ name: "", weight: 0, protein: 0, fat: 0, carbs: 0 });

export function MealForm({ onSaved }: { onSaved: () => void }) {
  const [date, setDate] = useState(todayIso());
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [foods, setFoods] = useState<FoodIn[]>([emptyFood()]);
  const [recognizeNote, setRecognizeNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const create = useCreateMeal();
  const recognize = useRecognizeFood();

  const updateFood = (i: number, field: keyof FoodIn, value: string) =>
    setFoods((prev) =>
      prev.map((f, j) =>
        j !== i ? f : { ...f, [field]: field === "name" ? value : Number(value) },
      ),
    );

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await recognize.mutateAsync(file);
    setRecognizeNote(result.note);
    if (result.foods.length) {
      setFoods((prev) => [
        ...prev.filter((f) => f.name.trim()),
        ...result.foods.map((f) => ({ ...f })),
      ]);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const valid = foods.filter((f) => f.name.trim());
  const totals = valid.reduce(
    (acc, f) => ({
      calories: acc.calories + foodCalories(f.protein, f.fat, f.carbs),
      protein: acc.protein + f.protein,
      fat: acc.fat + f.fat,
      carbs: acc.carbs + f.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );

  const save = async () => {
    await create.mutateAsync({ date, meal_type: mealType, foods: valid });
    setFoods([emptyFood()]);
    setRecognizeNote(null);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Дата</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 w-full rounded-2xl border border-border bg-bg px-4 text-sm outline-none focus:border-nutrition"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Приём пищи</label>
          <div className="flex flex-wrap gap-2">
            {MEAL_TYPES.map((m) => (
              <button
                key={m.key}
                onClick={() => setMealType(m.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs",
                  mealType === m.key
                    ? "border-nutrition bg-nutrition/10 text-nutrition"
                    : "border-border text-muted",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center gap-3 text-left"
          disabled={recognize.isPending}
        >
          <span className="rounded-2xl bg-bg p-2.5 text-nutrition">
            <Camera className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {recognize.isPending ? "Распознаём…" : "Сфотографировать еду"}
            </p>
            <p className="text-xs text-muted">Авто-заполнение БЖУ (или введите вручную)</p>
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhoto}
        />
        {recognizeNote && <p className="text-xs text-amber-400">{recognizeNote}</p>}
      </Card>

      {foods.map((food, i) => (
        <Card key={i} className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={food.name}
              onChange={(e) => updateFood(i, "name", e.target.value)}
              placeholder="Название блюда"
              className="h-10 flex-1 rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-nutrition"
            />
            {foods.length > 1 && (
              <button
                onClick={() => setFoods((prev) => prev.filter((_, j) => j !== i))}
                className="p-1 text-muted hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Вес, г" value={food.weight} onChange={(v) => updateFood(i, "weight", v)} />
            <Field label="Белки, г" value={food.protein} onChange={(v) => updateFood(i, "protein", v)} />
            <Field label="Жиры, г" value={food.fat} onChange={(v) => updateFood(i, "fat", v)} />
            <Field label="Углеводы, г" value={food.carbs} onChange={(v) => updateFood(i, "carbs", v)} />
          </div>
          <p className="text-right text-xs text-muted">
            ≈ {foodCalories(food.protein, food.fat, food.carbs)} ккал
          </p>
        </Card>
      ))}

      <Button variant="outline" className="w-full" onClick={() => setFoods((prev) => [...prev, emptyFood()])}>
        <Plus className="h-4 w-4" /> Добавить блюдо
      </Button>

      {valid.length > 0 && (
        <Card>
          <p className="mb-2 text-xs text-muted">Итого</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Stat label="Ккал" value={Math.round(totals.calories)} />
            <Stat label="Б" value={Math.round(totals.protein)} />
            <Stat label="Ж" value={Math.round(totals.fat)} />
            <Stat label="У" value={Math.round(totals.carbs)} />
          </div>
        </Card>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={save}
        disabled={valid.length === 0 || create.isPending}
      >
        {create.isPending ? "Сохранение…" : "Сохранить приём пищи"}
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-nutrition"
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-base font-semibold text-nutrition">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
