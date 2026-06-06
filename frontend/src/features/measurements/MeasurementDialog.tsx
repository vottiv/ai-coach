import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCreateMeasurement, useUpdateMeasurement } from "./api";
import type { BodyMeasurement } from "./types";

const FIELDS = [
  { key: "weight", label: "Вес, кг", placeholder: "70" },
  { key: "bicep_left", label: "Бицепс левый, см", placeholder: "35" },
  { key: "bicep_right", label: "Бицепс правый, см", placeholder: "35" },
  { key: "shoulders", label: "Плечи, см", placeholder: "48" },
  { key: "chest", label: "Грудь, см", placeholder: "100" },
  { key: "waist", label: "Талия, см", placeholder: "80" },
  { key: "glutes", label: "Ягодицы, см", placeholder: "95" },
  { key: "hips_left", label: "Бедро левое, см", placeholder: "58" },
  { key: "hips_right", label: "Бедро правое, см", placeholder: "58" },
  { key: "calves_left", label: "Икры левые, см", placeholder: "37" },
  { key: "calves_right", label: "Икры правые, см", placeholder: "37" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

const emptyValues = (): Record<FieldKey, string> => ({
  weight: "", bicep_left: "", bicep_right: "", shoulders: "", chest: "",
  waist: "", glutes: "", hips_left: "", hips_right: "", calves_left: "", calves_right: "",
});

const todayIso = () => new Date().toISOString().slice(0, 10);

interface Props {
  open: boolean;
  onClose: () => void;
  measurement?: BodyMeasurement | null;
}

export function MeasurementDialog({ open, onClose, measurement }: Props) {
  const createMut = useCreateMeasurement();
  const updateMut = useUpdateMeasurement();

  const [dateValue, setDateValue] = useState(todayIso());
  const [values, setValues] = useState<Record<FieldKey, string>>(emptyValues);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (measurement) {
      const v = emptyValues();
      for (const f of FIELDS) {
        const val = measurement[f.key];
        if (val != null) v[f.key] = String(val);
      }
      setValues(v);
      setDateValue(measurement.measured_at.slice(0, 10));
    } else {
      setValues(emptyValues());
      setDateValue(todayIso());
    }
  }, [open, measurement]);

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { measured_at: dateValue };
      for (const f of FIELDS) {
        const v = values[f.key];
        if (v) body[f.key] = Number(v);
      }
      if (Object.keys(body).length <= 1) return;

      if (measurement) {
        await updateMut.mutateAsync({ id: measurement.id, body });
      } else {
        await createMut.mutateAsync(body as never);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto space-y-4 p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-medium">{measurement ? "Редактировать замер" : "Новый замер"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-muted">Дата замера</label>
          <input
            type="date"
            className="h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-zinc-500"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            max={todayIso()}
          />
        </div>

        <div className="space-y-2">
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
          Сохранить
        </Button>
      </Card>
    </div>
  );
}