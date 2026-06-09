import { TrendingUp, TrendingDown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PersonalRecordSummary } from "./types";

interface Props {
  record: PersonalRecordSummary;
  onRemove: () => void;
  onClick?: () => void;
}

export function PersonalRecordCard({ record, onRemove, onClick }: Props) {
  const navigate = useNavigate();
  
  const dateStr = new Date(record.achieved_at).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "short", year: "numeric",
  });
  
  const prevDateStr = record.previous_achieved_at 
    ? new Date(record.previous_achieved_at).toLocaleDateString("ru-RU", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : null;
  
  // Прогресс в весе
  const weightDiff = record.previous_value !== null 
    ? record.max_weight - record.previous_value 
    : null;
  const isWeightPositive = weightDiff !== null && weightDiff > 0;
  const isWeightNegative = weightDiff !== null && weightDiff < 0;
  const weightDiffStr = weightDiff !== null 
    ? `${isWeightPositive ? "+" : ""}${Math.abs(weightDiff)} кг` 
    : "Новый рекорд!";
  
  // Прогресс в повторениях
  const repsDiff = record.previous_reps !== null 
    ? record.max_reps_at_max_weight - record.previous_reps 
    : null;
  const isRepsPositive = repsDiff !== null && repsDiff > 0;
  const isRepsNegative = repsDiff !== null && repsDiff < 0;
  const repsDiffStr = repsDiff !== null 
    ? `${isRepsPositive ? "+" : ""}${Math.abs(repsDiff)} повт.` 
    : null;

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border bg-surface px-4 py-3 hover:border-zinc-600 transition-colors",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-3 top-3 rounded-lg p-1 text-muted opacity-0 hover:text-red-400 transition-opacity group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="pr-6">
        <p className="text-sm font-medium">{record.exercise_name}</p>
        
        {record.max_weight > 0 ? (
          <>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-workouts">
                {record.max_weight}
              </span>
              <span className="text-sm text-muted">кг</span>
              <span className="text-xs text-muted">
                × {record.max_reps_at_max_weight} повт.
              </span>
            </div>
            
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {weightDiff !== null && (
                <span className={cn(
                  "flex items-center gap-0.5",
                  isWeightPositive ? "text-green-400" : isWeightNegative ? "text-red-400" : "text-workouts"
                )}>
                  {isWeightPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {weightDiffStr}
                </span>
              )}
              
              {repsDiff !== null && (
                <span className={cn(
                  "flex items-center gap-0.5",
                  isRepsPositive ? "text-green-400" : isRepsNegative ? "text-red-400" : "text-workouts"
                )}>
                  {isRepsPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {repsDiffStr}
                </span>
              )}
              
              {weightDiff !== null && prevDateStr && (
                <span className="text-muted">(с {prevDateStr})</span>
              )}
            </div>
            
            <div className="mt-1 text-xs text-muted">
              {dateStr}
            </div>
            
            {record.workout_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/workouts/${record.workout_id}`);
                }}
                className="mt-1 text-xs text-workouts hover:underline"
              >
                → Тренировка
              </button>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Попробуйте свои силы и обновите результат
          </p>
        )}
      </div>
    </div>
  );
}