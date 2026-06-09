import { X, Calendar, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PersonalRecordHistory } from "./types";
import { usePrHistory } from "./api";

interface Props {
  exerciseId: number;
  exerciseName: string;
  open: boolean;
  onClose: () => void;
}

export function PersonalRecordHistoryDialog({
  exerciseId,
  exerciseName,
  open,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const exerciseKey = exerciseId === -1 ? exerciseName : String(exerciseId);
  const { data: history, isLoading } = usePrHistory(exerciseKey);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-bg p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            История рекордов: {exerciseName}
          </h3>
          <button onClick={onClose} className="rounded-xl p-1.5 hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading && <p className="text-sm text-muted">Загрузка…</p>}

        {history && history.length === 0 && (
          <div className="py-8 text-center">
            <Dumbbell className="mx-auto h-10 w-10 text-muted mb-3" />
            <p className="text-sm text-muted">История пуста</p>
          </div>
        )}

        {history && history.length > 0 && (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl border border-border bg-surface px-4 py-3 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {item.value} кг × {item.reps_at_max_weight} повт.
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.achieved_at).toLocaleDateString("ru-RU", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </div>
                  </div>
                  
                  {item.workout_id && (
                    <button
                      onClick={() => navigate(`/workouts/${item.workout_id}`)}
                      className="text-xs text-workouts hover:underline"
                    >
                      → Тренировка
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}