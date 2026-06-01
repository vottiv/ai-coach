import { useState } from "react";
import { Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCreateMeasurement } from "./api";

const FIELDS = [
  { key: "weight", label: "Вес, кг", placeholder: "70" },
  { key: "bicep", label: "Бицепс, см", placeholder: "35" },
  { key: "shoulders", label: "Плечи, см", placeholder: "48" },
  { key: "chest", label: "Грудь, см", placeholder: "100" },
  { key: "waist", label: "Талия, см", placeholder: "80" },
  { key: "glutes", label: "Ягодицы, см", placeholder: "95" },
  { key: "hips", label: "Бёдра, см", placeholder: "58" },
  { key: "calves", label: "Икры, см", placeholder: "37" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

const todayIso = () => new Date().toISOString().slice(0, 10);

export function MeasurementForm({ onSaved }: { onSaved?: () => void }) {
  const mutate = useCreateMeasurement();
  const [values, setValues] = useState<Record<FieldKey, string>>({
    weight: "",
    bicep: "",
    shoulders: "",
    chest: "",
    waist: "",
    glutes: "",
    hips: "",
    calves: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        measured_at: todayIso(),
      };
      for (const f of FIELDS) {
        const v = values[f.key];
        if (v) body[f.key] = Number(v);
      }
      if (Object.keys(body).length <= 1) return;
      await mutate.mutateAsync(body as never);
      setValues({ weight: "", bicep: "", shoulders: "", chest: "", waist: "", glutes: "", hips: "", calves: "" });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <Ruler className="h-4 w-4 text-workouts" />
        <h2 className="font-medium">Новый замер</h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-[11px] text-muted">{f.label}</label>
            <input
              className="h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-zinc-500"
              inputMode="decimal"
              placeholder={f.placeholder}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <Button className="w-full" onClick={handleSave} disabled={saving}>
        Сохранить замер
      </Button>
    </Card>
  );
}
