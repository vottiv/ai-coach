import { Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";

import { useDeleteMeal } from "./api";
import { MEAL_TYPE_LABEL, type NutritionLog } from "./types";

export function MealCard({ log }: { log: NutritionLog }) {
  const del = useDeleteMeal();

  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{MEAL_TYPE_LABEL[log.meal_type]}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">{Math.round(log.totals.calories)} ккал</span>
          <button
            onClick={() => del.mutate(log.id)}
            disabled={del.isPending}
            className="text-muted hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {log.foods.map((f) => (
          <div key={f.id} className="flex justify-between text-xs text-muted">
            <span>
              {f.name}
              {f.weight ? ` · ${Math.round(f.weight)} г` : ""}
            </span>
            <span>
              Б{Math.round(f.protein)} Ж{Math.round(f.fat)} У{Math.round(f.carbs)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
