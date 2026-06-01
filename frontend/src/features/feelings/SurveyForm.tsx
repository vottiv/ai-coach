import { Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useSaveSubjective } from "./api";
import {
  EVENING_QUESTIONS,
  MORNING_QUESTIONS,
  type MetricKey,
  type Slot,
  type SubjectiveIn,
  type SubjectiveLog,
} from "./types";

interface Props {
  slot: Slot;
  date: string;
  initial: SubjectiveLog | null;
  onSaved: () => void;
}

export function SurveyForm({ slot, date, initial, onSaved }: Props) {
  const questions = slot === "morning" ? MORNING_QUESTIONS : EVENING_QUESTIONS;
  const [scores, setScores] = useState<Partial<Record<MetricKey, number>>>(() => {
    const init: Partial<Record<MetricKey, number>> = {};
    questions.forEach((q) => {
      const v = initial?.[q.key];
      if (v != null) init[q.key] = v;
    });
    return init;
  });
  const [weight, setWeight] = useState<string>(initial?.body_weight?.toString() ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const save = useSaveSubjective();

  const setScore = (key: MetricKey, value: number) =>
    setScores((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    const body: SubjectiveIn = { date, slot, notes: notes.trim() || null };
    questions.forEach((q) => {
      body[q.key] = scores[q.key] ?? null;
    });
    if (slot === "morning") body.body_weight = weight ? Number(weight) : null;
    await save.mutateAsync(body);
    onSaved();
  };

  const answered = questions.filter((q) => scores[q.key]).length;

  return (
    <Card className="space-y-4">
      {questions.map((q) => (
        <div key={q.key}>
          <p className="mb-1.5 text-sm">{q.label}</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setScore(q.key, n)}
                className={cn(
                  "h-10 flex-1 rounded-xl border text-sm font-medium transition-colors",
                  scores[q.key] === n
                    ? "border-feelings bg-feelings text-white"
                    : "border-border text-muted hover:border-feelings/50",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}

      {slot === "morning" && (
        <div>
          <label className="mb-1 block text-xs text-muted">Вес тела, кг (опционально)</label>
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="например, 78.5"
            className="h-11 w-full rounded-2xl border border-border bg-bg px-4 text-sm outline-none focus:border-feelings"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-muted">Заметка (опционально)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-2xl border border-border bg-bg p-3 text-sm outline-none focus:border-feelings"
        />
      </div>

      <Button
        className="w-full bg-feelings text-white hover:bg-feelings/90"
        onClick={submit}
        disabled={answered === 0 || save.isPending}
      >
        {save.isPending ? (
          "Сохранение…"
        ) : initial ? (
          <>
            <Check className="h-4 w-4" /> Обновить
          </>
        ) : (
          "Сохранить"
        )}
      </Button>
    </Card>
  );
}
