import { Check } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { useToday } from "./api";
import { SurveyForm } from "./SurveyForm";
import type { Slot } from "./types";

const todayIso = () => new Date().toISOString().slice(0, 10);

export function FeelingsToday() {
  const date = todayIso();
  const { data, isLoading } = useToday(date);
  const [slot, setSlot] = useState<Slot>(new Date().getHours() < 14 ? "morning" : "evening");

  const filled: Record<Slot, boolean> = {
    morning: !!data?.morning,
    evening: !!data?.evening,
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-2xl border border-border bg-surface p-1">
        {(["morning", "evening"] as Slot[]).map((s) => (
          <button
            key={s}
            onClick={() => setSlot(s)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition-colors",
              slot === s ? "bg-feelings text-white" : "text-muted hover:text-zinc-200",
            )}
          >
            {s === "morning" ? "Утро" : "Вечер"}
            {filled[s] && <Check className="h-3.5 w-3.5" />}
          </button>
        ))}
      </div>

      <p className="px-1 text-xs text-muted">
        {slot === "morning"
          ? "Сразу после пробуждения · ~20 секунд"
          : "Перед сном · ~20 секунд"}
      </p>

      {isLoading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : (
        <SurveyForm
          key={slot}
          slot={slot}
          date={date}
          initial={slot === "morning" ? data?.morning ?? null : data?.evening ?? null}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
