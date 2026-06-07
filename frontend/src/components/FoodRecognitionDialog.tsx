import { useState } from "react";
import { Camera, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RecognizedFood {
  name: string;
  weight: number;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
}

interface FoodRecognitionDialogProps {
  onConfirm: (foods: RecognizedFood[]) => void;
  onCancel: () => void;
}

export function FoodRecognitionDialog({
  onConfirm,
  onCancel,
}: FoodRecognitionDialogProps) {
  const [step, setStep] = useState<"upload" | "recognizing" | "result">("upload");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [foods, setFoods] = useState<RecognizedFood[]>([]);
  const [error, setError] = useState<string>("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Создаем превью
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // Распознаем
    setStep("recognizing");
    setError("");

    try {
      const form = new FormData();
      form.append("photo", file);

      const res = await fetch("/api/v1/nutrition/recognize", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        throw new Error("Не удалось распознать изображение");
      }

      const data = await res.json();

      // Рассчитываем калории для каждого продукта
      const recognizedFoods = (data.foods || []).map((food: any) => ({
        ...food,
        calories: Math.round(food.protein * 4 + food.fat * 9 + food.carbs * 4),
      }));

      setFoods(recognizedFoods);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка распознавания");
      setStep("upload");
    }
  };

  const updateFood = (index: number, field: keyof RecognizedFood, value: number | string) => {
    setFoods((prev) =>
      prev.map((f, i) =>
        i !== index
          ? f
          : {
              ...f,
              [field]: value,
              calories:
                field === "name"
                  ? f.calories
                  : Math.round(
                      (field === "protein" ? value : f.protein) * 4 +
                      (field === "fat" ? value : f.fat) * 9 +
                      (field === "carbs" ? value : f.carbs) * 4,
                    ),
            },
      ),
    );
  };

  const removeFood = (index: number) => {
    setFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const addFood = () => {
    setFoods((prev) => [
      ...prev,
      {
        name: "",
        weight: 100,
        protein: 0,
        fat: 0,
        carbs: 0,
        calories: 0,
      },
    ]);
  };

  const totals = foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      fat: acc.fat + f.fat,
      carbs: acc.carbs + f.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );

  if (step === "upload") {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-lg font-semibold">Распознать еду с фото</h3>
          <p className="mb-4 text-sm text-muted">
            Загрузите фото блюда, и мы автоматически заполним форму с продуктами и их БЖУ
          </p>
        </div>

        <Card className="border-2 border-dashed">
          <label className="flex cursor-pointer flex-col items-center justify-center p-8">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
            <span className="mb-2 rounded-full bg-bg p-3">
              <Camera className="h-8 w-8 text-nutrition" />
            </span>
            <p className="text-sm font-medium">Сделать фото или выбрать файл</p>
            <p className="text-xs text-muted">JPEG, PNG до 10MB</p>
          </label>
        </Card>

        {error && (
          <Card className="border-red-400/50 bg-red-400/10 p-3">
            <p className="text-sm text-red-400">{error}</p>
          </Card>
        )}

        <Button variant="outline" className="w-full" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    );
  }

  if (step === "recognizing") {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-lg font-semibold">Распознаем изображение...</h3>
          <p className="text-sm text-muted">AI анализирует продукты на фото</p>
        </div>

        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-nutrition" />
        </div>

        {imageUrl && (
          <div className="overflow-hidden rounded-2xl">
            <img src={imageUrl} alt="Загруженное фото" className="h-48 w-full object-cover" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-lg font-semibold">Результаты распознавания</h3>
        <p className="text-sm text-muted">
          Проверьте и отредактируйте распознанные продукты перед сохранением
        </p>
      </div>

      {imageUrl && (
        <div className="overflow-hidden rounded-2xl">
          <img src={imageUrl} alt="Загруженное фото" className="h-48 w-full object-cover" />
        </div>
      )}

      <div className="space-y-3">
        {foods.map((food, index) => (
          <Card key={index} className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={food.name}
                onChange={(e) => updateFood(index, "name", e.target.value)}
                placeholder="Название продукта"
                className="flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-nutrition"
              />
              <button
                onClick={() => removeFood(index)}
                className="p-1 text-muted hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="mb-1 block text-xs text-muted">Вес (г)</label>
                <input
                  type="number"
                  value={food.weight}
                  onChange={(e) => updateFood(index, "weight", Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-border bg-bg px-2 text-sm outline-none focus:border-nutrition"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Б (г)</label>
                <input
                  type="number"
                  value={food.protein}
                  onChange={(e) => updateFood(index, "protein", Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-border bg-bg px-2 text-sm outline-none focus:border-nutrition"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Ж (г)</label>
                <input
                  type="number"
                  value={food.fat}
                  onChange={(e) => updateFood(index, "fat", Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-border bg-bg px-2 text-sm outline-none focus:border-nutrition"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">У (г)</label>
                <input
                  type="number"
                  value={food.carbs}
                  onChange={(e) => updateFood(index, "carbs", Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-border bg-bg px-2 text-sm outline-none focus:border-nutrition"
                />
              </div>
            </div>

            <p className="text-right text-xs text-muted">≈ {food.calories} ккал</p>
          </Card>
        ))}
      </div>

      <Button variant="outline" className="w-full" onClick={addFood}>
        + Добавить продукт
      </Button>

      {foods.length > 0 && (
        <Card className="space-y-3 p-4">
          <p className="mb-2 text-xs text-muted">Итого</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-base font-semibold text-nutrition">{Math.round(totals.calories)}</p>
              <p className="text-xs text-muted">Ккал</p>
            </div>
            <div>
              <p className="text-base font-semibold text-nutrition">{Math.round(totals.protein)}</p>
              <p className="text-xs text-muted">Б</p>
            </div>
            <div>
              <p className="text-base font-semibold text-nutrition">{Math.round(totals.fat)}</p>
              <p className="text-xs text-muted">Ж</p>
            </div>
            <div>
              <p className="text-base font-semibold text-nutrition">{Math.round(totals.carbs)}</p>
              <p className="text-xs text-muted">У</p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Отмена
        </Button>
        <Button
          className="flex-1"
          onClick={() => onConfirm(foods.filter((f) => f.name.trim()))}
          disabled={foods.filter((f) => f.name.trim()).length === 0}
        >
          <Check className="mr-2 h-4 w-4" />
          Добавить
        </Button>
      </div>
    </div>
  );
}